import * as THREE from 'three'

/**
 * A Tessendorf FFT ocean.
 *
 * The wave field is not animated geometry — it is a spectrum. Each frame the
 * GPU builds a frequency-domain snapshot of the sea from a Phillips spectrum,
 * runs an inverse FFT on it, and reads the result back as a displacement map.
 * That is what gives real ocean its character: waves that interfere, sharpen at
 * the crests, and never repeat on any period you can see.
 *
 * The pipeline, once per frame:
 *
 *   h0(k)  ── precomputed once, the initial spectrum + its mirrored conjugate
 *     │
 *   h(k,t) ── advance every wave by its own dispersion ω = √(g·|k|)
 *     │       and pack two complex fields into one RGBA texture:
 *     │       .rg = height, .ba = horizontal displacement (Dx + i·Dz)
 *     │
 *   FFT    ── log2(N) butterfly passes horizontally, then log2(N) vertically.
 *     │       Both packed fields ride through together, so a 256² ocean costs
 *     │       16 passes rather than 32.
 *     │
 *   permute ─ undo the (-1)^(x+y) spectral shift, write (Dx, height, Dz)
 *
 * The mesh then reads that map in its vertex shader. Geometry carries the big
 * swell; surface detail comes from normals sampled per fragment, which is far
 * cheaper than the vertex density it would otherwise take.
 */

export interface OceanRendererOptions {
  canvas: HTMLCanvasElement
  /** FFT resolution. Must be a power of two. 256 desktop, 128 phones. */
  size?: number
  /** World size of one FFT tile, in metres. Sets the longest wavelength. */
  patchSize?: number
  /** Wind vector. Length is speed in m/s and drives the whole sea state. */
  wind?: [number, number]
  /** Horizontal displacement gain. Above ~1.5 the crests start to self-intersect. */
  choppiness?: number
  /**
   * Roughly the RMS wave height in metres — 0.5 is a calm swell, 3 is a gale.
   *
   * Phillips' constant is not a height, it is a spectral density, and the
   * relationship between the two also moves with patchSize and wind. The
   * conversion below was fitted by reading the height field back off the GPU
   * (A = 4e-7 gave 0.091 m RMS at the defaults) and holds to within a few tens
   * of percent across sane settings, which is all a visual knob needs.
   */
  amplitude?: number
  /** Mesh subdivisions per side. */
  segments?: number
  /** Skip animation and render a single frame (prefers-reduced-motion). */
  staticFrame?: boolean
  /** Cap on devicePixelRatio. */
  maxPixelRatio?: number
}

export interface OceanRenderer {
  /** Resolves after the first frame is on screen; rejects if unsupported. */
  ready: Promise<void>
  dispose: () => void
}

const PI = Math.PI

/* ------------------------------------------------------------------ shaders */

const FULLSCREEN_VERT = /* glsl */ `
in vec3 position;
void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const COMMON = /* glsl */ `
precision highp float;
precision highp int;
const float PI = 3.141592653589793;
const float G = 9.81;
vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
`

/** Initial spectrum. Deterministic: the randomness is a hash of the texel. */
const H0K_FRAG = /* glsl */ `
${COMMON}
out vec4 fragColor;
uniform int uN;
uniform float uPatchSize;
uniform vec2 uWind;
uniform float uAmplitude;
uniform float uCapillary;

uint hashU(uint x) {
  x += (x << 10u); x ^= (x >>  6u); x += (x <<  3u);
  x ^= (x >> 11u); x += (x << 15u); return x;
}
float urand(uvec2 c, uint seed) {
  uint h = hashU(c.x ^ hashU(c.y ^ hashU(seed)));
  return float(h & 0x00FFFFFFu) / float(0x01000000u);
}
/** Box-Muller: two independent N(0,1) samples from two uniforms. */
vec2 gauss(uvec2 c, uint seed) {
  float u1 = max(urand(c, seed), 1e-6);
  float u2 = urand(c, seed + 1u);
  float r = sqrt(-2.0 * log(u1));
  float t = 2.0 * PI * u2;
  return vec2(r * cos(t), r * sin(t));
}

float phillips(vec2 k) {
  float kk = dot(k, k);
  if (kk < 1e-12) return 0.0;
  float V = length(uWind);
  if (V < 1e-6) return 0.0;
  float L = V * V / G;                      // largest wave the wind can raise
  float kdotw = dot(normalize(k), uWind / V);
  float p = uAmplitude * exp(-1.0 / (kk * L * L)) / (kk * kk) * (kdotw * kdotw);
  if (kdotw < 0.0) p *= 0.07;               // waves against the wind are damped
  p *= exp(-kk * uCapillary * uCapillary);  // cut the ripples the grid can't hold
  return p;
}

void main() {
  ivec2 xy = ivec2(gl_FragCoord.xy);
  int half_ = uN / 2;
  vec2 k = 2.0 * PI * vec2(xy - ivec2(half_)) / uPatchSize;

  // h0(-k) has to come from the mirrored texel's own randomness, or the field
  // loses its Hermitian symmetry and the inverse FFT stops being real-valued.
  ivec2 mirror = ivec2((uN - xy.x) % uN, (uN - xy.y) % uN);

  vec2 h0k  = gauss(uvec2(xy),     0u) * sqrt(phillips( k) * 0.5);
  vec2 h0mk = gauss(uvec2(mirror), 0u) * sqrt(phillips(-k) * 0.5);

  fragColor = vec4(h0k, h0mk.x, -h0mk.y);   // .zw is conj(h0(-k))
}
`

/** Advance the spectrum to time t and pack height + displacement together. */
const HKT_FRAG = /* glsl */ `
${COMMON}
out vec4 fragColor;
uniform sampler2D uH0k;
uniform int uN;
uniform float uPatchSize;
uniform float uTime;

void main() {
  ivec2 xy = ivec2(gl_FragCoord.xy);
  vec4 h0 = texelFetch(uH0k, xy, 0);

  vec2 k = 2.0 * PI * vec2(xy - ivec2(uN / 2)) / uPatchSize;
  float kLen = max(length(k), 1e-6);

  float wt = sqrt(G * kLen) * uTime;        // deep-water dispersion
  vec2 e  = vec2(cos(wt),  sin(wt));
  vec2 ec = vec2(cos(wt), -sin(wt));

  vec2 h = cmul(h0.xy, e) + cmul(h0.zw, ec);

  // Horizontal displacement is the Hilbert transform of the height, per axis.
  vec2 kn = k / kLen;
  vec2 dx = cmul(vec2(0.0, -kn.x), h);
  vec2 dz = cmul(vec2(0.0, -kn.y), h);
  // Two real fields ride one complex transform: Dx as the real part, Dz imaginary.
  vec2 packed = dx + cmul(vec2(0.0, 1.0), dz);

  fragColor = vec4(h, packed);
}
`

/**
 * One radix-2 Cooley-Tukey stage. The butterfly texture supplies the twiddle
 * factor and the index pair, so the shader is just a complex multiply-add —
 * applied to .rg and .ba at once.
 */
const BUTTERFLY_FRAG = /* glsl */ `
${COMMON}
out vec4 fragColor;
uniform sampler2D uButterfly;
uniform sampler2D uInput;
uniform int uStage;
uniform int uVertical;

void main() {
  ivec2 xy = ivec2(gl_FragCoord.xy);
  int lane = (uVertical == 1) ? xy.y : xy.x;
  vec4 bf = texelFetch(uButterfly, ivec2(uStage, lane), 0);
  vec2 w = bf.xy;

  ivec2 topC, botC;
  if (uVertical == 1) {
    topC = ivec2(xy.x, int(bf.z));
    botC = ivec2(xy.x, int(bf.w));
  } else {
    topC = ivec2(int(bf.z), xy.y);
    botC = ivec2(int(bf.w), xy.y);
  }

  vec4 top = texelFetch(uInput, topC, 0);
  vec4 bot = texelFetch(uInput, botC, 0);

  fragColor = vec4(top.rg + cmul(w, bot.rg),
                   top.ba + cmul(w, bot.ba));
}
`

/** Undo the FFT's checkerboard sign, normalise, and lay out (Dx, height, Dz). */
const PERMUTE_FRAG = /* glsl */ `
${COMMON}
out vec4 fragColor;
uniform sampler2D uInput;
uniform float uChoppiness;

void main() {
  ivec2 xy = ivec2(gl_FragCoord.xy);
  vec4 d = texelFetch(uInput, xy, 0);
  // The spectrum is indexed from -N/2, so the transform comes out shifted by
  // half a period in both axes. This checkerboard sign undoes that.
  float perm = (((xy.x + xy.y) & 1) == 0) ? 1.0 : -1.0;
  fragColor = vec4(perm * d.z * uChoppiness,   // Dx
                   perm * d.x,                 // height
                   perm * d.w * uChoppiness,   // Dz
                   1.0);
}
`

const OCEAN_VERT = /* glsl */ `
uniform sampler2D uDisplacement;
uniform float uPatchSize;
uniform float uDetailScale;
out vec3 vWorld;
out vec2 vUvA;
out vec2 vUvB;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);

  // Two octaves of the same tile at different scales; one tile alone reads as
  // wallpaper the moment the camera is low enough to see the repeat.
  vec2 uvA = wp.xz / uPatchSize;
  vec2 uvB = wp.xz / (uPatchSize * uDetailScale);

  vec3 dA = texture(uDisplacement, uvA).xyz;
  vec3 dB = texture(uDisplacement, uvB).xyz * 0.42;

  wp.xyz += dA + dB;

  vWorld = wp.xyz;
  vUvA = uvA;
  vUvB = uvB;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const OCEAN_FRAG = /* glsl */ `
uniform sampler2D uDisplacement;
uniform float uPatchSize;
uniform float uDetailScale;
uniform float uN;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uDeepColor;
uniform vec3 uHorizonColor;
uniform vec3 uZenithColor;
uniform float uFogDensity;
uniform float uExposure;
in vec3 vWorld;
in vec2 vUvA;
in vec2 vUvB;
out vec4 fragColor;

float heightAt(vec2 offsetA) {
  return texture(uDisplacement, vUvA + offsetA).y
       + texture(uDisplacement, vUvB + offsetA / uDetailScale).y * 0.42;
}

void main() {
  // Central differences on the height field. A texel is uPatchSize/N metres,
  // so the slope is a true world-space gradient, not a texture-space one.
  float t = 1.0 / uN;
  float w = uPatchSize / uN;
  float hL = heightAt(vec2(-t, 0.0));
  float hR = heightAt(vec2( t, 0.0));
  float hD = heightAt(vec2(0.0, -t));
  float hU = heightAt(vec2(0.0,  t));
  vec3 N = normalize(vec3(hL - hR, 2.0 * w, hD - hU));

  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSunDir);
  vec3 H = normalize(L + V);

  // Schlick, with water's 0.02 normal-incidence reflectance.
  float fres = 0.02 + 0.98 * pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 5.0);

  vec3 R = reflect(-V, N);
  vec3 sky = mix(uHorizonColor, uZenithColor, clamp(R.y, 0.0, 1.0));

  // Light that entered the wave and came back out — brightest looking through
  // a crest towards the sun, which is what makes water read as translucent.
  float lift = clamp(vWorld.y * 0.55, 0.0, 1.0);
  float back = pow(clamp(dot(V, -L), 0.0, 1.0), 3.0);
  vec3 sss = uSunColor * lift * back * 0.16;

  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 160.0);

  vec3 color = mix(uDeepColor, sky, fres) + sss + uSunColor * spec * 2.2;

  float dist = length(vWorld.xz - cameraPosition.xz);
  color = mix(color, uHorizonColor, 1.0 - exp(-dist * uFogDensity));

  color *= uExposure;
  fragColor = vec4(color, 1.0);
}
`

/* ---------------------------------------------------------------- butterfly */

/**
 * Precomputed twiddle factors and index pairs, one column per FFT stage.
 * Building this on the CPU keeps the sign conventions in one readable place;
 * it is a few hundred floats and only ever runs once.
 */
function buildButterflyTexture(N: number): THREE.DataTexture {
  const stages = Math.log2(N)
  const bits = stages
  const data = new Float32Array(stages * N * 4)

  const reverse = new Int32Array(N)
  for (let i = 0; i < N; i++) {
    let r = 0
    for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b)
    reverse[i] = r
  }

  for (let stage = 0; stage < stages; stage++) {
    const span = 1 << stage
    for (let i = 0; i < N; i++) {
      // k selects the twiddle; because it differs between the two wings it
      // already carries the +/- of the butterfly. No extra sign needed.
      const k = (i * (N / (1 << (stage + 1)))) % N
      const angle = (2 * PI * k) / N // +i convention: this is the inverse DFT
      const twR = Math.cos(angle)
      const twI = Math.sin(angle)

      const topWing = i % (1 << (stage + 1)) < span
      let top: number
      let bot: number
      if (stage === 0) {
        // First stage also performs the bit-reversal permutation.
        top = topWing ? reverse[i] : reverse[i - 1]
        bot = topWing ? reverse[i + 1] : reverse[i]
      } else {
        top = topWing ? i : i - span
        bot = topWing ? i + span : i
      }

      const o = (i * stages + stage) * 4
      data[o] = twR
      data[o + 1] = twI
      data[o + 2] = top
      data[o + 3] = bot
    }
  }

  const tex = new THREE.DataTexture(data, stages, N, THREE.RGBAFormat, THREE.FloatType)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  return tex
}

/* ------------------------------------------------------------------ factory */

export function createRenderer(options: OceanRendererOptions): OceanRenderer {
  const {
    canvas,
    size = 256,
    patchSize = 64,
    wind = [26, 14],
    choppiness = 1.1,
    amplitude = 1.7,
    segments = 288,
    staticFrame = false,
    maxPixelRatio = 1.75,
  } = options

  const N = size
  const stages = Math.log2(N)

  const disposers: Array<() => void> = []
  let frame = 0
  let disposed = false
  let resolveReady: () => void = () => {}
  let rejectReady: (e: Error) => void = () => {}
  const ready = new Promise<void>((res, rej) => {
    resolveReady = res
    rejectReady = rej
  })

  if (!Number.isInteger(stages) || N < 4) {
    rejectReady(new Error(`fft-ocean: size must be a power of two >= 4, got ${N}`))
    return { ready, dispose: () => {} }
  }

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
  } catch (err) {
    rejectReady(err instanceof Error ? err : new Error('fft-ocean: WebGL unavailable'))
    return { ready, dispose: () => {} }
  }

  const gl = renderer.getContext()
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
  // Rendering *into* a float target is the extension; sampling one is not.
  const canRenderFloat = isWebGL2 && !!gl.getExtension('EXT_color_buffer_float')

  if (!canRenderFloat) {
    renderer.dispose()
    rejectReady(new Error('fft-ocean: needs WebGL2 with EXT_color_buffer_float'))
    return { ready, dispose: () => {} }
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))
  renderer.outputColorSpace = THREE.SRGBColorSpace

  /* -- offscreen plumbing -------------------------------------------------- */

  const fsGeometry = new THREE.BufferGeometry()
  fsGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  )
  const fsCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const fsScene = new THREE.Scene()
  // Typed loosely on purpose: every pass swaps its own RawShaderMaterial in.
  const fsPlaceholder = new THREE.MeshBasicMaterial()
  const fsMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    fsGeometry,
    fsPlaceholder,
  )
  fsScene.add(fsMesh)
  disposers.push(() => {
    fsGeometry.dispose()
    fsPlaceholder.dispose()
  })

  const makeTarget = (type: THREE.TextureDataType, linear = false) => {
    const rt = new THREE.WebGLRenderTarget(N, N, {
      type,
      format: THREE.RGBAFormat,
      minFilter: linear ? THREE.LinearFilter : THREE.NearestFilter,
      magFilter: linear ? THREE.LinearFilter : THREE.NearestFilter,
      wrapS: linear ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
      wrapT: linear ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    })
    disposers.push(() => rt.dispose())
    return rt
  }

  const rtH0k = makeTarget(THREE.FloatType)
  const rtHkt = makeTarget(THREE.FloatType)
  const rtPingA = makeTarget(THREE.FloatType)
  const rtPingB = makeTarget(THREE.FloatType)
  // Half-float so the mesh can sample it with linear filtering everywhere;
  // float-linear is an extension, half-float-linear is core WebGL2.
  const rtDisplacement = makeTarget(THREE.HalfFloatType, true)

  const butterfly = buildButterflyTexture(N)
  disposers.push(() => butterfly.dispose())

  const makePass = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
    const mat = new THREE.RawShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader,
      uniforms,
      glslVersion: THREE.GLSL3,
      depthTest: false,
      depthWrite: false,
    })
    disposers.push(() => mat.dispose())
    return mat
  }

  const runPass = (mat: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget) => {
    fsMesh.material = mat
    renderer.setRenderTarget(target)
    renderer.render(fsScene, fsCamera)
    renderer.setRenderTarget(null)
  }

  const h0kMat = makePass(H0K_FRAG, {
    uN: { value: N },
    uPatchSize: { value: patchSize },
    uWind: { value: new THREE.Vector2(wind[0], wind[1]) },
    // height ∝ √A, so the metre-scale knob squares into the density.
    uAmplitude: { value: amplitude * amplitude * 4.83e-5 },
    uCapillary: { value: patchSize / N },
  })

  const hktMat = makePass(HKT_FRAG, {
    uH0k: { value: rtH0k.texture },
    uN: { value: N },
    uPatchSize: { value: patchSize },
    uTime: { value: 0 },
  })

  const butterflyMat = makePass(BUTTERFLY_FRAG, {
    uButterfly: { value: butterfly },
    uInput: { value: null },
    uStage: { value: 0 },
    uVertical: { value: 0 },
  })

  const permuteMat = makePass(PERMUTE_FRAG, {
    uInput: { value: null },
    uChoppiness: { value: choppiness },
  })

  // The initial spectrum never changes; compute it once.
  runPass(h0kMat, rtH0k)

  /* -- scene --------------------------------------------------------------- */

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 4000)
  camera.position.set(0, 10.5, 26)
  camera.lookAt(0, 19.0, -85)

  const extent = 900
  const oceanGeometry = new THREE.PlaneGeometry(extent, extent, segments, segments)
  oceanGeometry.rotateX(-PI / 2)
  disposers.push(() => oceanGeometry.dispose())

  const sunDir = new THREE.Vector3(0.46, 0.075, -0.92).normalize()

  const oceanMaterial = new THREE.ShaderMaterial({
    vertexShader: OCEAN_VERT,
    fragmentShader: OCEAN_FRAG,
    glslVersion: THREE.GLSL3,
    uniforms: {
      uDisplacement: { value: rtDisplacement.texture },
      uPatchSize: { value: patchSize },
      uDetailScale: { value: 0.29 },
      uN: { value: N },
      uSunDir: { value: sunDir },
      uSunColor: { value: new THREE.Color(0.42, 0.63, 0.85) },
      uDeepColor: { value: new THREE.Color(0.004, 0.011, 0.026) },
      uHorizonColor: { value: new THREE.Color(0.046, 0.076, 0.116) },
      uZenithColor: { value: new THREE.Color(0.013, 0.027, 0.053) },
      uFogDensity: { value: 0.0075 },
      uExposure: { value: 1.0 },
    },
  })
  disposers.push(() => oceanMaterial.dispose())

  const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial)
  oceanMesh.frustumCulled = false
  scene.add(oceanMesh)

  /* -- sizing -------------------------------------------------------------- */

  const resize = () => {
    const w = canvas.clientWidth || canvas.width || 1
    const h = canvas.clientHeight || canvas.height || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
  observer?.observe(canvas)
  window.addEventListener('resize', resize)
  disposers.push(() => {
    observer?.disconnect()
    window.removeEventListener('resize', resize)
  })

  /* -- frame --------------------------------------------------------------- */

  const runFFT = (time: number) => {
    hktMat.uniforms.uTime.value = time
    runPass(hktMat, rtHkt)

    // Ping-pong between two targets. The very first pass reads the spectrum
    // instead, so that step hands the spare target over rather than swapping.
    let src = rtHkt
    let dst = rtPingA
    let spare = rtPingB

    for (let vertical = 0; vertical < 2; vertical++) {
      butterflyMat.uniforms.uVertical.value = vertical
      for (let stage = 0; stage < stages; stage++) {
        butterflyMat.uniforms.uStage.value = stage
        butterflyMat.uniforms.uInput.value = src.texture
        runPass(butterflyMat, dst)

        if (src === rtHkt) {
          src = dst
          dst = spare
        } else {
          const prev = src
          src = dst
          dst = prev
        }
        spare = dst
      }
    }

    permuteMat.uniforms.uInput.value = src.texture
    runPass(permuteMat, rtDisplacement)
  }

  let lastTime = performance.now()
  let visible = true

  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0 })
      : null
  io?.observe(canvas)
  disposers.push(() => io?.disconnect())

  // Coming back from a hidden tab must not replay the elapsed wall time.
  const onVisibility = () => { if (!document.hidden) lastTime = performance.now() }
  document.addEventListener('visibilitychange', onVisibility)
  disposers.push(() => document.removeEventListener('visibilitychange', onVisibility))

  let elapsed = 0
  let first = true

  const tick = () => {
    if (disposed) return
    frame = requestAnimationFrame(tick)

    const now = performance.now()
    const delta = (now - lastTime) / 1000
    lastTime = now

    // Thirty-odd render-target passes a frame is not something to spend on a
    // canvas nobody is looking at.
    if (!first && (!visible || document.hidden)) return

    if (!staticFrame) elapsed += Math.min(delta, 0.05)

    runFFT(staticFrame ? 24.0 : elapsed)
    renderer.render(scene, camera)

    if (first) {
      first = false
      resolveReady()
      if (staticFrame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
  }

  frame = requestAnimationFrame(tick)

  const dispose = () => {
    if (disposed) return
    disposed = true
    if (frame) cancelAnimationFrame(frame)
    for (const d of disposers) {
      try {
        d()
      } catch {
        /* a half-built renderer should still tear the rest of itself down */
      }
    }
    renderer.dispose()
  }

  return { ready, dispose }
}
