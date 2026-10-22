/**
 * The public facts about Roman: where he works, what he did before, where he
 * studied. Every surface that states one of these reads it from here, so the
 * home page, the résumé and the structured data can no longer disagree (the
 * Conductor section still said "Gov Cloud" months after he moved team).
 *
 * This file is imported by client components, so it holds nothing private:
 * no phone number, no email address, no grade averages, no support metrics.
 * tests/data.spec.ts pattern-checks that.
 *
 * Each value names where it came from. Line numbers refer to
 * src/lib/resume-data.ts at commit abb0023, the last commit where these facts
 * were typed out there; resume-data.ts now builds its titles and dates from
 * this file instead.
 */

/** "2026-04": a year and a month, as Roman's résumé dates them. */
export type YearMonth = `${number}-${number}`

export interface Role {
  company: string
  title: string
  /** The team inside the company, when the title alone doesn't say it. */
  team?: string
  /** Who the work was for, when the employer was a contractor. */
  note?: string
  start: YearMonth
  /** Absent while it is the current role. */
  end?: YearMonth
  /** The entry's name on the About timeline. */
  short: string
}

export interface Education {
  school: string
  /** The entry's name on the About timeline and in tight spaces. */
  short: string
  degree: string
  start: number
  end: number
}

export const CURRENT_ROLE: Role = {
  company: 'Salesforce', // source: resume-data.ts:29
  title: 'Senior Technical Support Engineer', // source: resume-data.ts:31
  team: 'Signature Success', // source: resume-data.ts:31
  start: '2026-04', // source: resume-data.ts:32
  short: 'Signature Success', // source: resume-data.ts:31
}

/** Newest first. */
export const PREVIOUS_ROLES: readonly Role[] = [
  {
    company: 'Salesforce', // source: resume-data.ts:41
    title: 'Premier Technical Support Engineer', // source: resume-data.ts:43
    team: 'Government Cloud', // source: resume-data.ts:43
    start: '2023-11', // source: resume-data.ts:44
    end: '2026-04', // source: resume-data.ts:44
    short: 'Salesforce Government Cloud', // source: resume-data.ts:41, resume-data.ts:43
  },
  {
    company: 'MindTree', // source: resume-data.ts:52
    note: 'supporting Microsoft service partners', // source: resume-data.ts:52
    title: 'Technical Support Engineer', // source: resume-data.ts:54
    start: '2021-05', // source: resume-data.ts:55
    end: '2023-11', // source: resume-data.ts:55
    short: 'MindTree · Microsoft partners', // source: resume-data.ts:52
  },
]

/** Newest first. */
export const EDUCATION: readonly Education[] = [
  {
    school: 'University of Washington Tacoma', // source: resume-data.ts:74, resume-data.ts:75
    short: 'UW Tacoma', // source: resume-data.ts:74, resume-data.ts:75
    degree: 'BS Computer Science & Systems', // source: resume-data.ts:76
    start: 2018, // source: resume-data.ts:77
    end: 2020, // source: resume-data.ts:77
  },
  {
    school: 'Highline College', // source: resume-data.ts:81
    short: 'Highline', // source: resume-data.ts:81
    degree: 'AA Computer Science', // source: resume-data.ts:83
    start: 2016, // source: resume-data.ts:84
    end: 2018, // source: resume-data.ts:84
  },
]

/**
 * Per-credential verification links, keyed by the certification `id` in
 * constants.ts. Empty until Roman supplies his Trailblazer profile or the
 * credential URLs; a cert card shows "Verify" only for an id listed here.
 * needs Roman: the URLs.
 */
export const CERT_VERIFY: Readonly<Record<string, string>> = {}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function parts(ym: YearMonth): { year: number; month: number } {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

/** "2026-04" → 2026. */
export function yearOf(ym: YearMonth): number {
  return parts(ym).year
}

/** "2026-04" → "Apr 2026". `long` gives "April 2026", the résumé's form. */
export function monthYear(ym: YearMonth, { long = false } = {}): string {
  const { year, month } = parts(ym)
  const name = MONTHS[month - 1]
  return `${long ? name : name.slice(0, 3)} ${year}`
}

/**
 * The years an entry spans: "2023–2026", or "since 2026" while it is current.
 * Takes a role or an education entry.
 */
export function yearRange(entry: { start: YearMonth | number; end?: YearMonth | number }): string {
  const y = (v: YearMonth | number) => (typeof v === 'number' ? v : yearOf(v))
  return entry.end === undefined ? `since ${y(entry.start)}` : `${y(entry.start)}–${y(entry.end)}`
}

/** The résumé's date line: "April 2026 – Present", "November 2023 – April 2026". */
export function resumeDates(role: Role): string {
  const end = role.end ? monthYear(role.end, { long: true }) : 'Present'
  return `${monthYear(role.start, { long: true })} – ${end}`
}

/**
 * The full title with its team: "Senior Technical Support Engineer, Signature
 * Success". The résumé passes " — " as the separator.
 */
export function roleTitle(role: Role, separator = ', '): string {
  return role.team ? `${role.title}${separator}${role.team}` : role.title
}

/** "Senior Technical Support Engineer" → "Sr. TSE"; "Premier Technical…" → "Premier TSE". */
export function shortTitle(role: Role): string {
  return role.title.replace('Technical Support Engineer', 'TSE').replace(/^Senior /, 'Sr. ')
}

/** One line for tight spaces: "Sr. TSE, Salesforce Signature Success". */
export function shortRole(role: Role): string {
  return `${shortTitle(role)}, ${[role.company, role.team].filter(Boolean).join(' ')}`
}

export interface TimelineEntry {
  year: number
  /** "YYYY-MM" for roles; schools only have a year. */
  start: YearMonth | number
  label: string
  kind: 'school' | 'work'
  current: boolean
}

/**
 * Oldest first: 2016 Highline · 2018 UW Tacoma · 2021 MindTree · Microsoft
 * partners · 2023 Salesforce Government Cloud · 2026 Signature Success.
 * Nothing on it is typed twice: it is the entries above, sorted.
 */
export const TIMELINE: readonly TimelineEntry[] = [
  ...EDUCATION.map((e) => ({ year: e.start, start: e.start, label: e.short, kind: 'school' as const, current: false })),
  ...[CURRENT_ROLE, ...PREVIOUS_ROLES].map((r) => ({
    year: yearOf(r.start),
    start: r.start,
    label: r.short,
    kind: 'work' as const,
    current: r === CURRENT_ROLE,
  })),
].sort((a, b) => String(a.start).localeCompare(String(b.start)))
