import { CLIENT_WORK, PRODUCTS, type Work } from '@/lib/work'

/**
 * Program notes: the case studies behind /works/[slug].
 *
 * Every sentence on a published study is a Claim with a Source a stranger can
 * open. Anything only Roman can answer goes in `gaps`, never into the text,
 * and a study with gaps cannot be published: assertPublishable() fails the
 * build. Every study below is a draft (`published: false`), so no
 * /works/[slug] page exists until Roman fills its gaps.
 */

/** Where a claim can be checked. */
export type Source =
  /** A file in the public repo. `lines` are read at `ref` (a commit) when one is
   *  given, so the citation holds after the file changes; otherwise at the build. */
  | { kind: 'repo'; path: string; lines?: number | [number, number]; ref?: string }
  /** A public commit in RomanKucheryavyy/roman-portfolio. */
  | { kind: 'commit'; sha: string }
  /** A field of the live iTunes Lookup result for the app (see app-store.ts). */
  | { kind: 'app-store'; field: string }
  /** A public page, and the day it was last read. */
  | { kind: 'live-site'; url: string; checked: string }
  /** Roman's own word. Publishing needs `confirmed: true`. */
  | { kind: 'roman'; confirmed: boolean; date?: string }

export interface Claim {
  text: string
  source: Source
}

export interface CaseStudy {
  slug: Work['id']
  title: string
  published: boolean
  /** "YYYY-MM-DD": the last time the study's content changed (the sitemap's lastModified). */
  updated: string
  problem: Claim[]
  constraint: Claim[]
  decision: Claim[]
  outcome: Claim[]
  differently: Claim[]
  /** What only Roman can answer. Must be empty to publish. */
  gaps: string[]
}

/** The five blocks in reading order, with their rehearsal letters. */
export const STUDY_BLOCKS = [
  { key: 'problem', letter: 'A', heading: 'Problem' },
  { key: 'constraint', letter: 'B', heading: 'Constraint' },
  { key: 'decision', letter: 'C', heading: 'Decision' },
  { key: 'outcome', letter: 'D', heading: 'Outcome' },
  { key: 'differently', letter: 'E', heading: "What I'd do differently" },
] as const satisfies readonly { key: keyof CaseStudy; letter: string; heading: string }[]

// Card copy is cited at abb0023, where these lines were read.
const card = (lines: number | [number, number]): Source => ({ kind: 'repo', path: 'src/lib/constants.ts', lines, ref: 'abb0023' })
const site = (url: string): Source => ({ kind: 'live-site', url, checked: '2026-10-10' })
const app = (field: string): Source => ({ kind: 'app-store', field })

const ALL_WORK: readonly Work[] = [...CLIENT_WORK, ...PRODUCTS]

/** The piece a study is about. Throws on a slug that names no work, so a typo can't ship. */
function titleOf(slug: string): string {
  const work = ALL_WORK.find((w) => w.id === slug)
  if (!work) throw new Error(`case-studies: no work has the id "${slug}"`)
  return work.title
}

const DRAFTS: readonly CaseStudy[] = [
  {
    slug: 'fubc-coffee-ios',
    title: titleOf('fubc-coffee-ios'),
    published: false,
    updated: '2026-10-10',
    problem: [
      {
        text: "The official app for a church's Sunday coffee ministry: load a digital card, pre-order a drink before arriving, track it, and earn rewards.",
        source: app('description'),
      },
    ],
    constraint: [
      { text: 'Orders have to come in ahead of Sunday service.', source: app('description') },
      { text: 'Free to download.', source: app('price') },
      { text: 'For iPhone and iPad, on iOS 16 or later.', source: app('minimumOsVersion') },
    ],
    decision: [
      {
        text: 'Native Swift and SwiftUI, on Firebase and Supabase.',
        source: { kind: 'repo', path: 'src/lib/resume-data.ts', lines: 110, ref: 'abb0023' },
      },
      {
        text: 'If a drink sells out mid-order, the rest of the order still goes through.',
        source: app('releaseNotes'),
      },
      { text: "The card has an Apple Wallet pass, which can match the card's colour.", source: app('releaseNotes') },
    ],
    outcome: [
      { text: 'First released on the App Store on 12 March 2026.', source: app('releaseDate') },
      { text: "Published under Roman's own developer account.", source: app('sellerName') },
      // The rating itself is rendered live next to this claim, never typed here.
      { text: 'Rated on the App Store.', source: app('averageUserRating') },
    ],
    differently: [],
    gaps: [
      'The pain before the app: queues, cash, volunteers.',
      'Why native Swift rather than wrapping the web platform.',
      'What Firebase and Supabase each own.',
      'How a sold-out drink is handled so the rest of the order survives.',
      'Downloads, weekly orders or active cards, from App Store Connect.',
      'Whether fubccoffee.com is the same system as the app.',
      'Whether to name the church.',
      "One line on what he'd do differently.",
    ],
  },
  {
    slug: 'sembly',
    title: titleOf('sembly'),
    published: false,
    updated: '2026-10-10',
    problem: [
      { text: 'Volunteers on a worship team need the answer to one question: am I playing this Sunday?', source: card(134) },
      { text: 'It is built for small worship teams.', source: site('https://sembly.app') },
    ],
    constraint: [
      { text: 'A PWA, on the phone in their pocket.', source: card(135) },
      { text: 'No app store and no fee: joining takes an email and a team code.', source: site('https://sembly.app') },
      { text: 'The plan opened last still shows with no signal.', source: site('https://sembly.app') },
      { text: 'A volunteer must only ever see the services they are on.', source: card(134) },
    ],
    decision: [
      { text: 'Row-level security in Postgres is the actual boundary.', source: card(134) },
      {
        text: 'Two deliberate openings in it: a stand-in gets a link without an account, and a guest gets a read-only plan.',
        source: site('https://sembly.app'),
      },
    ],
    outcome: [{ text: 'Live at sembly.app.', source: site('https://sembly.app') }],
    differently: [
      {
        text: "It says plainly what it can't do yet: no play-along audio, no live view during the service, no CCLI reports, and, on purpose, no chat.",
        source: site('https://sembly.app'),
      },
    ],
    gaps: [
      'Teams, volunteers or services planned, with an as-of date.',
      'How row-level security scopes stand-in and guest links (a signed token? an expiry?).',
      'Which private repo it is.',
      'sembly.app does not name its maker: confirm Roman claims it publicly.',
      "One line on what he'd do differently.",
    ],
  },
  {
    slug: 'alongside-events',
    title: titleOf('alongside-events'),
    published: false,
    updated: '2026-10-10',
    problem: [
      { text: 'Guests at a mobile espresso bar order by scanning a QR code right at the cart.', source: card(154) },
    ],
    constraint: [{ text: 'It has to work at real weddings.', source: card(154) }],
    decision: [
      { text: 'Labels print over the network to thermal printers, through a dedicated print server.', source: card([154, 155]) },
      { text: 'Each event gets an automated recap afterwards.', source: card(154) },
    ],
    outcome: [{ text: 'It runs the family cart.', source: card(152) }],
    differently: [],
    gaps: [
      'The failure it replaced: paper tickets, misheard names?',
      'Venue network conditions, and any offline behaviour (the brief\'s "offline tolerance" has no source).',
      'The printer model and the network layout.',
      'Why a print server rather than printing from the browser.',
      'Single-cart tool or multi-tenant SaaS: the July résumé, the later card copy and the private repo describe it differently.',
      'Events run, orders served, labels printed, anonymised.',
      'How it relates to Alongside Coffee, which is filed as client work.',
      "One line on what he'd do differently.",
    ],
  },
]

/**
 * A study that exercises every part of the page, for the e2e fixture job only.
 * On when CASE_STUDY_FIXTURE=1; a production deploy refuses to build with it.
 */
export const FIXTURE_WORK: Work = {
  id: 'fixture-not-real',
  kind: 'product',
  title: 'FIXTURE — not real',
  tagline: 'A test fixture',
  description: 'A fixture for the program-notes page. It is not a real piece of work.',
  color: '#888888',
  tags: ['Fixture'],
}

const FIXTURE: CaseStudy = {
  slug: FIXTURE_WORK.id,
  title: FIXTURE_WORK.title,
  published: true,
  updated: '2026-10-10',
  problem: [{ text: 'Fixture problem, cited to a file.', source: { kind: 'repo', path: 'src/lib/case-studies.ts', lines: [1, 12] } }],
  constraint: [{ text: 'Fixture constraint, cited to a commit.', source: { kind: 'commit', sha: 'abb0023' } }],
  decision: [{ text: 'Fixture decision, cited to a live page.', source: site('https://romankucheryavyy.com') }],
  outcome: [{ text: 'Fixture outcome, cited to the App Store.', source: app('averageUserRating') }],
  differently: [{ text: 'Fixture reflection, confirmed by its author.', source: { kind: 'roman', confirmed: true, date: '2026-10-10' } }],
  gaps: [],
}

function fixtureOn(): boolean {
  return process.env.CASE_STUDY_FIXTURE === '1'
}

/** Every study, drafts included, plus the fixture when it is on. */
export function allStudies(): readonly CaseStudy[] {
  if (!fixtureOn()) return DRAFTS
  if (process.env.CONTEXT === 'production') {
    throw new Error('CASE_STUDY_FIXTURE=1 in a production build: the fixture study must never ship.')
  }
  return [...DRAFTS, FIXTURE]
}

export function publishedStudies(): readonly CaseStudy[] {
  return allStudies().filter((s) => s.published)
}

export function studyOf(slug: string): CaseStudy | undefined {
  return allStudies().find((s) => s.slug === slug)
}

/** The piece a study is about: a real work, or the fixture's stand-in. */
export function workOf(study: CaseStudy): Work | undefined {
  return study.slug === FIXTURE_WORK.id ? FIXTURE_WORK : ALL_WORK.find((w) => w.id === study.slug)
}

/** "/works/<id>" for a piece with published program notes; otherwise nothing to link. */
export function notesHrefOf(id: string): string | undefined {
  return publishedStudies().some((s) => s.slug === id) ? `/works/${id}` : undefined
}

/**
 * Every published piece's notes link, by work id: all a client component needs
 * to know. The home page computes it on the server and passes it down, so the
 * drafts, their open questions and the fixture never reach a visitor's JS.
 */
export function notesHrefs(): Readonly<Record<string, string>> {
  return Object.fromEntries(publishedStudies().map((s) => [s.slug, `/works/${s.slug}`]))
}

/** Every claim in reading order, so footnote n is claims[n - 1]. */
export function claimsOf(study: CaseStudy): Claim[] {
  return STUDY_BLOCKS.flatMap(({ key }) => study[key])
}

/**
 * Throws, naming the slug and every reason, unless the study may go public: an
 * outcome to report, no open gaps, and nothing resting on an unconfirmed word.
 */
export function assertPublishable(study: CaseStudy): void {
  const problems: string[] = []
  if (study.outcome.length === 0) problems.push('the outcome is empty')
  for (const gap of study.gaps) problems.push(`open gap: ${gap}`)
  for (const claim of claimsOf(study)) {
    if (claim.source.kind === 'roman' && !claim.source.confirmed) {
      problems.push(`unconfirmed by Roman: "${claim.text}"`)
    }
  }
  if (problems.length) {
    throw new Error(`Case study "${study.slug}" cannot be published:\n  - ${problems.join('\n  - ')}`)
  }
}
