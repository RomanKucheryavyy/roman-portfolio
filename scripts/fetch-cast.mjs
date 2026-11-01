#!/usr/bin/env node
/**
 * Fetches the cast of the Roman intro (src/components/stage/intro.tsx), three
 * of the four photographs kedhareswer/old-masters-preloader stages by default
 * (not its figure holding flowers, which Roman asked to remove), all
 * from Unsplash (free to use under the Unsplash License), and writes them to
 * public/images/cast/ as WebP:
 *
 * - The two figures, PRE-KEYED: an alpha channel from each pixel's
 *   luminance through the component's own transfer (omTransfer with
 *   threshold 0.2, softness 0.16, subject "light": alpha = 6.25 L - 0.75,
 *   L the Rec. 709 luma of the sRGB values, as its SVG filter computes it),
 *   so a browser that ignores the component's CSS mask (Safari's support for
 *   `mask: url(#svg-mask)` on HTML is unreliable, and Roman is on an iPhone)
 *   still shows only the statue. Each is cropped to the statue (less black
 *   ground to carry) and scaled to 1600px tall.
 * - The backdrop (Michelangelo's David), opaque, 1200px wide at a modest
 *   quality: the component shows it grayscale, darkened and blurred.
 *
 * The Hercules needs more than the key: the photograph's lower edge shows
 * his genitals. Its crop stops at the belly (66% of the photo's height, well
 * above them) and the last stretch fades out, so the file the site serves
 * does not contain them at all; the page also stands its foot below the
 * floor.
 *
 * And it is FILLED: his face is turned into shadow, as dark as the ground
 * behind him, so the luminance key alone cut his eyes, nose and cheek out,
 * and on the hero (which keys nothing more) the blurred backdrop showed
 * through a hole where his face was. So inside his outline the alpha is
 * full: the key's mask, closed (a disc of CLOSE_RADIUS) and with its holes
 * filled, drawn in a little (FILL_INSET) and feathered, so the outer edge is
 * still the key's own; and the colour there is lifted to at least
 * SHADOW_FLOOR, so a stage whose key reads nothing as ground (the hero:
 * hero-painting-stage.tsx) prints his shadows in the print's darkest ink.
 * A stage that keeps the component's key (the intro, the title cards) still
 * keys those shadows out, as before.
 *
 * The credits are the component's (its DEFAULT_FIGURES comment); the alt
 * texts the page gives them are its too (src/components/stage/cast.ts).
 *
 *   node scripts/fetch-cast.mjs            # all three
 *   node scripts/fetch-cast.mjs hercules   # one
 *
 * Needs network access to images.unsplash.com, and sharp (Next installs it
 * as its own optional dependency). Prints each file's size; set the sizes
 * in src/components/stage/cast.ts if they change, and look at the files
 * before committing them.
 */
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = path.join(ROOT, 'public', 'images', 'cast')

/** omTransfer(0.2, 0.16, "light") in the component, to its two decimals. */
const SLOPE = 6.25
const INTERCEPT = -0.75

/**
 * The cast. `photo` is the Unsplash id; `crop` is the part kept, as
 * fractions of the photograph (left, top, right, bottom edges); `fade` the
 * fraction of the kept height, at its foot, over which the alpha runs out.
 */
const CAST = [
  {
    id: 'apollo',
    photo: '1574359587026-daf1bfd26baa',
    credit: 'Nayani Teixeira',
    kind: 'figure',
    // The left fifth and the top tenth are black ground.
    crop: { left: 0.22, top: 0.11, right: 1, bottom: 1 },
  },
  {
    id: 'hercules',
    photo: '1567522874215-d5e2f1bee83d',
    credit: 'Şafak Atalay',
    kind: 'figure',
    // The statue fills the left two thirds. It is cut at the belly, well
    // above the groin, and fades out over the last twentieth, which the
    // page stands below the floor.
    crop: { left: 0.04, top: 0.02, right: 0.68, bottom: 0.66 },
    fade: 0.05,
    fill: true,
  },
  {
    id: 'david-backdrop',
    photo: '1601887389937-0b02c26b602c',
    credit: 'Jack Hunter',
    kind: 'backdrop',
  },
]

const FIGURE_HEIGHT = 1600
/** Gaussian sigma, in output px, of the copy the key reads. */
const KEY_BLUR = 1.6
const ALPHA_FLOOR = 0.04
const BACKDROP_WIDTH = 1200

/** The filled figure's silhouette: worked at a quarter of the size, the gaps it closes up to twice this (in output px), drawn in by FILL_INSET. */
const FILL_SCALE = 4
const CLOSE_RADIUS = 56
const FILL_INSET = 8
/** Inside the silhouette, no channel darker than this (of 255): the print's darkest ink, not the ground showing through. */
const SHADOW_FLOOR = 6

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

async function download(photo, width) {
  // fit=max never upscales: a photograph narrower than `width` comes whole.
  const url = `https://images.unsplash.com/photo-${photo}?fm=jpg&q=92&fit=max&w=${width}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Chamfer distance (in px) from each pixel of a w × h mask to the nearest pixel equal to `target`. */
function distanceTo(mask, w, h, target) {
  const d = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) d[i] = mask[i] === target ? 0 : 1e9
  const diag = Math.SQRT2
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let v = d[i]
      if (x > 0) v = Math.min(v, d[i - 1] + 1)
      if (y > 0) {
        v = Math.min(v, d[i - w] + 1)
        if (x > 0) v = Math.min(v, d[i - w - 1] + diag)
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + diag)
      }
      d[i] = v
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      let v = d[i]
      if (x < w - 1) v = Math.min(v, d[i + 1] + 1)
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + 1)
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + diag)
        if (x > 0) v = Math.min(v, d[i + w - 1] + diag)
      }
      d[i] = v
    }
  return d
}

/**
 * The figure's silhouette from its keyed alpha (width × height), as full
 * coverage (0-255, one channel, the output's size): the mask closed by a
 * disc, its holes filled (whatever ground the image's border cannot reach
 * is inside him), drawn in and feathered.
 */
async function silhouette(alpha, width, height) {
  const w = Math.ceil(width / FILL_SCALE)
  const h = Math.ceil(height / FILL_SCALE)
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0
      let n = 0
      for (let yy = y * FILL_SCALE; yy < Math.min(height, (y + 1) * FILL_SCALE); yy++)
        for (let xx = x * FILL_SCALE; xx < Math.min(width, (x + 1) * FILL_SCALE); xx++) {
          sum += alpha[yy * width + xx]
          n++
        }
      mask[y * w + x] = sum / n > 0.12 ? 1 : 0
    }
  const radius = CLOSE_RADIUS / FILL_SCALE
  const near = distanceTo(mask, w, h, 1)
  const grown = near.map((v) => (v <= radius ? 1 : 0))
  const far = distanceTo(grown, w, h, 0)
  const closed = far.map((v, i) => (v > radius || mask[i] ? 1 : 0))
  // Ground the border reaches is outside; any other ground is a hole in him.
  const outside = new Uint8Array(w * h)
  const stack = []
  const reach = (x, y) => {
    const i = y * w + x
    if (!closed[i] && !outside[i]) {
      outside[i] = 1
      stack.push(i)
    }
  }
  for (let x = 0; x < w; x++) reach(x, 0), reach(x, h - 1)
  for (let y = 0; y < h; y++) reach(0, y), reach(w - 1, y)
  while (stack.length) {
    const i = stack.pop()
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) reach(x - 1, y)
    if (x < w - 1) reach(x + 1, y)
    if (y > 0) reach(x, y - 1)
    if (y < h - 1) reach(x, y + 1)
  }
  const filled = outside.map((v) => (v ? 0 : 1))
  const edge = distanceTo(filled, w, h, 0)
  const inner = Buffer.from(edge.map((v) => (v > FILL_INSET / FILL_SCALE ? 255 : 0)))
  return sharp(inner, { raw: { width: w, height: h, channels: 1 } })
    .resize(width, height, { kernel: 'cubic' })
    .blur(3)
    .extractChannel(0)
    .raw()
    .toBuffer()
}

async function figure(entry) {
  const source = await download(entry.photo, 3600)
  const meta = await sharp(source).metadata()
  const { left, top, right, bottom } = entry.crop
  const region = {
    left: Math.round(meta.width * left),
    top: Math.round(meta.height * top),
    width: Math.round(meta.width * (right - left)),
    height: Math.round(meta.height * (bottom - top)),
  }
  const scaled = await sharp(source).extract(region).resize({ height: FIGURE_HEIGHT }).removeAlpha().toBuffer()
  // A 3px median takes out the film grain, which would cost more bytes than
  // the marble; at 1600px tall it is not visible.
  const { data, info } = await sharp(scaled).median(3).raw().toBuffer({ resolveWithObject: true })
  // The key reads a softened copy: the photographs' grain would otherwise
  // speckle the edge (and the alpha would weigh more than the picture).
  const soft = await sharp(scaled).blur(KEY_BLUR).raw().toBuffer()
  const { width, height } = info
  const keyed = new Float32Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const luma = 0.2126 * (soft[i * 3] / 255) + 0.7152 * (soft[i * 3 + 1] / 255) + 0.0722 * (soft[i * 3 + 2] / 255)
    keyed[i] = clamp01(SLOPE * luma + INTERCEPT)
  }
  const inside = entry.fill ? await silhouette(keyed, width, height) : null
  const out = Buffer.alloc(width * height * 4)
  const fadeFrom = entry.fade ? height * (1 - entry.fade) : height
  for (let y = 0; y < height; y++) {
    const foot = y < fadeFrom ? 1 : 1 - smoothstep(fadeFrom, height - 1, y)
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const within = inside ? inside[i] / 255 : 0
      let alpha = Math.max(keyed[i], within) * foot
      // Below a sliver of coverage, none: specks of ground, not marble.
      if (alpha < ALPHA_FLOOR) alpha = 0
      const floor = within > 0.5 ? SHADOW_FLOOR : 0
      out[i * 4] = Math.max(data[i * 3], floor)
      out[i * 4 + 1] = Math.max(data[i * 3 + 1], floor)
      out[i * 4 + 2] = Math.max(data[i * 3 + 2], floor)
      out[i * 4 + 3] = Math.round(alpha * 255)
    }
  }
  const file = path.join(OUT, `${entry.id}.webp`)
  await sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: 70, alphaQuality: 40, effort: 6, smartSubsample: true })
    .toFile(file)
  return { file, width, height }
}

async function backdrop(entry) {
  const source = await download(entry.photo, 2400)
  const file = path.join(OUT, `${entry.id}.webp`)
  const { width, height } = await sharp(source).resize({ width: BACKDROP_WIDTH }).webp({ quality: 50, effort: 6 }).toFile(file)
  return { file, width, height }
}

const only = process.argv.slice(2)
const unknown = only.filter((id) => !CAST.some((c) => c.id === id))
if (unknown.length) {
  console.error(`fetch-cast: no cast member ${unknown.join(', ')} (have ${CAST.map((c) => c.id).join(', ')})`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
for (const entry of CAST) {
  if (only.length && !only.includes(entry.id)) continue
  const { file, width, height } = entry.kind === 'figure' ? await figure(entry) : await backdrop(entry)
  const kb = (statSync(file).size / 1024).toFixed(1)
  console.log(`${path.relative(ROOT, file)}  ${width}x${height}  ${kb} KB  (photo ${entry.photo}, ${entry.credit})`)
}
