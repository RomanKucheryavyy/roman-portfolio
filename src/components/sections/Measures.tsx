'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import ScatterText from '@/components/effects/ScatterText'
import RevealMask from '@/components/effects/RevealMask'
import MobileReveal from '@/components/effects/MobileReveal'
import DNAHelix from '@/components/canvas/DNAHelix'
import { CERTIFICATIONS } from '@/lib/constants'

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
      className={`flip-card cert-card h-44 ${flipped ? 'flipped' : ''}`}
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
          <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">{cert.category}</span>
          <h3 className="font-display text-lg font-bold text-white mt-2">{cert.short}</h3>
          <p className="relative z-10 font-mono text-[10px] text-white/30">{cert.date}</p>
        </div>
        <div
          className="flip-card-back absolute inset-0 rounded-xl border border-white/10 bg-[#111] p-6 flex flex-col justify-center"
          style={{ borderLeft: `2px solid ${accent}` }}
        >
          <h3 className="font-display text-base font-bold text-white mb-2">{cert.name}</h3>
          <p className="font-mono text-xs text-white/40">Salesforce Certified</p>
          <p className="font-mono text-xs text-white/30 mt-2">{cert.date}</p>
        </div>
      </div>
    </div>
  )
}

export default function Measures() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const cards = section.querySelectorAll('.cert-card')
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, x: i % 2 === 0 ? -80 : 80 },
        {
          opacity: 1, x: 0, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        }
      )
    })

    gsap.fromTo(
      section.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="measures" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto relative">
        <DNAHelix />
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          {'// 01. Certifications'}
        </p>
        <h2 data-section-heading className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => {
              const el = document.querySelector('#measures [data-section-heading]')
              if (el) el.innerHTML = 'The <span class="text-gradient">Measures</span>'
            }}
          >
            The Measures
          </ScatterText>
        </h2>
        <p data-reveal className="text-white/40 max-w-lg mb-16">
          Eight certifications, one CS degree, and a relentless habit of learning. Each credential here was
          earned in the field — not a checklist, but a growing repertoire.
        </p>

        <RevealMask direction="bottom" duration={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {CERTIFICATIONS.map((cert, i) => (
              <MobileReveal key={cert.id} delay={80 * i}>
                <CertCard cert={cert} />
              </MobileReveal>
            ))}
          </div>
        </RevealMask>

        <MobileReveal>
          <div data-reveal className="mt-12 p-6 rounded-xl border border-white/5 bg-[#0a0a0a] flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white font-display font-bold text-lg">
              UW
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">University of Washington</h3>
              <p className="text-sm text-white/40">BS, Computer Science &amp; Systems</p>
            </div>
          </div>
        </MobileReveal>
      </div>
    </section>
  )
}
