'use client'
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { CERTIFICATIONS } from '@/lib/constants'

const CATEGORY_ACCENTS: Record<string, string> = {
  developer: '#ffffff',
  consultant: '#888888',
  ai: '#af52de',
  admin: '#30d158',
}

function CertCard({ cert, index }: { cert: (typeof CERTIFICATIONS)[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const accent = CATEGORY_ACCENTS[cert.category]

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!glowRef.current || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glowRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 60%)`
  }

  return (
    <div
      ref={cardRef}
      className="flip-card cert-card h-44"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setCursorVariant('hover')}
      onMouseLeave={() => setCursorVariant('default')}
    >
      <div className="flip-card-inner relative w-full h-full">
        {/* Front */}
        <div
          className="flip-card-front absolute inset-0 rounded-xl border border-white/5 bg-[#0a0a0a] p-6 flex flex-col justify-between"
          style={{ borderLeft: `2px solid ${accent}` }}
        >
          <div ref={glowRef} className="absolute inset-0 rounded-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider">{cert.category}</span>
            <h3 className="font-display text-lg font-bold text-white mt-2">{cert.short}</h3>
          </div>
          <p className="relative z-10 font-mono text-[10px] text-white/30">{cert.date}</p>
        </div>

        {/* Back */}
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

export default function Arsenal() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    // Stagger cards from alternating sides
    const cards = sectionRef.current.querySelectorAll('.cert-card')
    cards.forEach((card, i) => {
      const fromLeft = i % 2 === 0
      gsap.fromTo(card,
        { opacity: 0, x: fromLeft ? -80 : 80 },
        {
          opacity: 1, x: 0, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        }
      )
    })

    // Header reveal
    const header = sectionRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(header,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="arsenal" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          // 01. Certifications
        </p>
        <h2 data-reveal className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          The <span className="text-gradient">Measures</span>
        </h2>
        <p data-reveal className="text-white/40 max-w-lg mb-16">
          8 Salesforce certifications and a CS degree. Hover to reveal details.
        </p>

        {/* 2x4 Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {CERTIFICATIONS.map((cert, i) => (
            <CertCard key={cert.id} cert={cert} index={i} />
          ))}
        </div>

        {/* Education */}
        <div data-reveal className="mt-12 p-6 rounded-xl border border-white/5 bg-[#0a0a0a] flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-white font-display font-bold text-lg">
            UW
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">University of Washington</h3>
            <p className="text-sm text-white/40">BS, Computer Science & Systems — 3.7 GPA</p>
          </div>
        </div>
      </div>
    </section>
  )
}
