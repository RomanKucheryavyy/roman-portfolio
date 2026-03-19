'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'

export function useMouseTracking() {
  const prev = useRef({ x: 0, y: 0, time: Date.now() })
  const setMousePosition = useStore((s) => s.setMousePosition)
  const setMouseVelocity = useStore((s) => s.setMouseVelocity)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const now = Date.now()
      const dt = Math.max(now - prev.current.time, 1)
      const vx = (e.clientX - prev.current.x) / dt
      const vy = (e.clientY - prev.current.y) / dt

      setMousePosition({ x: e.clientX, y: e.clientY })
      setMouseVelocity({ x: vx, y: vy })

      prev.current = { x: e.clientX, y: e.clientY, time: now }
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [setMousePosition, setMouseVelocity])
}
