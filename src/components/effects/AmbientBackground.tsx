'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'

const SECTION_COLORS: Record<string, string> = {
  hero: '#000010',
  measures: '#050008',
  symphony: '#080500',
  compositions: '#070010',
  conductor: '#000805',
  compose: '#000510',
}

const SECTION_FOCUS: Record<string, { x: string; y: string }> = {
  hero: { x: '50%', y: '30%' },
  measures: { x: '40%', y: '40%' },
  symphony: { x: '60%', y: '50%' },
  compositions: { x: '50%', y: '40%' },
  conductor: { x: '45%', y: '45%' },
  compose: { x: '50%', y: '60%' },
}

/**
 * Fixed background layer that tints the page per active section.
 * Desktop: GSAP-animated background color. Mobile: static black with a
 * slow-moving radial glow (cheaper than animating backgroundColor).
 */
export default function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const activeSection = useStore((s) => s.activeSection)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    if (isMobile || !ref.current) return
    gsap.to(ref.current, {
      backgroundColor: SECTION_COLORS[activeSection] ?? '#000000',
      duration: 1.2,
      ease: 'power2.inOut',
    })
  }, [activeSection, isMobile])

  const focus = SECTION_FOCUS[activeSection] ?? SECTION_FOCUS.hero

  return (
    <div
      ref={ref}
      className="fixed inset-0"
      style={{ zIndex: 0, backgroundColor: '#000000' }}
      aria-hidden="true"
    >
      {isMobile && (
        <div
          className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
          style={{
            background: `radial-gradient(ellipse 80% 60% at ${focus.x} ${focus.y}, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)`,
          }}
        />
      )}
    </div>
  )
}
