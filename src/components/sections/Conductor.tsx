'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from '@/hooks/useGSAP'
import { useGyroParallax } from '@/hooks/useGyroParallax'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
import { FactList, type Fact } from '@/components/ui/FactList'
import { Panel } from '@/components/ui/Panel'
import { TerminalBar } from '@/components/ui/TerminalBar'
import YearInMeasures from '@/components/effects/YearInMeasures'
import { CERTIFICATIONS } from '@/lib/constants'
import { CURRENT_ROLE, PREVIOUS_ROLES, monthYear, roleTitle, shortRole } from '@/lib/site-facts'

/**
 * The plain account of who Roman is, before the photo on every width. The
 * role and team are read from site-facts, so a team change can't leave this
 * section a step behind again (it named his old team months after he moved).
 */
const INTRO = `${CURRENT_ROLE.title} at ${CURRENT_ROLE.company}, on ${CURRENT_ROLE.team}; before that, Premier support for ${PREVIOUS_ROLES[0].team}. I build in React, Next.js, Swift and Apex, and I conduct the FUBC Band.`

const CODE_LINES = [
  '// Roman Kucheryavyy',
  '// Orchestrating Logic & Art',
  '',
  'const roman = {',
  `  role: "${shortRole(CURRENT_ROLE)}",`,
  '  craft: ["React", "Next.js", "Swift", "Apex"],',
  `  certs: ${CERTIFICATIONS.length},`,
  '  band: "FUBC — conductor, trumpet",',
  '  priority: "family.first()",',
  '};',
  '',
  'while (awake) {',
  '  build(); conduct(); learn();',
  '}',
]

/** One ink per kind of line, so the card reads as code without a highlighter. */
function inkOf(line: string): string {
  if (line.startsWith('//')) return 'text-ink-meta'
  if (/\b(const|while)\b/.test(line)) return 'text-white'
  if (line.includes('"')) return 'text-ink-body'
  return 'text-ink-meta'
}

/** The terminal card's facts. "Now" reads the same as the Credentials record row. */
const WORK_FACTS: Fact[] = [
  {
    term: 'Now',
    value: roleTitle(CURRENT_ROLE),
    note: `${CURRENT_ROLE.company} · since ${monthYear(CURRENT_ROLE.start)}`,
  },
  { term: 'Builds', value: 'React, Next.js, Swift, Java — concept to deploy' },
]

const LIFE_FACTS: Fact[] = [
  { term: 'Music', value: 'FUBC Band — trumpet, arranger, director' },
  { term: 'Home', value: 'Husband and father' },
]

/**
 * In a three-across card a 10rem term column leaves the value a sliver, so
 * from lg each fact stacks, the way FactList already lays it out on phones.
 */
const STACK_IN_CARD = 'lg:[&>div]:grid-cols-1 lg:[&>div]:gap-1'

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
  const tiltRef = useGyroParallax({ maxOffset: 10 })
  useRevealOnScroll(sectionRef)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (photoRef.current) photoRef.current.style.opacity = '1'
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
    <SectionShell ref={sectionRef} id="conductor">
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

      <SectionHeader movement="conductor" title={{ lead: 'The', accent: 'Conductor' }} intro={INTRO} />

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
              <p className="font-display text-lead font-bold text-white">Roman Kucheryavyy</p>
              <p className="font-mono text-label tracking-wider text-ink-meta">Orchestrating Logic &amp; Art</p>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <Panel data-reveal className="overflow-hidden">
          <TerminalBar title="roman@portfolio ~" />
          <div
            role="region"
            aria-label="roman.ts"
            tabIndex={0}
            className="mobile-scroll-hide overflow-x-auto p-5 font-mono text-label leading-relaxed"
          >
            <div className="w-max min-w-full">
              {CODE_LINES.map((line, i) => (
                <div key={i} className="flex whitespace-pre">
                  <span aria-hidden="true" className="mr-3 w-5 flex-shrink-0 select-none text-right text-ink-faint">
                    {i + 1}
                  </span>
                  <span className={inkOf(line)}>{line || ' '}</span>
                </div>
              ))}
              <div className="mt-1 flex">
                <span aria-hidden="true" className="mr-3 w-5 select-none text-right text-ink-faint">
                  {CODE_LINES.length + 1}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-1.5 animate-[blink_1s_step-end_infinite] bg-white/50 motion-reduce:[animation:none]"
                />
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-5 py-3">
            <FactList items={WORK_FACTS} className={STACK_IN_CARD} />
          </div>
        </Panel>

        {/* Music */}
        <Panel data-reveal className="overflow-hidden">
          <div className="p-5">
            <svg viewBox="0 0 480 80" className="mb-4 h-auto w-full" fill="none" aria-hidden="true">
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
            <p className="mb-4 text-small text-ink-body">
              Music and code run on the same engine — structure, rhythm, and knowing exactly when to
              improvise. As head conductor of the FUBC Band, I shape sound the way I shape software: with
              intention and a little audacity.
            </p>
            <p className="mb-4 text-small text-ink-body">
              Off the clock, my wife and daughter remind me why any of this matters. The best things I
              build serve people I love.
            </p>
            <FactList items={LIFE_FACTS} className={STACK_IN_CARD} />
          </div>
        </Panel>
      </div>

      <YearInMeasures />

      {/* Timeline — vertical "git log" on phones, horizontal staff on larger screens */}
      <div className="mt-10 sm:hidden relative pl-1">
        <div className="absolute left-[4px] top-2 bottom-2 w-px bg-white/20" />
        {TIMELINE.map((item) => (
          <div key={item.year} className="flex items-center gap-4 py-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-white/50 relative z-10 shrink-0 -ml-[1px]" />
            <span className="font-mono text-xs text-white/70 w-10 shrink-0">{item.year}</span>
            <span className="font-mono text-[11px] text-white/50">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-16 relative pt-4 pb-2 hidden sm:block">
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
    </SectionShell>
  )
}
