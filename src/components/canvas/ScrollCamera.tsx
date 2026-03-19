'use client'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '@/stores/useStore'

/**
 * Scroll-driven camera orbit.
 * Camera slowly rotates on Y axis as user scrolls (0° top → 15° bottom).
 * Also shifts slightly on X based on mouse position for spatial depth.
 */
export default function ScrollCamera() {
  const { camera } = useThree()
  const scrollProgress = useStore((s) => s.scrollProgress)
  const mousePos = useStore((s) => s.mousePosition)

  useFrame(() => {
    // Scroll-driven Y rotation: 0 at top, 0.26 rad (~15°) at bottom
    const targetRotY = scrollProgress * 0.26

    // Mouse-driven subtle X/Y offset
    const nx = typeof window !== 'undefined'
      ? (mousePos.x / window.innerWidth - 0.5) * 2
      : 0
    const ny = typeof window !== 'undefined'
      ? (mousePos.y / window.innerHeight - 0.5) * 2
      : 0

    // Smooth lerp to target
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.03
    camera.position.x += (nx * 0.5 - camera.position.x) * 0.02
    camera.position.y += (-ny * 0.3 - camera.position.y) * 0.02
  })

  return null
}
