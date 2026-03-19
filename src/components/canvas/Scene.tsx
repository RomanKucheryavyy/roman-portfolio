'use client'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import ParticleField from './ParticleField'
import FloatingShapes from './FloatingShapes'
import GradientBg from './GradientBg'
import ScrollCamera from './ScrollCamera'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'

/**
 * Full-page fixed WebGL canvas — sits behind all DOM content.
 * Contains: particles, floating geometries, gradient background, scroll-driven camera.
 */
export default function Scene() {
  const { particleCount } = useDeviceCapability()

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Suspense fallback={null}>
        <GradientBg />
        <ScrollCamera />
        <ambientLight intensity={0.3} />
        <ParticleField count={particleCount} />
        <FloatingShapes />
      </Suspense>
    </Canvas>
  )
}
