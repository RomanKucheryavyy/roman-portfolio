'use client'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
import { FactList, type Fact } from '@/components/ui/FactList'
import DNAHelix from '@/components/canvas/DNAHelix'
import { CERTIFICATIONS } from '@/lib/constants'
import { CURRENT_ROLE, EDUCATION, PREVIOUS_ROLES, monthYear, roleTitle, shortTitle, yearRange } from '@/lib/site-facts'
import { LIVE_CLIENT_WORK } from '@/lib/work'
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
      note: `${CURRENT_ROLE.company} · since ${monthYear(CURRENT_ROLE.start)}`,
    },
    {
      term: 'Before',
      value: [shortTitle(LAST_ROLE), LAST_ROLE.team].filter(Boolean).join(', '),
      note: yearRange(LAST_ROLE),
    },
    {
      term: 'Certified',
      value: `${CERT_COUNT} Salesforce certifications`,
      note: certSpan(),
    },
    {
      term: 'Degree',
      value: DEGREE.degree,
      note: `${DEGREE.short} · ${yearRange(DEGREE)}`,
    },
    {
      term: 'Shipped',
      value: `${LIVE_CLIENT_WORK.length} live sites & apps · ${APPS_LIVE} on the App Store`,
      note: ratingNote(appStore),
    },
  ]

  return (
    <div data-reveal className="mb-8 md:mb-12">
      <FactList layout="grid" items={items} />
    </div>
  )
}

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

      <RecordRow />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {CERTIFICATIONS.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>
    </SectionShell>
  )
}
