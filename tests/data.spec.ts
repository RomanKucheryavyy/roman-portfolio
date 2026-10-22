import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CERTIFICATIONS, COMPOSITIONS, HIS_WORDS, PROJECTS as WORK, SITE, TECH_SKILLS } from '@/lib/constants'
import { LINKS } from '@/lib/links'
import * as content from '@/lib/content'
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
 * The data layer, tested in Node alone: no browser, no server. The last
 * block reads the build's output (run `npm run build` first, as the suite
 * already requires) for anything private.
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

test.describe('the Stage reads the records', () => {
  test('content.ts is built from constants, site-facts and links, not typed again', () => {
    expect(content.PROJECTS.map((p) => p.id)).toEqual(WORK.map((w) => w.id))
    for (const [i, p] of content.PROJECTS.entries()) expect(p).toEqual({ ...WORK[i] })
    expect(content.PRODUCTS).toEqual(COMPOSITIONS.map((c) => ({ ...c })))
    expect(content.CERTIFICATIONS).toBe(CERTIFICATIONS)
    expect(content.SKILLS).toBe(TECH_SKILLS)
    expect(content.PERSON).toMatchObject({
      name: SITE.name,
      first: 'Roman',
      last: 'Kucheryavyy',
      tagline: HIS_WORDS.tagline,
      manifesto: HIS_WORDS.manifesto,
      about: HIS_WORDS.about,
      links: LINKS,
    })
    expect(content.ROLES.map((r) => `${r.title} · ${r.company} · ${r.dates}`)).toEqual([
      'Senior Technical Support Engineer · Salesforce · Apr 2026 – Present',
      'Premier Technical Support Engineer · Salesforce · Nov 2023 – Apr 2026',
      'Technical Support Engineer · MindTree · May 2021 – Nov 2023',
    ])
    const source = readFileSync(path.join(LIB, 'content.ts'), 'utf8')
    expect(source, 'no description is typed into content.ts').not.toMatch(/Native Swift|licensed electrician|Platform Developer/)
  })

  test('linkLabel: the domain, "App Store", or the status of a piece with no link', () => {
    const label = (id: string) => content.linkLabel(content.PROJECTS.find((p) => p.id === id)!)
    expect(label('alongside-coffee')).toBe('alongsidecoffee.com')
    expect(label('fubc-coffee-ios')).toBe('App Store')
    expect(label('dtm-plumbing')).toBe('Launching soon')
  })
})

test.describe('owner-fixed copy', () => {
  // The same two descriptions scripts/check-protected.mjs guards in history.
  test('the FUBC Coffee iOS description keeps "Apple Pay", and the Nelectric description is word for word', () => {
    const description = (id: string) => WORK.find((w) => w.id === id)!.description
    expect(description('fubc-coffee-ios')).toContain('Apple Pay')
    expect(description('nelectric')).toBe(
      'A licensed electrician in three languages. English, Ukrainian, and Russian side by side, a 60-second quote form wired to a real lead pipeline, and a private dashboard that tells the owner which calls the site actually earned.',
    )
  })
})

test.describe('the résumé stays private', () => {
  /** Everything a visitor's browser can be sent: client chunks, prerendered pages and their payloads, public/. */
  function publicFiles(): string[] {
    const files: string[] = []
    const walk = (dir: string, skip: (rel: string) => boolean = () => false) => {
      if (!existsSync(dir)) return
      for (const entry of readdirSync(dir)) {
        const file = path.join(dir, entry)
        const rel = path.relative(ROOT, file)
        if (skip(rel)) continue
        if (statSync(file).isDirectory()) walk(file, skip)
        else files.push(file)
      }
    }
    walk(path.join(ROOT, '.next', 'static'))
    // The prerendered routes: their HTML, RSC payloads and bodies. Not the
    // server's own code (page.js, the API routes), which never leaves it.
    walk(path.join(ROOT, '.next', 'server', 'app'), (rel) => /[\\/]api([\\/]|$)|\.js(\.map)?$|\.nft\.json$/.test(rel))
    walk(path.join(ROOT, 'public'))
    return files
  }

  test('no public file carries the phone number, the support metrics or a résumé bullet', () => {
    const files = publicFiles()
    expect(files.length, 'the build has run').toBeGreaterThan(20)
    const secrets = [
      RESUME_DATA.phone,
      RESUME_DATA.phone.replace(/\D/g, ''),
      '802-6464',
      'CSAT',
      // With their words: the bare numbers turn up in the globe's map data.
      '1,214 cases',
      '4.9/5.0',
      '119% of productivity',
      RESUME_DATA.summary.slice(0, 60),
      ...RESUME_DATA.experience.flatMap((job) => job.bullets.map((b) => b.slice(0, 60))),
      ...RESUME_DATA.projects.flatMap((p) => p.bullets.map((b) => b.slice(0, 60))),
    ]
    const hits: string[] = []
    for (const file of files) {
      if (/\.(png|jpe?g|webp|avif|ico|woff2?|ttf)$/.test(file)) continue
      const text = readFileSync(file, 'utf8')
      for (const secret of secrets) if (text.includes(secret)) hits.push(`${path.relative(ROOT, file)}: ${secret.slice(0, 40)}`)
    }
    expect(hits).toEqual([])
  })
})
