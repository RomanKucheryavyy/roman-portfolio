'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/stores/useStore'

/**
 * Animated dark gradient background shader.
 * Shifts between deep purple, navy, and black based on scroll position.
 * Replaces flat black for atmospheric depth.
 */

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uScroll;
varying vec2 vUv;

void main() {
  // Base: deep black with subtle color shifts
  vec3 deepBlack = vec3(0.0, 0.0, 0.0);
  vec3 deepNavy = vec3(0.02, 0.02, 0.06);
  vec3 deepPurple = vec3(0.04, 0.01, 0.06);

  // Mix colors based on vertical position + scroll
  float mixFactor = vUv.y * 0.5 + sin(uTime * 0.1 + uScroll * 3.0) * 0.15;
  vec3 color = mix(deepBlack, mix(deepNavy, deepPurple, sin(uScroll * 6.28) * 0.5 + 0.5), mixFactor);

  // Subtle radial vignette — darker at edges
  float vignette = 1.0 - length(vUv - 0.5) * 0.8;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`

export default function GradientBg() {
  const meshRef = useRef<THREE.Mesh>(null)
  const scrollProgress = useStore((s) => s.scrollProgress)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
  }), [])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uScroll.value += (scrollProgress - uniforms.uScroll.value) * 0.05
  })

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
