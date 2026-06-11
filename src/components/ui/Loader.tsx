'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'

const CHARS = '01!@#$%^&*<>/\\|{}[]~`±§'
const TARGETS = ['R', 'K', '.']
const SCRAMBLE_SPEEDS = [60, 45, 70]
const LOCK_TIMES = [800, 1300, 1700]

/** Boot loader: three glyphs scramble through symbols, lock into "R K .",
 *  then burst into particles and hand off to the page. */
export default function Loader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const particleRef = useRef<HTMLDivElement>(null)
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([])
  const setLoaded = useStore((s) => s.setLoaded)

  useEffect(() => {
    const container = containerRef.current
    const particleContainer = particleRef.current
    if (!container || !particleContainer) return

    const intervals: ReturnType<typeof setInterval>[] = []
    const timeouts: ReturnType<typeof setTimeout>[] = []

    TARGETS.forEach((target, i) => {
      const span = spanRefs.current[i]
      if (!span) return
      span.style.opacity = '1'
      span.textContent = '01'[Math.floor(2 * Math.random())]
      const scramble = setInterval(() => {
        span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)]
      }, SCRAMBLE_SPEEDS[i])
      intervals.push(scramble)

      timeouts.push(setTimeout(() => {
        clearInterval(scramble)
        let tick = 0
        const lock = setInterval(() => {
          tick++
          if (tick <= 5) {
            span.textContent = CHARS[Math.floor(5 * Math.random())]
          } else if (tick <= 9) {
            span.textContent = '01'[Math.floor(2 * Math.random())]
          } else {
            clearInterval(lock)
            span.textContent = target
            gsap.fromTo(
              span,
              { textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4)', scale: 1.1 },
              { textShadow: '0 0 0px rgba(255,255,255,0)', scale: 1, duration: 0.4, ease: 'power2.out' }
            )
          }
        }, 40)
        intervals.push(lock)
      }, LOCK_TIMES[i]))
    })

    timeouts.push(setTimeout(() => {
      spanRefs.current.forEach((span) => {
        if (!span) return
        const rect = span.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        for (let p = 0; p < 12; p++) {
          const dot = document.createElement('div')
          dot.className = 'absolute rounded-sm bg-white'
          const size = 4 * Math.random() + 2
          dot.style.width = `${size}px`
          dot.style.height = `${size}px`
          dot.style.left = `${cx}px`
          dot.style.top = `${cy}px`
          particleContainer.appendChild(dot)
          const angle = Math.random() * Math.PI * 2
          const dist = 100 + 300 * Math.random()
          gsap.to(dot, {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            opacity: 0,
            scale: 0,
            duration: 0.6 + 0.4 * Math.random(),
            ease: 'power3.out',
            delay: 0.15 * Math.random(),
          })
        }
        gsap.to(span, { opacity: 0, scale: 0.5, duration: 0.3, ease: 'power2.in' })
      })

      timeouts.push(setTimeout(() => {
        setLoaded(true)
        gsap.to(container, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => { container.style.display = 'none' },
        })
      }, 700))
    }, 3000))

    return () => {
      intervals.forEach(clearInterval)
      timeouts.forEach(clearTimeout)
    }
  }, [setLoaded])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center select-none overflow-hidden"
    >
      <div className="relative flex items-baseline gap-[0.3vw]">
        {TARGETS.map((_, i) => (
          <span
            key={i}
            ref={(el) => { spanRefs.current[i] = el }}
            className="font-mono text-[8vw] md:text-[5vw] font-bold text-white leading-none inline-block"
            style={{ opacity: 0, minWidth: '1ch', textAlign: 'center' }}
          >
            {'010'[i]}
          </span>
        ))}
      </div>
      <div ref={particleRef} className="fixed inset-0 pointer-events-none z-10" />
    </div>
  )
}
