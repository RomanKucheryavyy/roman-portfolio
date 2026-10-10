'use client'
import { useRef } from 'react'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionShell } from '@/components/ui/SectionShell'
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
  useRevealOnScroll(sectionRef)

  // No SectionHeader: this is the one section without a heading, so its label
  // does the heading's job and keeps the extra gap below it. The narrow measure
  // belongs to the prose, not the section, so it sits on the text wrapper, at
  // the readout's own max-w-3xl: any wider and the HUD bracket's second corner
  // floated in empty space off the end of the box.
  return (
    <SectionShell ref={sectionRef} id="interlude">
      <p data-reveal className="section-label font-mono text-label tracking-[0.3em] uppercase text-white/30 mb-6">
        {'// interlude'}
      </p>

      <div data-reveal className="hud-corners max-w-3xl">
        <GlitchText
          text={LINE}
          highlightWords={HIGHLIGHTS}
          className="text-base sm:text-lg md:text-xl"
        />
      </div>

      <p data-reveal className="mt-5 font-mono text-label tracking-wider text-white/35">
        {isMobile ? '> tap any word to decode' : '> hover any word to decode'}
      </p>
    </SectionShell>
  )
}
