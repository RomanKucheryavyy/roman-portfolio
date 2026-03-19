'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/stores/useStore'

interface ShapeConfig {
  geometry: 'torus' | 'icosahedron' | 'octahedron' | 'dodecahedron' | 'torusKnot'
  position: [number, number, number]
  scale: number
  speed: number
  phase: number
}

const SHAPES: ShapeConfig[] = [
  { geometry: 'torus', position: [-6, 3, -4], scale: 0.8, speed: 0.3, phase: 0 },
  { geometry: 'icosahedron', position: [5, -2, -6], scale: 0.6, speed: 0.4, phase: 1.5 },
  { geometry: 'octahedron', position: [-4, -4, -3], scale: 0.5, speed: 0.25, phase: 3 },
  { geometry: 'dodecahedron', position: [7, 4, -5], scale: 0.4, speed: 0.35, phase: 4.5 },
  { geometry: 'torusKnot', position: [-8, 1, -7], scale: 0.3, speed: 0.2, phase: 2 },
  { geometry: 'torus', position: [3, -5, -8], scale: 0.7, speed: 0.3, phase: 5.5 },
]

function Shape({ config }: { config: ShapeConfig }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const mousePos = useStore((s) => s.mousePosition)
  const scrollProgress = useStore((s) => s.scrollProgress)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime * config.speed + config.phase

    // Gentle floating oscillation
    meshRef.current.position.y = config.position[1] + Math.sin(t) * 0.5
    meshRef.current.position.x = config.position[0] + Math.cos(t * 0.7) * 0.3

    // Slow rotation
    meshRef.current.rotation.x = t * 0.5
    meshRef.current.rotation.y = t * 0.3

    // Mouse parallax — shapes shift based on cursor position
    const nx = (mousePos.x / (typeof window !== 'undefined' ? window.innerWidth : 1) - 0.5) * 2
    const ny = (mousePos.y / (typeof window !== 'undefined' ? window.innerHeight : 1) - 0.5) * 2
    meshRef.current.position.x += nx * 0.8
    meshRef.current.position.y -= ny * 0.5

    // Scroll-driven depth shift — shapes move in Z as you scroll
    meshRef.current.position.z = config.position[2] - scrollProgress * 3
  })

  const geometryEl = (() => {
    switch (config.geometry) {
      case 'torus': return <torusGeometry args={[0.5, 0.15, 8, 24]} />
      case 'icosahedron': return <icosahedronGeometry args={[0.5, 0]} />
      case 'octahedron': return <octahedronGeometry args={[0.5, 0]} />
      case 'dodecahedron': return <dodecahedronGeometry args={[0.5, 0]} />
      case 'torusKnot': return <torusKnotGeometry args={[0.3, 0.1, 64, 8]} />
    }
  })()

  return (
    <mesh ref={meshRef} position={config.position} scale={config.scale}>
      {geometryEl}
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.06} />
    </mesh>
  )
}

export default function FloatingShapes() {
  return (
    <group>
      {SHAPES.map((config, i) => (
        <Shape key={i} config={config} />
      ))}
    </group>
  )
}
