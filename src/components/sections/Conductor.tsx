'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from '@/hooks/useGSAP'
import { useGyroParallax } from '@/hooks/useGyroParallax'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SectionShell } from '@/components/ui/SectionShell'
import { FactList, type Fact } from '@/components/ui/FactList'
import { Panel } from '@/components/ui/Panel'
import { TerminalBar } from '@/components/ui/TerminalBar'
import YearInMeasures from '@/components/effects/YearInMeasures'
import { CERTIFICATIONS } from '@/lib/constants'
import { CURRENT_ROLE, PREVIOUS_ROLES, TIMELINE, monthYear, roleTitle, shortRole } from '@/lib/site-facts'
import { cn } from '@/lib/utils'

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
  // Roman's own words, as he has had them since his first commit (286708e).
  { term: 'Home', value: 'Husband and father — the most important role' },
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

const FIRST_YEAR = Math.min(...TIMELINE.map((t) => t.year))
const LAST_YEAR = Math.max(...TIMELINE.map((t) => t.year))

/** Where an entry's dot sits on the rail: its year's share of the whole span. */
const railAt = (year: number) => ((year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR || 1)) * 100

/**
 * On the rail the first and last entries hug its ends, so their labels never
 * hang off the column; the ones between centre on their dot.
 */
function railPlace(i: number): { shift: string; align: string } {
  if (i === 0) return { shift: '', align: 'sm:items-start sm:text-left' }
  if (i === TIMELINE.length - 1) return { shift: 'sm:-translate-x-full', align: 'sm:items-end sm:text-right' }
  return { shift: 'sm:-translate-x-1/2', align: 'sm:items-center sm:text-center' }
}

export default function Conductor() {
  const sectionRef = useRef<HTMLElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  // The phone tilt is motion too: off when the visitor asks for less.
  const tiltRef = useGyroParallax({ maxOffset: 10, enabled: !reduced })
  useRevealOnScroll(sectionRef)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const photo = photoRef.current
    const timeline = section.querySelector<HTMLElement>('[data-timeline]')
    const line = section.querySelector<HTMLElement>('[data-timeline-line]')
    const dots = section.querySelectorAll<HTMLElement>('[data-timeline-dot]')

    // Reduced motion: everything in its final place, nothing tweened.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (photo) photo.style.opacity = '1'
      if (line) line.style.transform = 'none'
      dots.forEach((dot) => {
        dot.style.opacity = '1'
      })
      return
    }

    // One context, reverted on unmount, so leaving for /works and coming
    // back doesn't stack a second set of ScrollTriggers on the first.
    const ctx = gsap.context(() => {
      if (photo) {
        gsap.fromTo(
          photo,
          { filter: 'grayscale(100%) brightness(0.7)', scale: 1.05, opacity: 0 },
          {
            filter: 'grayscale(0%) brightness(1)', scale: 1, opacity: 1, duration: 1.5, ease: 'power2.out',
            scrollTrigger: { trigger: photo, start: 'top 80%', end: 'top 30%', scrub: 1 },
          }
        )
      }
      if (!timeline || !line) return
      // The rule draws and the dots land only on the horizontal rail (sm up),
      // as before; the phone list has always stood still.
      gsap.matchMedia().add('(min-width: 640px)', () => {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1, duration: 1.5, ease: 'power2.inOut',
            scrollTrigger: { trigger: timeline, start: 'top 85%', once: true },
          }
        )
        gsap.fromTo(
          dots,
          { scale: 0, opacity: 0 },
          {
            scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1,0.5)', stagger: 0.15, delay: 0.5,
            scrollTrigger: { trigger: timeline, start: 'top 85%', once: true },
          }
        )
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <SectionShell ref={sectionRef} id="conductor">
      <SectionHeader movement="conductor" title={{ lead: 'The', accent: 'Conductor' }} intro={INTRO} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Photo: 3:4 on its own; three across it fills the row, so its
            foot lines up with the two cards beside it. */}
        <div ref={tiltRef}>
          <div
            ref={photoRef}
            className="relative rounded-xl overflow-hidden aspect-[3/4] lg:aspect-auto lg:h-full group"
            style={{ opacity: 0 }}
          >
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
          {/* The lines wrap, with a hanging indent under their own code, so
              the whole card reads at every width. It used to be a sideways
              scroller with no visible scrollbar, and its two longest lines
              (the role and the craft list) were cut at the card's edge at
              1440, 1024 and 390, mid-word. Nothing scrolls now, so the
              region is no longer a tab stop. */}
          <div role="region" aria-label="roman.ts" className="p-5 font-mono text-label leading-relaxed">
            <div>
              {CODE_LINES.map((line, i) => {
                const indent = line.length - line.trimStart().length
                return (
                  <div key={i} className="flex">
                    <span aria-hidden="true" className="mr-3 w-5 flex-shrink-0 select-none text-right text-ink-meta">
                      {i + 1}
                    </span>
                    <span
                      className={cn('min-w-0 whitespace-pre-wrap wrap-break-word', inkOf(line))}
                      // The first line starts at its indent; a wrapped line two
                      // characters further in.
                      style={{ paddingLeft: `${indent + 2}ch`, textIndent: '-2ch' }}
                    >
                      {line.trimStart() || ' '}
                    </span>
                  </div>
                )
              })}
              <div className="mt-1 flex">
                <span aria-hidden="true" className="mr-3 w-5 select-none text-right text-ink-meta">
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

      {/*
        Timeline: one list from site-facts. On phones it reads top to bottom
        down a rail (the structure of 21st.dev 28384, Milestone Timeline, not
        installed); from sm the same items sit along a horizontal rule at their
        real years, with a fermata held over the current one.
      */}
      <div className="relative mt-10 sm:mt-16 sm:pt-8">
        <div className="relative">
          <div
            data-timeline-line
            aria-hidden="true"
            className="absolute inset-x-0 top-1 hidden h-px origin-left bg-white/20 sm:block"
            style={{ transform: 'scaleX(0)' }}
          />
          <ol data-timeline aria-label="Timeline" className="relative sm:h-24">
            {TIMELINE.map((item, i) => {
              const last = i === TIMELINE.length - 1
              const { shift, align } = railPlace(i)
              return (
                <li
                  key={item.label}
                  className={cn('sm:absolute sm:top-0', shift)}
                  style={{ left: `${railAt(item.year)}%` }}
                >
                  <div data-timeline-dot className={cn('flex gap-4 sm:flex-col sm:gap-2', align)}>
                    <div className="relative flex flex-col items-center">
                      {item.current ? (
                        <span
                          aria-hidden="true"
                          className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 text-lead leading-none text-ink-body sm:block"
                        >
                          {'\u{1D110}'}
                        </span>
                      ) : null}
                      <span className="mt-1 size-2.5 shrink-0 rounded-full border border-white/50 bg-white sm:mt-0" />
                      {last ? null : <span aria-hidden="true" className="w-px flex-1 bg-white/20 sm:hidden" />}
                    </div>
                    <div className={cn('flex flex-wrap items-baseline gap-x-4 font-mono text-label sm:block', !last && 'pb-5 sm:pb-0')}>
                      <span className="w-10 shrink-0 text-ink-body sm:block sm:w-auto">{item.year}</span>
                      <span className="text-ink-meta sm:mt-1 sm:block sm:max-w-24 lg:max-w-40">
                        {item.label}
                        {item.current ? (
                          <>
                            <span aria-hidden="true" className="-my-1 ml-2 inline-block align-middle text-lead leading-none sm:hidden">
                              {'\u{1D110}'}
                            </span>
                            <span className="sr-only">, current</span>
                          </>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </SectionShell>
  )
}
