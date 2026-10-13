'use client'
import { useEffect, useRef } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { TECH_SKILLS } from '@/lib/constants'

/**
 * Slowly rotating double helix of tech skills — decorative column on the
 * right edge of the Measures section. Desktop only.
 *
 * A watermark: the whole column is at 20% and its labels at 60% of that, so
 * they read as texture, not text (about 1.3:1). It is aria-hidden and
 * data-decorative: WCAG 1.4.3 sets no contrast minimum for pure decoration,
 * and the axe checks (tests/a11y.spec.ts) leave out [data-decorative]
 * subtrees, which that spec also holds to aria-hidden with nothing
 * focusable inside. Text a visitor is meant to read never goes in one.
 */
export default function DNAHelix() {
  const isMobile = useMediaQuery('(max-width: 767px), (pointer: coarse)')
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMobile) return
    const inner = innerRef.current
    if (!inner) return
    // Reduced motion gets the helix standing still, drawn once.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rotation = 0
    let raf = 0
    let running = false

    const tick = () => {
      rotation += 0.3
      inner.style.transform = `rotateY(${rotation}deg)`
      raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    const io = new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop() }, { threshold: 0 })
    io.observe(inner)

    return () => {
      stop()
      io.disconnect()
    }
  }, [isMobile])

  if (isMobile) return null

  const count = TECH_SKILLS.length

  return (
    <div
      className="absolute right-0 top-1/2 -translate-y-1/2 w-32 pointer-events-none opacity-20 hidden lg:block"
      style={{ perspective: '800px', height: `${50 * count}px` }}
      aria-hidden="true"
      data-decorative
    >
      <div ref={innerRef} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {TECH_SKILLS.map((skill, i) => {
          const angle = (i / count) * 720
          const rad = (angle * Math.PI) / 180
          return (
            <div key={skill}>
              <div
                className="absolute font-mono text-[8px] text-white/60 whitespace-nowrap"
                style={{
                  transform: `translate3d(${40 * Math.cos(rad) + 40}px, ${50 * i}px, ${40 * Math.sin(rad)}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                {skill}
              </div>
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
                style={{
                  transform: `translate3d(${40 * Math.cos(rad + Math.PI) + 60}px, ${50 * i + 4}px, ${40 * Math.sin(rad + Math.PI)}px)`,
                }}
              />
              <div
                className="absolute h-px bg-white/10"
                style={{
                  width: '80px',
                  top: `${50 * i + 6}px`,
                  left: '0',
                  transform: `rotateY(${angle}deg)`,
                  transformOrigin: 'center',
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
