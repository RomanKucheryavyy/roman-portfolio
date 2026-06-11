'use client'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/stores/useStore'

const TRAIL_COUNT = 3

/**
 * Trail cursor — main dot, 3 trailing dots, and a soft 400px ambient glow.
 * Unmounts entirely on touch devices (the OS cursor is restored by CSS:
 * cursor:none only applies under pointer:fine).
 */
export default function Cursor() {
  const [isTouch, setIsTouch] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const cursorVariant = useStore((s) => s.cursorVariant)

  useEffect(() => {
    setIsTouch('ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    if (isTouch) return
    let mouseX = -100
    let mouseY = -100
    const positions = Array.from({ length: TRAIL_COUNT + 1 }, () => ({ x: -100, y: -100 }))
    const glowPos = { x: -100, y: -100 }
    let raf = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const tick = () => {
      positions[0].x += (mouseX - positions[0].x) * 0.35
      positions[0].y += (mouseY - positions[0].y) * 0.35
      if (mainRef.current) {
        mainRef.current.style.transform = `translate(${positions[0].x}px, ${positions[0].y}px) translate(-50%, -50%)`
      }
      for (let i = 1; i <= TRAIL_COUNT; i++) {
        const lerp = 0.15 - (i - 1) * 0.015
        positions[i].x += (positions[i - 1].x - positions[i].x) * lerp
        positions[i].y += (positions[i - 1].y - positions[i].y) * lerp
        const el = trailRefs.current[i - 1]
        if (el) el.style.transform = `translate(${positions[i].x}px, ${positions[i].y}px) translate(-50%, -50%)`
      }
      glowPos.x += (mouseX - glowPos.x) * 0.08
      glowPos.y += (mouseY - glowPos.y) * 0.08
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glowPos.x}px, ${glowPos.y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [isTouch])

  if (isTouch) return null

  const size = cursorVariant === 'hover' ? 40 : cursorVariant === 'text' ? 80 : 8
  const background = cursorVariant === 'hidden' ? 'transparent' : '#ffffff'

  return (
    <>
      <div
        ref={glowRef}
        className="fixed top-0 left-0 z-[1] pointer-events-none rounded-full"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el }}
          className="fixed top-0 left-0 z-[10000] pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
          style={{
            width: Math.max(3, 6 - i),
            height: Math.max(3, 6 - i),
            background: '#ffffff',
            opacity: 0.4 - i * 0.06,
          }}
          aria-hidden="true"
        />
      ))}
      <div
        ref={mainRef}
        className="fixed top-0 left-0 z-[10000] pointer-events-none rounded-full mix-blend-difference"
        style={{
          width: size,
          height: size,
          background,
          transition: 'width 0.3s ease, height 0.3s ease',
        }}
        aria-hidden="true"
      />
    </>
  )
}
