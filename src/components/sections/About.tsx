'use client'
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { Code, Music, Heart, Cloud } from 'lucide-react'

const CODE_LINES = [
  '// Roman Kucheryavyy — Engineer',
  'const stack = {',
  '  cloud: "Salesforce Gov Cloud",',
  '  frontend: ["React", "Next.js", "Swift"],',
  '  backend: ["Apex", "Node.js", "Python"],',
  '  certs: 8,',
  '  passion: "Orchestrating Logic & Art"',
  '};',
  '',
  'async function solve(issue: Case) {',
  '  const root = await investigate(issue);',
  '  return implement(root.fix);',
  '}',
]

const NOTES = [
  { x: 60, y: 30 }, { x: 130, y: 50 }, { x: 200, y: 25 },
  { x: 270, y: 55 }, { x: 340, y: 35 }, { x: 410, y: 45 },
]

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !leftRef.current || !rightRef.current) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    // Split-screen entrance: left from left, right from right
    gsap.fromTo(leftRef.current,
      { opacity: 0, x: -100 },
      {
        opacity: 1, x: 0, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      }
    )
    gsap.fromTo(rightRef.current,
      { opacity: 0, x: 100 },
      {
        opacity: 1, x: 0, duration: 1, ease: 'expo.out', delay: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
      }
    )

    // Header reveal
    const header = sectionRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(header,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )

    // Timeline animation
    const timelineLine = sectionRef.current.querySelector('[data-timeline-line]') as HTMLElement
    const timelineDots = sectionRef.current.querySelectorAll('[data-timeline-dot]')
    if (timelineLine) {
      gsap.fromTo(timelineLine,
        { scaleX: 0 },
        {
          scaleX: 1, duration: 1.5, ease: 'power2.inOut',
          scrollTrigger: { trigger: timelineLine, start: 'top 85%', once: true },
        }
      )
    }
    gsap.fromTo(timelineDots,
      { scale: 0, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1,0.5)', stagger: 0.15,
        scrollTrigger: { trigger: timelineLine, start: 'top 85%', once: true },
        delay: 0.5,
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="about" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          // 03. About
        </p>
        <h2 data-reveal className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-12">
          The <span className="text-gradient">Conductor</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Terminal */}
          <div ref={leftRef} className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden opacity-0">
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
                  <span className={
                    line.startsWith('//') ? 'text-white/25'
                    : line.includes('const') || line.includes('async') || line.includes('function') ? 'text-white/80'
                    : line.includes('"') ? 'text-white/50'
                    : 'text-white/35'
                  }>{line || '\u00A0'}</span>
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

          {/* RIGHT: Conductor */}
          <div ref={rightRef} className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden opacity-0">
            <div className="p-5">
              <svg viewBox="0 0 480 80" className="w-full h-auto mb-4" fill="none">
                {[15, 25, 35, 45, 55].map((y, i) => (
                  <line key={i} x1="0" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                ))}
                {NOTES.map((note, i) => (
                  <g key={i} transform={`translate(${note.x}, ${note.y})`}>
                    <ellipse cx="0" cy="0" rx="6" ry="4" fill="rgba(255,255,255,0.4)" transform="rotate(-15)" />
                    <line x1="6" y1="-2" x2="6" y2="-22" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                  </g>
                ))}
              </svg>
              <p className="text-white/40 text-sm leading-relaxed mb-4">
                Music and code share the same DNA — structure, rhythm, improvisation within constraints.
                As head conductor of the FUBC Band, I translate emotion into organized sound.
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                My wife and daughter are my greatest inspiration. The best technology serves people.
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
        </div>

        {/* Timeline */}
        <div className="mt-16 relative py-8">
          <div
            data-timeline-line
            className="absolute top-1/2 left-0 w-full h-px bg-white/20 -translate-y-1/2 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
          <div className="flex justify-between relative">
            {[
              { year: '2016', label: 'CS @ Highline' },
              { year: '2018', label: 'CS @ UW Tacoma' },
              { year: '2021', label: 'Microsoft' },
              { year: '2023', label: 'Salesforce' },
              { year: 'Now', label: '8 Certs' },
            ].map((item) => (
              <div key={item.year} data-timeline-dot className="flex flex-col items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-white/50" />
                <span className="font-mono text-[10px] text-white/60">{item.year}</span>
                <span className="font-mono text-[9px] text-white/25 hidden sm:block">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
