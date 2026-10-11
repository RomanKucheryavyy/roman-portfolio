import { BUILD_SHA, blobUrlOf, commitUrlOf, sha7 } from '@/lib/build-info'
import { STUDY_BLOCKS, workOf, type CaseStudy, type Source } from '@/lib/case-studies'
import { SITE } from '@/lib/constants'
import { keyOf, nextKeyOf, type SpectrumKey } from '@/lib/score'
import { CLIENT_WORK, PRODUCTS, actionOf, domainOf, type Work } from '@/lib/work'
import type { AppStoreFacts } from '@/lib/app-store'
import type { Fact } from '@/components/ui/FactList'

/**
 * Everything the program-notes page derives from a study, kept out of the JSX
 * so the page, its OG card and its structured data read the same answers.
 */

/** The piece a study is about. A study without one cannot render, so the build stops. */
export function workFor(study: CaseStudy): Work {
  const work = workOf(study)
  if (!work) throw new Error(`program notes: "${study.slug}" names no piece of work`)
  return work
}

/** The work's place in its own collection, for WorkCard's "03 / 09" counter. */
export function positionOf(work: Work): { index: number; total: number } {
  const list = work.kind === 'client' ? CLIENT_WORK : PRODUCTS
  const index = list.findIndex((w) => w.id === work.id)
  return index === -1 ? { index: 0, total: 1 } : { index, total: list.length }
}

/** Client work is heard in the Symphony, products in the Compositions. */
export function keysOf(work: Work): readonly [SpectrumKey, SpectrumKey] {
  const movement = work.kind === 'client' ? 'symphony' : 'compositions'
  return [keyOf(movement), nextKeyOf(movement)]
}

/** "FUBC Coffee iOS" → lead "FUBC Coffee", accent "iOS". A one-word title is all accent. */
export function splitTitle(title: string): { lead?: string; accent: string } {
  const cut = title.lastIndexOf(' ')
  return cut === -1 ? { accent: title } : { lead: title.slice(0, cut), accent: title.slice(cut + 1) }
}

/**
 * The header facts. Only what the work data states: there is no Role row,
 * because nothing in the repo says what Roman's role on a piece was.
 */
export function factsOf(work: Work): Fact[] {
  const action = actionOf(work)
  const facts: Fact[] = [
    {
      term: 'Status',
      value: work.status ?? (work.url ? 'Live' : action.label),
      note: 'href' in action ? action.label : undefined,
    },
  ]
  if (work.stack?.length) facts.push({ term: 'Stack', value: work.stack.join(' · ') })
  if (work.year) facts.push({ term: 'Shipped', value: String(work.year) })
  return facts
}

/** The App Store page of the site's one app: where an `app-store` source points. */
export const APP_STORE_URL: string | null = CLIENT_WORK.find((w) => w.isApp)?.url ?? null

/** "2026-10-10" or an ISO time → "Oct 10, 2026", read in UTC so the build machine's zone can't move it. */
export function dayOf(value: string): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** One numbered source, ready to render: a link (when there is one) and the words around it. */
export interface CitedSource {
  href?: string
  label: string
  detail?: string
}

const linesOf = (lines?: number | [number, number]) =>
  lines === undefined ? '' : Array.isArray(lines) ? `, lines ${lines[0]}–${lines[1]}` : `, line ${lines}`

export function citeOf(source: Source, facts: AppStoreFacts): CitedSource {
  switch (source.kind) {
    case 'repo':
      return {
        href: blobUrlOf(source.path, source.lines, source.ref),
        label: source.path,
        // The same ref blobUrlOf() links: the cited commit, else this build's, else main.
        detail: `${linesOf(source.lines).slice(2) || 'the file'}, at ${source.ref ? source.ref.slice(0, 7) : BUILD_SHA ? sha7() : 'main'}`,
      }
    case 'commit':
      return { href: commitUrlOf(source.sha), label: `commit ${source.sha.slice(0, 7)}` }
    case 'app-store':
      return {
        href: APP_STORE_URL ?? undefined,
        label: 'App Store listing',
        detail: `field ${source.field}${facts.checkedAt ? `, checked ${dayOf(facts.checkedAt)}` : ''}`,
      }
    case 'live-site':
      return { href: source.url, label: domainOf(source.url), detail: `checked ${dayOf(source.checked)}` }
    case 'roman':
      return { label: source.date ? `Confirmed by Roman, ${dayOf(source.date)}` : 'Confirmed by Roman' }
  }
}

/**
 * The live App Store line under an outcome that cites the App Store:
 * "5.0 · 11 ratings · v1.1.4 · checked Oct 10, 2026". Nothing when the lookup
 * failed: a stale or invented rating is worse than none.
 */
export function liveRatingOf(study: CaseStudy, facts: AppStoreFacts): string | null {
  if (!study.outcome.some((claim) => claim.source.kind === 'app-store')) return null
  if (typeof facts.rating !== 'number' || typeof facts.count !== 'number') return null
  return [
    facts.rating.toFixed(1),
    `${facts.count} ${facts.count === 1 ? 'rating' : 'ratings'}`,
    facts.version ? `v${facts.version}` : null,
    facts.checkedAt ? `checked ${dayOf(facts.checkedAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * BreadcrumbList plus the piece itself, as one @graph. No rating and no
 * review anywhere: a self-published aggregateRating is what search engines
 * penalise, and the number is live on the page already.
 */
export function structuredDataOf(study: CaseStudy, work: Work): string {
  const pageUrl = `${SITE.url}/works/${study.slug}`
  const piece: Record<string, unknown> = {
    '@type': work.isApp ? 'MobileApplication' : 'CreativeWork',
    '@id': `${pageUrl}#work`,
    name: work.title,
    description: work.description,
    author: { '@type': 'Person', '@id': `${SITE.url}#person`, name: SITE.name, url: SITE.url },
    subjectOf: { '@type': 'WebPage', url: pageUrl, name: `Program notes: ${work.title}` },
  }
  if (work.url) piece.url = work.url
  if (work.isApp) piece.operatingSystem = 'iOS'
  if (work.year) piece.dateCreated = String(work.year)
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Works', item: `${SITE.url}/works` },
          { '@type': 'ListItem', position: 2, name: work.title, item: pageUrl },
        ],
      },
      piece,
    ],
  }
  // Escape "<" so no string in the data can close the <script> early.
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}

/**
 * The five blocks in reading order, each claim numbered: footnote n is
 * claimsOf(study)[n - 1], one source per claim.
 */
export function numberedBlocks(study: CaseStudy) {
  let n = 0
  return STUDY_BLOCKS.map((block) => ({
    ...block,
    claims: study[block.key].map((claim) => ({ ...claim, n: ++n })),
  }))
}
