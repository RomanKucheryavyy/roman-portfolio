'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import MobileReveal from '@/components/effects/MobileReveal'
import GlitchText from '@/components/ui/glitch-text-animation'

const LINE =
  'PRECISION IS NOT THE OPPOSITE OF ART. THE SAME EAR THAT CATCHES A FLAT TRUMPET CATCHES A RACE CONDITION. I SHIP BOTH.'

const HIGHLIGHTS = ['PRECISION', 'ART', 'TRUMPET', 'RACE', 'CONDITION', 'SHIP']

/**
 * An interlude between the work and the person behind it: one line, rendered
 * as a CRT readout that decodes itself under the pointer. Unnumbered on
 * purpose — the numbered sections are movements, this is the bar's rest.
 */
export default function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null)
  const { isMobile } = useDeviceCapability()

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.fromTo(
      sectionRef.current.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="interlude" className="py-14 md:py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <p data-reveal className="section-label font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-6">
          {'// interlude'}
        </p>

        <MobileReveal>
          <div data-reveal className="hud-corners">
            <GlitchText
              text={LINE}
              highlightWords={HIGHLIGHTS}
              className="text-base sm:text-lg md:text-xl"
            />
          </div>
        </MobileReveal>

        <p data-reveal className="mt-5 font-mono text-[10px] tracking-wider text-white/25">
          {isMobile ? '> tap any word to decode' : '> hover any word to decode'}
        </p>
      </div>
    </section>
  )
}
