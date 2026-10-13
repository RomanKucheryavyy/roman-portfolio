'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
  const isMobile = useMediaQuery('(max-width: 767px), (pointer: coarse)')

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
    // A size container, so the glow can be placed in its units (cqw / cqh).
    <div
      ref={ref}
      className="fixed inset-0 [container-type:size]"
      style={{ zIndex: 0, backgroundColor: '#000000' }}
      aria-hidden="true"
    >
      {isMobile && (
        // A fixed-size glow moved by a transform: gradient strings can't
        // interpolate, so animating `background` just snapped, and moving it
        // by left / top laid the page out on every frame of every section
        // change (nine layout-shift entries per scroll at 390). A transform
        // stays on the compositor.
        <div
          className="absolute left-0 top-0 w-[150vw] h-[150vw] rounded-full"
          style={{
            transform: `translate(calc(${parseFloat(focus.x)}cqw - 50%), calc(${parseFloat(focus.y)}cqh - 50%))`,
            transition: 'transform 1.2s ease-in-out',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 40%, transparent 70%)',
          }}
        />
      )}
    </div>
  )
}
