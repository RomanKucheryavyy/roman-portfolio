import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
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
import { SITE_CARD, pageMetadata } from '@/lib/seo'
import { RESUME_HREF, RESUME_PUBLIC } from '@/lib/routes'

/**
 * The data layer, tested in Node alone: no browser, no server.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const LIB = path.join(ROOT, 'src/lib')
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

test.describe('links and head', () => {
  test('pageMetadata gives each page its own canonical and one title everywhere', () => {
    const meta = pageMetadata({ path: '/resume', title: 'Résumé builder' })
    expect(meta.alternates?.canonical).toBe('/resume')
    expect(meta.title).toEqual({ absolute: 'Résumé builder — Roman Kucheryavyy' })
    expect(meta.openGraph?.title).toBe('Résumé builder — Roman Kucheryavyy')
    expect(meta.twitter?.title).toBe('Résumé builder — Roman Kucheryavyy')
    // The site card by default, named with its size, type and alt.
    expect(meta.openGraph?.images).toEqual([SITE_CARD])
    expect(meta.twitter?.images).toEqual([{ ...SITE_CARD, url: '/twitter-image' }])
    expect(pageMetadata({ path: '/', images: false }).openGraph).not.toHaveProperty('images')
  })

  test('the résumé stays private by default', () => {
    expect(RESUME_PUBLIC).toBe(false)
    expect(RESUME_HREF).toBeNull()
  })
})
