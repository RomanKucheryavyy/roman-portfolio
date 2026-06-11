'use client'
import { useEffect, useMemo, useRef } from 'react'

interface FloatingLettersProps {
  children: string
  className?: string
}

const REPEL_RADIUS = 120
const REPEL_FORCE = 8
const SPRING = 0.12
const DAMPING = 0.85

/**
 * Per-letter mouse repel (hero name). Letters drift away from the cursor and
 * spring back. Desktop only — callers skip it on mobile.
 * If the parent className includes `text-gradient`, the gradient is applied
 * per-letter so background-clip survives the per-letter transforms.
 */
export default function FloatingLetters({ children, className = '' }: FloatingLettersProps) {
  const letters = useMemo(() => children.split(''), [children])
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const hasGradient = className.includes('text-gradient')
  const containerClass = hasGradient
    ? className.split(/\s+/).filter((c) => c !== 'text-gradient').join(' ')
    : className

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const centers: { x: number; y: number }[] = []
    const offsets = letters.map(() => ({ x: 0, y: 0 }))
    const velocities = letters.map(() => ({ x: 0, y: 0 }))
    let mouseX = -9999
    let mouseY = -9999
    let raf = 0
    let running = false

    const cacheCenters = () => {
      refs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        centers[i] = { x: r.left + r.width / 2 - offsets[i].x, y: r.top + r.height / 2 - offsets[i].y }
      })
    }

    const tick = () => {
      for (let i = 0; i < letters.length; i++) {
        const el = refs.current[i]
        const c = centers[i]
        if (!el || !c) continue
        const o = offsets[i]
        const v = velocities[i]
        const dx = c.x + o.x - mouseX
        const dy = c.y + o.y - mouseY
        const dist = Math.hypot(dx, dy)
        if (dist > 0 && dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE
          v.x += (dx / dist) * force
          v.y += (dy / dist) * force
        }
        v.x += -(SPRING * o.x)
        v.y += -(SPRING * o.y)
        v.x *= DAMPING
        v.y *= DAMPING
        o.x += v.x
        o.y += v.y
        el.style.transform = `translate(${o.x}px, ${o.y}px)`
      }
      raf = requestAnimationFrame(tick)
    }

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    cacheCenters()
    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY }
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('resize', cacheCenters)
    let scrollRaf = 0
    const onScroll = () => {
      cancelAnimationFrame(scrollRaf)
      scrollRaf = requestAnimationFrame(cacheCenters)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const io = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? start() : stop() },
      { threshold: 0 }
    )
    io.observe(container)

    return () => {
      stop()
      cancelAnimationFrame(scrollRaf)
      io.disconnect()
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('resize', cacheCenters)
      window.removeEventListener('scroll', onScroll)
    }
  }, [letters])

  return (
    <div ref={containerRef} className={`inline-block ${containerClass}`}>
      {letters.map((char, i) => (
        <span
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className={`inline-block will-change-transform${hasGradient ? ' text-gradient' : ''}`}
          style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}
