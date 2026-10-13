import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CERTIFICATIONS } from '@/lib/constants'
import { RESUME_DATA } from '@/lib/resume-data'
import {
  CURRENT_ROLE,
  PREVIOUS_ROLES,
  TIMELINE,
  monthYear,
  resumeDates,
  roleTitle,
  shortRole,
  yearRange,
} from '@/lib/site-facts'
import {
  allStudies,
  assertPublishable,
  claimsOf,
  notesHrefOf,
  publishedStudies,
  type CaseStudy,
} from '@/lib/case-studies'
import { getAppStoreFacts, siteAppStoreId } from '@/lib/app-store'
import { CLIENT_WORK, LIVE_CLIENT_WORK, appStoreIdOf } from '@/lib/work'
import { SITE_CARD, pageMetadata } from '@/lib/seo'
import { RESUME_HREF, RESUME_PDF_HREF, RESUME_PUBLIC, RESUME_REQUEST, sectionHref } from '@/lib/routes'
import { blobUrlOf, commitUrlOf, sha7 } from '@/lib/build-info'
import { GET as getAppStoreRoute } from '@/app/api/app-store/route'
import { GET as getContributions } from '@/app/api/contributions/route'

/**
 * The data layer, tested in Node alone: no browser, no server. Live fetches are
 * stubbed on globalThis, so these never touch Apple or GitHub.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const LIB = path.join(ROOT, 'src/lib')
const FACT_KEYS = ['checkedAt', 'count', 'firstRelease', 'rating', 'updated', 'version']

const realFetch = globalThis.fetch
test.afterEach(() => {
  globalThis.fetch = realFetch
})

function stubFetch(impl: (url: string) => Promise<Response>): string[] {
  const calls: string[] = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input)
    calls.push(url)
    return impl(url)
  }) as typeof fetch
  return calls
}

/** Runs fn with env vars set (undefined deletes), then puts them back. */
async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T | Promise<T>): Promise<T> {
  const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]))
  const apply = (v: Record<string, string | undefined>) => {
    for (const [k, value] of Object.entries(v)) {
      if (value === undefined) delete process.env[k]
      else process.env[k] = value
    }
  }
  apply(vars)
  try {
    return await fn()
  } finally {
    apply(saved)
  }
}

test.describe('facts', () => {
  test('the résumé builds its roles and certifications from the shared data, unchanged', () => {
    const [current, gov, mindtree] = RESUME_DATA.experience
    expect(current.title).toBe(roleTitle(CURRENT_ROLE, ' — '))
    expect(current.dates).toBe(resumeDates(CURRENT_ROLE))

    // Today's strings, exactly.
    expect(current).toMatchObject({
      company: 'Salesforce',
      title: 'Senior Technical Support Engineer — Signature Success',
      dates: 'April 2026 – Present',
    })
    expect(gov).toMatchObject({
      company: 'Salesforce',
      title: 'Premier Technical Support Engineer — Government Cloud',
      dates: 'November 2023 – April 2026',
    })
    expect(mindtree).toMatchObject({
      company: 'MindTree (supporting Microsoft service partners)',
      title: 'Technical Support Engineer',
      dates: 'May 2021 – November 2023',
    })
    expect(RESUME_DATA.education.map((e) => e.dates)).toEqual(['2018 – 2020', '2016 – 2018'])

    expect(RESUME_DATA.certifications).toEqual(CERTIFICATIONS.map(({ name, date }) => ({ name, date })))
  })

  test('the certification names are typed once in src/lib', () => {
    const total = readdirSync(LIB)
      .filter((f) => f.endsWith('.ts'))
      .reduce((n, f) => n + (readFileSync(path.join(LIB, f), 'utf8').match(/Platform Developer I/g)?.length ?? 0), 0)
    expect(total).toBe(1)
  })

  test('site-facts holds no contact details, grade averages or metrics', () => {
    const source = readFileSync(path.join(LIB, 'site-facts.ts'), 'utf8')
    expect(source).not.toMatch(/@|\(\d{3}\)|\d{3}-\d{4}|GPA|1,214|CSAT/)
  })

  test('site-facts derives its labels and the timeline', () => {
    expect(shortRole(CURRENT_ROLE)).toBe('Sr. TSE, Salesforce Signature Success')
    expect(roleTitle(CURRENT_ROLE)).toBe('Senior Technical Support Engineer, Signature Success')
    expect(yearRange(PREVIOUS_ROLES[0])).toBe('2023–2026')
    expect(yearRange(CURRENT_ROLE)).toBe('since 2026')
    expect(monthYear(CURRENT_ROLE.start)).toBe('Apr 2026')
    expect(TIMELINE.map((t) => `${t.year} ${t.label}`)).toEqual([
      '2016 Highline',
      '2018 UW Tacoma',
      '2021 MindTree · Microsoft partners',
      '2023 Salesforce Government Cloud',
      '2026 Signature Success',
    ])
    expect(TIMELINE.filter((t) => t.current).map((t) => t.label)).toEqual(['Signature Success'])
  })
})

test.describe('case studies', () => {
  const good: CaseStudy = {
    slug: 'test-study',
    title: 'Test',
    published: true,
    updated: '2026-10-10',
    problem: [],
    constraint: [],
    decision: [],
    outcome: [{ text: 'An outcome.', source: { kind: 'commit', sha: 'abb0023' } }],
    differently: [{ text: 'A reflection.', source: { kind: 'roman', confirmed: true, date: '2026-10-10' } }],
    gaps: [],
  }

  test('assertPublishable accepts a complete study and names each reason it refuses one', () => {
    expect(() => assertPublishable(good)).not.toThrow()
    expect(() => assertPublishable({ ...good, outcome: [] })).toThrow(/"test-study".*\n.*the outcome is empty/)
    expect(() => assertPublishable({ ...good, gaps: ['How many teams use it.'] })).toThrow(
      /"test-study"[\s\S]*open gap: How many teams use it\./,
    )
    expect(() =>
      assertPublishable({
        ...good,
        differently: [{ text: 'Unchecked.', source: { kind: 'roman', confirmed: false } }],
      }),
    ).toThrow(/"test-study"[\s\S]*unconfirmed by Roman: "Unchecked\."/)
  })

  test('every draft is unpublished, cites real files, and would be refused', async () => {
    await withEnv({ CASE_STUDY_FIXTURE: undefined }, () => {
      expect(publishedStudies()).toHaveLength(0)
      expect(notesHrefOf('fubc-coffee-ios')).toBeUndefined()
      expect(allStudies().map((s) => s.slug)).toEqual(['fubc-coffee-ios', 'sembly', 'alongside-events'])
      for (const study of allStudies()) {
        expect(study.published).toBe(false)
        expect(() => assertPublishable(study)).toThrow(study.slug)
        for (const { source } of claimsOf(study)) {
          if (source.kind === 'repo') expect(existsSync(path.join(ROOT, source.path))).toBe(true)
          expect(source.kind).not.toBe('roman') // drafts hold no unconfirmed words, only gaps
        }
      }
    })
  })

  test('the fixture appears only when asked for, and never in production', async () => {
    await withEnv({ CASE_STUDY_FIXTURE: '1', CONTEXT: undefined }, () => {
      const published = publishedStudies()
      expect(published.map((s) => s.title)).toEqual(['FIXTURE — not real'])
      expect(() => assertPublishable(published[0])).not.toThrow()
      expect(notesHrefOf(published[0].slug)).toBe(`/works/${published[0].slug}`)
    })
    await withEnv({ CASE_STUDY_FIXTURE: '1', CONTEXT: 'production' }, () => {
      expect(() => publishedStudies()).toThrow(/production/)
    })
  })
})

test.describe('live data', () => {
  test('getAppStoreFacts gives all nulls when the lookup fails', async () => {
    stubFetch(() => Promise.reject(new TypeError('network down')))
    const facts = await getAppStoreFacts(siteAppStoreId())
    expect(Object.keys(facts).sort()).toEqual(FACT_KEYS)
    expect(Object.values(facts).every((v) => v === null)).toBe(true)
  })

  test('getAppStoreFacts reads rating, count and version from the lookup', async () => {
    const calls = stubFetch(async () =>
      Response.json({ results: [{ averageUserRating: 5, userRatingCount: 11, version: '1.1.4' }] }),
    )
    const facts = await getAppStoreFacts(siteAppStoreId())
    expect(facts).toMatchObject({ rating: 5, count: 11, version: '1.1.4', updated: null, firstRelease: null })
    expect(typeof facts.checkedAt).toBe('string')
    expect(calls).toEqual(['https://itunes.apple.com/lookup?id=6760352447&country=us'])
  })

  test('GET /api/app-store answers 200 with exactly the six fields, even on failure', async () => {
    stubFetch(async () => Response.json({ results: [{ averageUserRating: 5, userRatingCount: 11, version: '1.1.4' }] }))
    let res = await getAppStoreRoute()
    expect(res.status).toBe(200)
    expect(Object.keys(await res.json()).sort()).toEqual(FACT_KEYS)

    stubFetch(() => Promise.reject(new TypeError('network down')))
    res = await getAppStoreRoute()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Object.keys(body).sort()).toEqual(FACT_KEYS)
    expect(Object.values(body).every((v) => v === null)).toBe(true)
  })

  test('the contributions route rethrows at runtime and falls back only during the build', async () => {
    stubFetch(() => Promise.reject(new TypeError('network down')))
    await withEnv({ NEXT_PHASE: undefined }, async () => {
      await expect(getContributions()).rejects.toThrow('network down')
    })
    await withEnv({ NEXT_PHASE: 'phase-production-build' }, async () => {
      const res = await getContributions()
      expect(res.status).toBe(200)
      expect(await res.json()).toMatchObject({ weeks: [] })
    })
  })
})

test.describe('links and head', () => {
  test('pageMetadata gives each page its own canonical and one title everywhere', () => {
    const meta = pageMetadata({ path: '/works', title: 'The setlist' })
    expect(meta.alternates?.canonical).toBe('/works')
    expect(meta.title).toEqual({ absolute: 'The setlist — Roman Kucheryavyy' })
    expect(meta.openGraph?.title).toBe('The setlist — Roman Kucheryavyy')
    expect(meta.twitter?.title).toBe('The setlist — Roman Kucheryavyy')
    // The site card by default, named with its size, type and alt.
    expect(meta.openGraph?.images).toEqual([SITE_CARD])
    expect(meta.twitter?.images).toEqual([{ ...SITE_CARD, url: '/twitter-image' }])
    expect(pageMetadata({ path: '/', images: false }).openGraph).not.toHaveProperty('images')
  })

  test('routes keep the résumé private by default and link sections from anywhere', () => {
    expect(RESUME_PUBLIC).toBe(false)
    expect(RESUME_HREF).toBeNull()
    expect(RESUME_PDF_HREF).toBeNull()
    expect(RESUME_REQUEST).toBe('mailto:kucheryavyyroman@gmail.com?subject=R%C3%A9sum%C3%A9%20request')
    expect(sectionHref('compose', '/')).toBe('#compose')
    expect(sectionHref('compose', '/works')).toBe('/#compose')
  })

  test('work helpers: the live list and the App Store id come from the data', () => {
    expect(LIVE_CLIENT_WORK).toEqual(CLIENT_WORK.filter((w) => w.url))
    expect(LIVE_CLIENT_WORK.every((w) => w.url)).toBe(true)
    const app = CLIENT_WORK.find((w) => w.isApp)!
    expect(appStoreIdOf(app)).toBe('6760352447')
    expect(CLIENT_WORK.filter((w) => !w.isApp).map(appStoreIdOf).every((id) => id === null)).toBe(true)
    expect(CLIENT_WORK.some((w) => 'role' in w)).toBe(false)
  })

  test('build-info links commits and files in the public repo', () => {
    expect(sha7('abc1234def567')).toBe('abc1234')
    expect(commitUrlOf('abc1234def')).toBe('https://github.com/RomanKucheryavyy/roman-portfolio/commit/abc1234def')
    expect(blobUrlOf('src/lib/constants.ts', [134, 135], 'abb0023')).toBe(
      'https://github.com/RomanKucheryavyy/roman-portfolio/blob/abb0023/src/lib/constants.ts#L134-L135',
    )
  })
})
