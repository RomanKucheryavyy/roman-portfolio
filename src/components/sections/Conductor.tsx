'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Code, Music, Heart, Cloud } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useGyroParallax } from '@/hooks/useGyroParallax'
import ScatterText from '@/components/effects/ScatterText'
import RevealMask from '@/components/effects/RevealMask'
import MobileReveal from '@/components/effects/MobileReveal'
import YearInMeasures from '@/components/effects/YearInMeasures'

const CODE_LINES = [
  '// Roman Kucheryavyy',
  '// Orchestrating Logic & Art',
  '',
  'const roman = {',
  '  role: "Sr. TSE, Salesforce Gov Cloud",',
  '  craft: ["React", "Next.js", "Swift", "Apex"],',
  '  certs: 8,',
  '  band: "FUBC — conductor, trumpet",',
  '  priority: "family.first()",',
  '};',
  '',
  'while (awake) {',
  '  build(); conduct(); learn();',
  '}',
]

const NOTES = [
  { x: 60, y: 30 }, { x: 130, y: 50 }, { x: 200, y: 25 },
  { x: 270, y: 55 }, { x: 340, y: 35 }, { x: 410, y: 45 },
]

const TIMELINE = [
  { year: '2016', label: 'CS @ Highline' },
  { year: '2018', label: 'UW Tacoma' },
  { year: '2021', label: 'Microsoft' },
  { year: '2023', label: 'Salesforce' },
  { year: 'Now', label: '8 Certs' },
]

export default function Conductor() {
  const sectionRef = useRef<HTMLElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const musicRef = useRef<HTMLDivElement>(null)
  const tiltRef = useGyroParallax({ maxOffset: 10 })

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ;[photoRef, terminalRef, musicRef].forEach((r) => { if (r.current) r.current.style.opacity = '1' })
      return
    }

    if (photoRef.current) {
      gsap.fromTo(
        photoRef.current,
        { filter: 'grayscale(100%) brightness(0.7)', scale: 1.05, opacity: 0 },
        {
          filter: 'grayscale(0%) brightness(1)', scale: 1, opacity: 1, duration: 1.5, ease: 'power2.out',
          scrollTrigger: { trigger: photoRef.current, start: 'top 80%', end: 'top 30%', scrub: 1 },
        }
      )
    }
    if (terminalRef.current) {
      gsap.fromTo(
        terminalRef.current,
        { opacity: 0, x: -80 },
        {
          opacity: 1, x: 0, duration: 1, ease: 'expo.out',
          scrollTrigger: { trigger: section, start: 'top 65%', once: true },
        }
      )
    }
    if (musicRef.current) {
      gsap.fromTo(
        musicRef.current,
        { opacity: 0, x: 80 },
        {
          opacity: 1, x: 0, duration: 1, ease: 'expo.out', delay: 0.15,
          scrollTrigger: { trigger: section, start: 'top 65%', once: true },
        }
      )
    }

    gsap.fromTo(
      section.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      }
    )

    const timelineLine = section.querySelector('[data-timeline-line]')
    if (timelineLine) {
      gsap.fromTo(
        timelineLine,
        { scaleX: 0 },
        {
          scaleX: 1, duration: 1.5, ease: 'power2.inOut',
          scrollTrigger: { trigger: timelineLine, start: 'top 85%', once: true },
        }
      )
      gsap.fromTo(
        section.querySelectorAll('[data-timeline-dot]'),
        { scale: 0, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1,0.5)', stagger: 0.15, delay: 0.5,
          scrollTrigger: { trigger: timelineLine, start: 'top 85%', once: true },
        }
      )
    }
  }, [])

  return (
    <section ref={sectionRef} id="conductor" className="py-24 px-6 md:px-16 relative z-10">
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="halftone">
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-label font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          {'// 04. About'}
        </p>
        <h2 data-section-heading className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-12">
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => {
              const el = document.querySelector('#conductor [data-section-heading]')
              if (el) el.innerHTML = 'The <span class="text-gradient">Conductor</span>'
            }}
          >
            The Conductor
          </ScatterText>
        </h2>

        <RevealMask direction="center" duration={1.4}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Photo */}
            <div ref={tiltRef}>
              <div ref={photoRef} className="relative rounded-xl overflow-hidden aspect-[3/4] group" style={{ opacity: 0 }}>
                <Image
                  src="/images/roman.jpg"
                  alt="Roman Kucheryavyy"
                  fill
                  className="object-cover object-top transition-all duration-700"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-multiply"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-display text-lg font-bold text-white">Roman Kucheryavyy</p>
                  <p className="font-mono text-[10px] text-white/50 tracking-wider">Orchestrating Logic &amp; Art</p>
                </div>
              </div>
            </div>

            {/* Terminal */}
            <MobileReveal delay={100}>
              <div ref={terminalRef} className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden opacity-0">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-[10px] text-white/20">roman@portfolio ~</span>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed">
                  {CODE_LINES.map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-white/15 select-none w-5 text-right mr-3 flex-shrink-0">{i + 1}</span>
                      <span
                        className={
                          line.startsWith('//') ? 'text-white/25'
                          : line.includes('const') || line.includes('async') || line.includes('function') ? 'text-white/80'
                          : line.includes('"') ? 'text-white/50'
                          : 'text-white/35'
                        }
                      >
                        {line || ' '}
                      </span>
                    </div>
                  ))}
                  <div className="flex mt-1">
                    <span className="text-white/15 select-none w-5 text-right mr-3">{CODE_LINES.length + 1}</span>
                    <span className="w-1.5 h-3.5 bg-white/50 inline-block" style={{ animation: 'blink 1s step-end infinite' }} />
                  </div>
                </div>
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <Cloud size={14} className="text-white/50" />
                    <span className="text-[11px] text-white/40">Salesforce Gov Cloud — Premier Support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Code size={14} className="text-white/50" />
                    <span className="text-[11px] text-white/40">React, Next.js, Swift, Java — concept to deploy</span>
                  </div>
                </div>
              </div>
            </MobileReveal>

            {/* Music */}
            <MobileReveal delay={200}>
              <div ref={musicRef} className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden opacity-0">
                <div className="p-5">
                  <svg viewBox="0 0 480 80" className="w-full h-auto mb-4" fill="none">
                    {[15, 25, 35, 45, 55].map((y) => (
                      <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                    ))}
                    {NOTES.map((note, i) => (
                      <g key={i} transform={`translate(${note.x}, ${note.y})`}>
                        <ellipse cx="0" cy="0" rx="6" ry="4" fill="rgba(255,255,255,0.4)" transform="rotate(-15)" />
                        <line x1="6" y1="-2" x2="6" y2="-22" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                      </g>
                    ))}
                  </svg>
                  <p className="text-white/40 text-sm leading-relaxed mb-4">
                    Music and code run on the same engine — structure, rhythm, and knowing exactly when to
                    improvise. As head conductor of the FUBC Band, I shape sound the way I shape software: with
                    intention and a little audacity.
                  </p>
                  <p className="text-white/40 text-sm leading-relaxed mb-6">
                    Off the clock, my wife and daughter remind me why any of this matters. The best things I
                    build serve people I love.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Music size={14} className="text-white/50" />
                      <span className="text-[11px] text-white/40">FUBC Band — trumpet, arranger, director</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Heart size={14} className="text-white/50" />
                      <span className="text-[11px] text-white/40">Husband and father — the most important role</span>
                    </div>
                  </div>
                </div>
              </div>
            </MobileReveal>
          </div>
        </RevealMask>

        <MobileReveal>
          <YearInMeasures />
        </MobileReveal>

        {/* Timeline */}
        <div className="mt-16 relative pt-4 pb-2">
          <div
            data-timeline-line
            className="absolute left-0 w-full h-px bg-white/20 origin-left"
            style={{ top: '16px', transform: 'scaleX(0)' }}
          />
          <div className="flex justify-between relative">
            {TIMELINE.map((item) => (
              <div key={item.year} data-timeline-dot className="flex flex-col items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-white/50 relative z-10" />
                <span className="font-mono text-[10px] text-white/60 mt-1">{item.year}</span>
                <span className="font-mono text-[8px] sm:text-[9px] text-white/25 text-center leading-tight max-w-[60px] sm:max-w-none">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
