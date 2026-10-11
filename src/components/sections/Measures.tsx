'use client'
import { useRef, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
import DNAHelix from '@/components/canvas/DNAHelix'
import { CERTIFICATIONS } from '@/lib/constants'

/** "eight", for a count that opens a sentence. Past twenty it stays a numeral. */
const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
] as const

function toWords(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// The count is CERTIFICATIONS.length: the intro said "Eight" by hand.
const CERT_COUNT = CERTIFICATIONS.length
const INTRO = `${capitalize(toWords(CERT_COUNT))} certification${CERT_COUNT === 1 ? '' : 's'}, one CS degree, and a relentless habit of learning. Each credential here was earned in the field — not a checklist, but a growing repertoire.`

const CERT_ACCENTS: Record<string, string> = {
  developer: '#ffffff',
  consultant: '#888888',
  ai: '#af52de',
  admin: '#30d158',
}

function CertCard({ cert }: { cert: (typeof CERTIFICATIONS)[number] }) {
  const [flipped, setFlipped] = useState(false)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const accent = CERT_ACCENTS[cert.category] ?? '#ffffff'

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 60%)`
    }
  }

  return (
    <div
      data-reveal
      className={`flip-card h-44 ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setCursorVariant('hover')}
      onMouseLeave={() => setCursorVariant('default')}
    >
      <div className="flip-card-inner relative w-full h-full">
        <div
          className="flip-card-front absolute inset-0 rounded-xl border border-white/5 bg-[#0a0a0a] p-6 flex flex-col justify-between"
          style={{ borderLeft: `2px solid ${accent}` }}
        >
          <div ref={spotlightRef} className="absolute inset-0 rounded-xl pointer-events-none" />
          <span className="font-mono text-[10px] text-white/35 uppercase tracking-wider">{cert.category}</span>
          <h3 className="font-display text-lg font-bold text-white mt-2">{cert.short}</h3>
          <div className="relative z-10 flex items-center justify-between">
            <p className="font-mono text-[10px] text-white/30">{cert.date}</p>
            <span className="md:hidden font-mono text-[10px] text-white/40">tap ↻</span>
          </div>
        </div>
        <div
          className="flip-card-back absolute inset-0 rounded-xl border border-white/10 bg-[#111] p-4 sm:p-6 flex flex-col justify-center"
          style={{ borderLeft: `2px solid ${accent}` }}
        >
          <h3 className="font-display text-sm sm:text-base font-bold text-white mb-2">{cert.name}</h3>
          <p className="font-mono text-[11px] sm:text-xs text-white/40">Salesforce Certified</p>
          <p className="font-mono text-[11px] sm:text-xs text-white/30 mt-2">{cert.date}</p>
        </div>
      </div>
    </div>
  )
}

export default function Measures() {
  const sectionRef = useRef<HTMLElement>(null)
  useRevealOnScroll(sectionRef)

  return (
    <SectionShell ref={sectionRef} id="measures">
      <DNAHelix />
      <SectionHeader
        movement="measures"
        title={{ lead: 'The', accent: 'Measures' }}
        intro={INTRO}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {CERTIFICATIONS.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>

      <div data-reveal className="mt-12 p-6 rounded-xl border border-white/5 bg-[#0a0a0a] flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white font-display font-bold text-lg">
          UW
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">University of Washington</h3>
          <p className="text-sm text-white/40">BS, Computer Science &amp; Systems</p>
        </div>
      </div>
    </SectionShell>
  )
}
