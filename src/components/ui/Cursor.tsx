'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'

const TRAIL_COUNT = 6
const TRAIL_DELAY = 30 // ms between each trailing dot

/**
 * Trail cursor — primary dot + 6 trailing dots with increasing delay.
 * Uses mix-blend-difference for visibility on any background.
 */
export default function Cursor() {
  const dotsRef = useRef<HTMLDivElement[]>([])
  const positions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_COUNT + 1 }, () => ({ x: 0, y: 0 }))
  )
  const cursorVariant = useStore((s) => s.cursorVariant)

  useEffect(() => {
    if ('ontouchstart' in window) return

    const onMove = (e: MouseEvent) => {
      positions.current[0] = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    let rafId: number
    const animate = () => {
      // Trail: each dot lerps toward the previous dot's position
      for (let i = TRAIL_COUNT; i >= 1; i--) {
        const prev = positions.current[i - 1]
        const curr = positions.current[i]
        const ease = 0.15 - i * 0.015 // each trailing dot is slightly slower
        curr.x += (prev.x - curr.x) * ease
        curr.y += (prev.y - curr.y) * ease
      }

      // Apply positions to DOM
      dotsRef.current.forEach((dot, i) => {
        if (!dot) return
        const pos = positions.current[i]
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      })

      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const mainSize = cursorVariant === 'hover' ? 40 : cursorVariant === 'text' ? 80 : 8

  return (
    <>
      {/* Main cursor dot */}
      <div
        ref={(el) => { if (el) dotsRef.current[0] = el }}
        className="fixed top-0 left-0 z-[10000] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
        style={{
          width: mainSize,
          height: mainSize,
          background: cursorVariant === 'hidden' ? 'transparent' : '#fff',
          transition: 'width 0.3s ease, height 0.3s ease',
          willChange: 'transform',
        }}
      />
      {/* Trailing dots */}
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => { if (el) dotsRef.current[i + 1] = el }}
          className="fixed top-0 left-0 z-[10000] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
          style={{
            width: Math.max(3, 6 - i),
            height: Math.max(3, 6 - i),
            background: '#fff',
            opacity: 0.4 - i * 0.06,
            willChange: 'transform',
          }}
        />
      ))}
    </>
  )
}
