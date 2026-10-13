'use client'
import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SectionShell } from '@/components/ui/SectionShell'
import { FactList, type Fact } from '@/components/ui/FactList'
import { PANEL } from '@/components/ui/Panel'
import { PILL_OUTLINE } from '@/components/ui/pill'
import DNAHelix from '@/components/canvas/DNAHelix'
import { CERTIFICATIONS, type Certification } from '@/lib/constants'
import { CURRENT_ROLE, EDUCATION, PREVIOUS_ROLES, monthYear, roleTitle, shortTitle, yearRange } from '@/lib/site-facts'
import { LIVE_CLIENT_WORK } from '@/lib/work'
import { keyColor, type SpectrumKey } from '@/lib/score'
import { cn } from '@/lib/utils'
import type { AppStoreFacts } from '@/lib/app-store'

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

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Jul 2025" → a sortable month number. */
const monthIndex = (date: string) => {
  const [month, year] = date.split(' ')
  return Number(year) * 12 + MONTH_ABBR.indexOf(month)
}

/** "Dec 2023 – Jul 2025": the oldest certification to the newest. */
function certSpan(): string {
  const dates = CERTIFICATIONS.map((c) => c.date).sort((a, b) => monthIndex(a) - monthIndex(b))
  const first = dates[0]
  const last = dates[dates.length - 1]
  return first === last ? first : `${first} – ${last}`
}

const LAST_ROLE = PREVIOUS_ROLES[0]
const DEGREE = EDUCATION[0]
const APPS_LIVE = LIVE_CLIENT_WORK.filter((w) => w.isApp).length

/** "Oct 10, 2026", in UTC so the server's answer reads the same everywhere. */
const checkedOn = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/**
 * The live App Store line, or nothing. It renders only when Apple answered
 * with a rating, a count and the time it answered: a stale or invented rating
 * is worse than none.
 */
function ratingNote(facts: AppStoreFacts | null): string | null {
  if (!facts) return null
  const { rating, count, checkedAt } = facts
  if (typeof rating !== 'number' || typeof count !== 'number' || !checkedAt) return null
  return `${rating.toFixed(1)} · ${count} rating${count === 1 ? '' : 's'} · checked ${checkedOn(checkedAt)}`
}

/**
 * A note whose parts never break inside: 'Salesforce · since Apr 2026' wraps
 * at its dot, and 'Dec 2023 – Jul 2025' at its dash, never as 'Apr / 2026'
 * or '2018– / 2020'.
 */
function Unbroken({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <>
      {text.split(' · ').map((part, i) => (
        <Fragment key={i}>
          {i > 0 ? ' · ' : null}
          {part.split(' – ').map((side, j, sides) => (
            <Fragment key={j}>
              {j > 0 ? ' ' : null}
              <span className="whitespace-nowrap">
                {side}
                {j < sides.length - 1 ? ' –' : null}
              </span>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  )
}

/**
 * The record row: who Roman is, in five derived facts. Every value is read
 * from site-facts, CERTIFICATIONS and the work list, and the rating is
 * fetched live, so nothing here is typed twice.
 */
function RecordRow() {
  const [appStore, setAppStore] = useState<AppStoreFacts | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/app-store', { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<AppStoreFacts>) : null))
      .then((facts) => setAppStore(facts))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const items: Fact[] = [
    {
      term: 'Now',
      value: roleTitle(CURRENT_ROLE),
      note: <Unbroken text={`${CURRENT_ROLE.company} · since ${monthYear(CURRENT_ROLE.start)}`} />,
    },
    {
      term: 'Before',
      value: [shortTitle(LAST_ROLE), LAST_ROLE.team].filter(Boolean).join(', '),
      note: <Unbroken text={yearRange(LAST_ROLE)} />,
    },
    {
      term: 'Certified',
      value: `${CERT_COUNT} Salesforce certifications`,
      note: <Unbroken text={certSpan()} />,
    },
    {
      term: 'Degree',
      value: DEGREE.degree,
      note: <Unbroken text={`${DEGREE.short} · ${yearRange(DEGREE)}`} />,
    },
    {
      term: 'Shipped',
      // A comma, not a dot: at 1440 the line wraps, and a dot left at its end reads as a stray.
      // 'including': the app is one of the live pieces, not a tenth. The
      // non-breaking space keeps 'App Store' on one line.
      value: `${LIVE_CLIENT_WORK.length} live sites & apps, including ${APPS_LIVE} on the App\u00a0Store`,
      note: <Unbroken text={ratingNote(appStore)} />,
    },
  ]

  return (
    <div data-reveal className="mb-8 md:mb-12">
      <FactList layout="grid" items={items} />
    </div>
  )
}

/** Each category's edge, in a spectrum key rather than its own hex. */
const CERT_ACCENTS: Record<Certification['category'], SpectrumKey> = {
  developer: 'blue',
  consultant: 'amber',
  ai: 'purple',
  admin: 'green',
}

/**
 * Keyboard focus shows the back, the way hovering does. globals.css does this
 * for a focused .flip-card; here the focus lands on the card's toggle inside
 * it, so the same turn is keyed off :has().
 */
const FLIP_ON_FOCUS = '[&:has(:focus-visible)_.flip-card-inner]:[transform:rotateY(180deg)]'

/**
 * A pressed card stays turned on every screen. globals.css turns a .flipped
 * card only under (hover: none), so on a desktop Enter, Space or a click set
 * aria-pressed while the card went back to its front as soon as focus or the
 * mouse left it.
 */
const FLIP_WHEN_PRESSED = '[&.flipped_.flip-card-inner]:[transform:rotateY(180deg)]'

/**
 * One certification. The front leads with its full name, the one heading per
 * cert; the back says who certified it and when, and links a verification
 * page once there is one.
 *
 * The toggle is a real button over the whole card, not the card itself: a
 * heading and a link can't live inside a <button> (its content is phrasing
 * only, and assistive tech flattens a button's children), so the faces sit
 * beside it and let clicks fall through to it.
 */
function CertCard({ cert }: { cert: Certification }) {
  const [flipped, setFlipped] = useState(false)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const edge = { borderLeftColor: keyColor(CERT_ACCENTS[cert.category]) }

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
      className={cn('flip-card relative h-44', FLIP_ON_FOCUS, FLIP_WHEN_PRESSED, flipped && 'flipped')}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setCursorVariant('hover')}
      onMouseLeave={() => setCursorVariant('default')}
    >
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={`Flip the ${cert.name} card`}
        className="absolute inset-0 rounded-xl"
        onClick={() => setFlipped((f) => !f)}
      />
      <div className="flip-card-inner pointer-events-none relative z-10 h-full w-full">
        <div
          className={cn(PANEL, 'flip-card-front absolute inset-0 flex flex-col justify-between border-l-2 p-4 sm:p-6')}
          style={edge}
        >
          <div ref={spotlightRef} className="absolute inset-0 rounded-xl" />
          <p className="font-mono text-label uppercase tracking-wider text-ink-meta">
            {cert.short} · {cert.category}
          </p>
          <h3 className="font-display text-body font-bold text-white sm:text-lead">{cert.name}</h3>
          <div className="flex items-center justify-between">
            <p className="font-mono text-label text-ink-meta">{cert.date}</p>
            <span aria-hidden="true" className="font-mono text-label text-ink-meta md:hidden">
              tap ↻
            </span>
          </div>
        </div>
        <div
          className={cn(PANEL, 'flip-card-back absolute inset-0 flex flex-col justify-center gap-2 border-l-2 p-4 sm:p-6')}
          style={edge}
        >
          <p className="font-mono text-small text-ink-body">Salesforce Certified</p>
          <p className="font-mono text-label text-ink-meta">{cert.date}</p>
          {cert.verifyUrl ? (
            <a
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Verify ${cert.name} (opens in a new tab)`}
              className={cn(PILL_OUTLINE, 'pointer-events-auto mt-2 self-start')}
              onClick={(e) => e.stopPropagation()}
            >
              Verify
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          ) : null}
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

      <RecordRow />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {CERTIFICATIONS.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>
    </SectionShell>
  )
}
