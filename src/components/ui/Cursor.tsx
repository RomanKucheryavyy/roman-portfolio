'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'
import { useIsHydrated, useMediaQuery } from '@/hooks/useMediaQuery'

const TRAIL_COUNT = 3
/** How close counts as arrived: past this the loop stops asking for frames. */
const SETTLED = 0.1

/**
 * Trail cursor — main dot, 3 trailing dots, and a soft 400px ambient glow.
 *
 * It steps aside, leaving the visitor's own pointer, in three cases:
 * - on touch screens (the OS cursor is restored by CSS: cursor:none only
 *   applies under pointer:fine);
 * - under forced colours or prefers-contrast: more, where a white
 *   mix-blend-difference dot is exactly the low-contrast pointer those
 *   settings exist to avoid;
 * and under reduced motion it keeps only the dot, which follows the mouse
 * exactly: no easing, no trail, no glow.
 *
 * The animation loop runs only while something is still catching up with the
 * mouse, and starts again on the next move; it used to run every frame of
 * every visit, cursor at rest or not.
 */
export default function Cursor() {
  // Matches the `@media (pointer: fine)` rule in globals.css that hides the
  // native cursor. Keying off `ontouchstart` as well used to leave
  // touch-capable laptops with no cursor at all: hidden by CSS, and the
  // custom one bailed out.
  const isTouch = useMediaQuery('(pointer: coarse)')
  const wantsNative = useMediaQuery('(forced-colors: active), (prefers-contrast: more)')
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Not in the server HTML: its fixed dots were drawn at the top-left corner,
  // over everything, until hydration (and for good with scripts off).
  const hydrated = useIsHydrated()
  const off = isTouch || wantsNative || !hydrated
  const mainRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const cursorVariant = useStore((s) => s.cursorVariant)

  // Tells globals.css it is safe to hide the native pointer. Without this the
  // rule applied site-wide, including on routes that never mount this.
  useEffect(() => {
    if (off) return
    document.body.setAttribute('data-custom-cursor', '')
    return () => document.body.removeAttribute('data-custom-cursor')
  }, [off])

  useEffect(() => {
    if (off) return
    let mouseX = -100
    let mouseY = -100
    const positions = Array.from({ length: TRAIL_COUNT + 1 }, () => ({ x: -100, y: -100 }))
    const glowPos = { x: -100, y: -100 }
    let raf = 0

    const mainLerp = reduced ? 1 : 0.35
    const trailLerp = (i: number) => (reduced ? 1 : 0.15 - (i - 1) * 0.015)
    const glowLerp = reduced ? 1 : 0.08
    const near = (p: { x: number; y: number }) => Math.abs(mouseX - p.x) < SETTLED && Math.abs(mouseY - p.y) < SETTLED
    const place = (el: HTMLElement | null, p: { x: number; y: number }) => {
      if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
    }

    const paint = () => {
      place(mainRef.current, positions[0])
      for (let i = 1; i <= TRAIL_COUNT; i++) place(trailRefs.current[i - 1], positions[i])
      place(glowRef.current, glowPos)
    }

    const tick = () => {
      positions[0].x += (mouseX - positions[0].x) * mainLerp
      positions[0].y += (mouseY - positions[0].y) * mainLerp
      for (let i = 1; i <= TRAIL_COUNT; i++) {
        const lerp = trailLerp(i)
        positions[i].x += (positions[i - 1].x - positions[i].x) * lerp
        positions[i].y += (positions[i - 1].y - positions[i].y) * lerp
      }
      glowPos.x += (mouseX - glowPos.x) * glowLerp
      glowPos.y += (mouseY - glowPos.y) * glowLerp

      const settled = positions.every(near) && near(glowPos)
      if (settled) {
        // Land exactly, then stop asking for frames until the mouse moves.
        for (const p of positions) {
          p.x = mouseX
          p.y = mouseY
        }
        glowPos.x = mouseX
        glowPos.y = mouseY
      }
      paint()
      raf = settled ? 0 : requestAnimationFrame(tick)
    }

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }

    paint() // parked off-screen until the first move
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [off, reduced])

  if (off) return null

  const size = cursorVariant === 'hover' ? 40 : cursorVariant === 'text' ? 80 : 8
  const background = cursorVariant === 'hidden' ? 'transparent' : '#ffffff'

  return (
    <>
      {!reduced && (
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
      )}
      {!reduced &&
        Array.from({ length: TRAIL_COUNT }, (_, i) => (
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
