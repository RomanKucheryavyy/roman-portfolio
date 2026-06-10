'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/stores/useStore'

// Inline shaders to avoid webpack loader issues
const vertexShader = `
uniform float uTime;
uniform float uMouseX;
uniform float uMouseY;
uniform float uVelocity;
uniform float uPixelRatio;

attribute float aSize;
attribute float aPhase;

varying float vAlpha;
varying float vDistFromCenter;

void main() {
  vec3 pos = position;

  float wave = sin(pos.x * 0.5 + uTime * 0.3 + aPhase) * 0.5
             + cos(pos.z * 0.3 + uTime * 0.2 + aPhase * 1.5) * 0.5;
  pos.y += wave;

  vec2 mouseWorld = vec2(uMouseX * 10.0, uMouseY * 6.0);
  vec2 toMouse = pos.xz - mouseWorld;
  float distToMouse = length(toMouse);
  float repulsion = smoothstep(4.0, 0.0, distToMouse) * (1.0 + uVelocity * 3.0);
  pos.xz += normalize(toMouse + 0.001) * repulsion * 1.5;
  pos.y += repulsion * 0.8;

  vDistFromCenter = length(position.xz) / 12.0;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float sizeAtten = (150.0 / -mvPosition.z) * uPixelRatio;
  gl_PointSize = aSize * sizeAtten * (0.4 + repulsion * 0.4);

  vAlpha = smoothstep(1.0, 0.3, vDistFromCenter) * (0.2 + repulsion * 0.4);
}
`

const fragmentShader = `
varying float vAlpha;
varying float vDistFromCenter;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

  // Monochrome particles with subtle warm-cool shift based on distance
  vec3 warm = vec3(1.0, 0.95, 0.9);   // warm white near center
  vec3 cool = vec3(0.9, 0.92, 1.0);    // cool white at edges
  vec3 color = mix(warm, cool, vDistFromCenter * 0.5);

  gl_FragColor = vec4(color, alpha * 0.4);
}
`

interface ParticleFieldProps {
  count?: number
}

export default function ParticleField({ count = 1500 }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null)
  const mousePos = useStore((s) => s.mousePosition)
  const mouseVel = useStore((s) => s.mouseVelocity)

  const { positions, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distribute in a wider disc with more depth spread
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.5) * 18 // sqrt distribution = more spread
      const height = (Math.random() - 0.5) * 8

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius - 4 // push particles behind camera center

      sizes[i] = Math.random() * 1.0 + 0.2 // smaller particles
      phases[i] = Math.random() * Math.PI * 2
    }

    return { positions, sizes, phases }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouseX: { value: 0 },
    uMouseY: { value: 0 },
    uVelocity: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
  }), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const material = meshRef.current.material as THREE.ShaderMaterial

    material.uniforms.uTime.value = state.clock.elapsedTime

    // Convert screen mouse position to normalized [-1, 1]
    const nx = (mousePos.x / window.innerWidth) * 2 - 1
    const ny = -((mousePos.y / window.innerHeight) * 2 - 1)

    // Smooth lerp for fluid tracking
    material.uniforms.uMouseX.value += (nx - material.uniforms.uMouseX.value) * 0.05
    material.uniforms.uMouseY.value += (ny - material.uniforms.uMouseY.value) * 0.05

    // Velocity magnitude for interaction intensity
    const vel = Math.sqrt(mouseVel.x ** 2 + mouseVel.y ** 2)
    material.uniforms.uVelocity.value += (Math.min(vel, 2) - material.uniforms.uVelocity.value) * 0.1

    // Gentle rotation
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
