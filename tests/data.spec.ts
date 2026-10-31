import { test, expect } from '@playwright/test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CERTIFICATIONS, COMPOSITIONS, HIS_WORDS, PROJECTS as WORK, SITE, TECH_SKILLS, TRAILHEAD_RANK } from '@/lib/constants'
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
import { siteGraph } from '@/lib/structured-data'
import { RESUME_HREF, RESUME_PUBLIC } from '@/lib/routes'
import { toRoman } from '@/lib/roman'
import { CAST } from '@/components/stage/cast'
import { INTRO_FIGURES } from '@/components/stage/intro-gate'

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
    expect(content.RANK).toEqual({ name: TRAILHEAD_RANK.rank, platform: TRAILHEAD_RANK.platform, standing: TRAILHEAD_RANK.standing })
    const source = readFileSync(path.join(LIB, 'content.ts'), 'utf8')
    expect(source, 'no description is typed into content.ts').not.toMatch(/Native Swift|licensed electrician|Platform Developer|Star Ranger|highest Ranger/)
  })

  test('linkLabel: the domain, "App Store", or the status of a piece with no link', () => {
    const label = (id: string) => content.linkLabel(content.PROJECTS.find((p) => p.id === id)!)
    expect(label('alongside-coffee')).toBe('alongsidecoffee.com')
    expect(label('fubc-coffee-ios')).toBe('App Store')
    expect(label('dtm-plumbing')).toBe('Launching soon')
  })
})

test.describe('his Trailhead rank', () => {
  // Roman, 2026-10-31: "also we should add somewhere that im not all star
  // ranger on trailhead, the highest ranger status" ("im not": "I'm now").
  test('the record holds it in his words, and nothing he did not give', () => {
    expect(TRAILHEAD_RANK).toEqual({ rank: 'All Star Ranger', platform: 'Trailhead', standing: 'The highest Ranger status' })
    // No date earned, badge count or profile link was given, so none is stated.
    expect(content.RANK).not.toHaveProperty('url')
    expect(Object.keys(TRAILHEAD_RANK).sort()).toEqual(['platform', 'rank', 'standing'])
  })

  test('its words are typed once, in constants.ts, and every place that shows it reads the record', () => {
    const typed = (dir: string): string[] =>
      readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter((f) => /\.(ts|tsx|txt)$/.test(f) && statSync(path.join(dir, f)).isFile())
        .filter((f) => /Star Ranger|highest Ranger/i.test(readFileSync(path.join(dir, f), 'utf8')))
        .map((f) => path.relative(ROOT, path.join(dir, f)))
    expect([...typed(path.join(ROOT, 'src')), ...typed(path.join(ROOT, 'public'))]).toEqual(['src/lib/constants.ts'])
    const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')
    // Act IV's honour, the summary without scripts and llms.txt.
    for (const use of ['{RANK.platform}', '{RANK.name}', '{RANK.standing}']) expect(read('src/components/stage/rank-honour.tsx'), use).toContain(use)
    for (const use of ['{RANK.platform}', '{RANK.name}', '{RANK.standing}']) expect(read('src/app/page.tsx'), use).toContain(use)
    for (const use of ['${RANK.platform}', '${RANK.name}', '${RANK.standing}']) expect(read('src/app/llms.txt/route.ts'), use).toContain(use)
    // Act IV renders the honour before the frieze.
    const credentials = read('src/components/stage/credentials.tsx')
    expect(credentials.indexOf('<RankHonour')).toBeGreaterThan(credentials.indexOf('<SectionHeader'))
    expect(credentials.indexOf('<RankHonour')).toBeLessThan(credentials.indexOf('{marquee}'))
  })

  test('the JSON-LD Person names it as an award, and stays a Person with no job title and no ratings', () => {
    const person = siteGraph()['@graph'].find((n) => n['@type'] === 'Person') as Record<string, unknown>
    expect(person.award).toBe(`${TRAILHEAD_RANK.platform} ${TRAILHEAD_RANK.rank}`)
    expect(person).not.toHaveProperty('jobTitle')
    expect(JSON.stringify(person)).not.toMatch(/aggregateRating|ratingValue/)
  })
})

test.describe('Roman numerals', () => {
  test('toRoman writes 1 to 3999, subtractive forms included, and a dot for nothing', () => {
    const cases: [number, string][] = [
      [0, '·'],
      [1, 'I'],
      [4, 'IV'],
      [8, 'VIII'],
      [9, 'IX'],
      [14, 'XIV'],
      [40, 'XL'],
      [49, 'XLIX'],
      [88, 'LXXXVIII'],
      [90, 'XC'],
      [99, 'XCIX'],
      [100, 'C'],
      [400, 'CD'],
      [944, 'CMXLIV'],
      [1994, 'MCMXCIV'],
      [2026, 'MMXXVI'],
      [3999, 'MMMCMXCIX'],
    ]
    for (const [n, roman] of cases) expect(toRoman(n), String(n)).toBe(roman)
    // Every value up to 3999 reads back to itself (a letter before a larger
    // one is subtracted), and no two share a numeral.
    const value: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
    const read = (r: string) => [...r].reduce((sum, c, i) => sum + (value[c] < (value[r[i + 1]] ?? 0) ? -value[c] : value[c]), 0)
    const seen = new Set<string>()
    for (let n = 1; n <= 3999; n++) {
      const roman = toRoman(n)
      expect(roman).toMatch(/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/)
      if (read(roman) !== n) expect(read(roman), roman).toBe(n)
      seen.add(roman)
    }
    expect(seen.size).toBe(3999)
    for (const bad of [-1, 1.5, 4000, Number.NaN]) expect(() => toRoman(bad), String(bad)).toThrow(RangeError)
  })
})

test.describe('the Roman intro and the title cards', () => {
  const STAGE = path.join(ROOT, 'src/components/stage')

  test('their words are the records\': his name, tagline, music, role and counts; each product\'s own', () => {
    const intro = readFileSync(path.join(STAGE, 'intro-stage.tsx'), 'utf8')
    for (const use of [
      'wordmark={PERSON.first}',
      'tagline={PERSON.tagline}',
      'text: PERSON.music',
      '`${ROLES[0].title}, ${ROLES[0].company}`',
      'toRoman(PROJECTS.length)',
      'toRoman(CERTIFICATIONS.length)',
      'eyebrow={`Prologue · ${year}`}',
      'toRoman(new Date().getFullYear())',
      'annotations={[]}',
    ])
      expect(intro, use).toContain(use)
    const card = readFileSync(path.join(STAGE, 'product-stage-card.tsx'), 'utf8')
    for (const use of ['wordmark={product.title}', 'tagline={product.tagline}', 'labels={[product.status,', 'asides={[]}', 'annotations={[]}', 'nav={[]}'])
      expect(card, use).toContain(use)
    // The records they read hold what the landing shows.
    expect(content.PERSON.first).toBe('Roman')
    expect(content.PERSON.tagline).toBe(HIS_WORDS.tagline)
    expect(toRoman(content.PROJECTS.length)).toMatch(/^[IVXLC]+$/)
  })

  test('the cast is served from this origin, each file present, its size as declared, and small', () => {
    for (const [id, photo] of Object.entries(CAST)) {
      expect(photo.src, id).toMatch(/^\/images\/cast\/[a-z-]+\.webp$/)
      const file = path.join(ROOT, 'public', photo.src)
      expect(existsSync(file), photo.src).toBe(true)
      expect(webpSize(file), photo.src).toEqual({ width: photo.width, height: photo.height })
      expect(statSync(file).size, `${photo.src} stays under 240 KB`).toBeLessThan(240 * 1024)
      expect(photo.credit.length, id).toBeGreaterThan(0)
    }
    // The backdrop is decoration; every figure is named.
    expect(CAST.david.alt).toBe('')
    for (const f of [...INTRO_FIGURES.wide, ...INTRO_FIGURES.tall]) expect(f.alt, f.src).toBeTruthy()
    // The marble figure holding flowers is gone (Roman: "can we remove the
    // girl tho cuz she looks naked"), and stays gone.
    expect(existsSync(path.join(ROOT, 'public/images/cast/flowers.webp'))).toBe(false)
    for (const photo of Object.values(CAST)) expect(photo.alt, photo.src).not.toMatch(/flowers/i)
    for (const f of [...INTRO_FIGURES.wide, ...INTRO_FIGURES.tall]) expect(f.src).not.toMatch(/flowers/)
    // humans.txt credits each photographer.
    const humans = readFileSync(path.join(ROOT, 'public', 'humans.txt'), 'utf8')
    for (const photo of Object.values(CAST)) expect(humans, photo.credit).toContain(photo.credit)
  })
})

/** A WebP file's width and height, from its header (lossy, lossless or extended). */
function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file)
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${file} is not a WebP`)
  const chunk = b.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) }
  throw new Error(`${file}: unknown WebP chunk ${chunk}`)
}

test.describe('his products', () => {
  test('in his order, Alongside Events first, linked to its public site', () => {
    expect(COMPOSITIONS.map((c) => c.id)).toEqual(['alongside-events', 'sembly', 'praxis', 'alongside-brain'])
    const events = content.PRODUCTS.find((p) => p.id === 'alongside-events')!
    expect(events.url).toBe('https://alongsideevents.com')
    // His tagline and status, unchanged by the link.
    expect(events.tagline).toBe('The tech stack behind the family coffee cart')
    expect(events.status).toBe('Runs the family cart')
  })

  test('the public ones have a preview, the private ones a flow, and none has both', () => {
    for (const product of content.PRODUCTS) {
      expect(!!product.preview, product.id).toBe(!!product.url)
      expect(!!product.flow, product.id).toBe(!product.url)
    }
  })

  test('each preview is a real, small WebP of the size the page declares', () => {
    for (const product of content.PRODUCTS) {
      if (!product.preview) continue
      expect(product.preview.captured).toMatch(/^20\d\d-\d\d$/)
      for (const shot of [product.preview.desktop, product.preview.phone]) {
        expect(shot.src).toMatch(new RegExp(`^/images/products/${product.id}-(desktop|phone)\\.webp$`))
        const file = path.join(ROOT, 'public', shot.src)
        expect(existsSync(file), shot.src).toBe(true)
        expect(webpSize(file), shot.src).toEqual({ width: shot.width, height: shot.height })
        expect(statSync(file).size, `${shot.src} stays well under 400 KB`).toBeLessThan(400 * 1024)
      }
      // The desktop shot is 1280 CSS px wide at 1x, the phone's 390 at 1.5x.
      expect(product.preview.desktop.width).toBe(1280)
      expect(product.preview.phone.width).toBe(585)
    }
  })

  test("a flow names only what the description names, in the description's words", () => {
    const words = (text: string) => text.toLowerCase().replace(/\s+/g, ' ')
    for (const product of content.PRODUCTS) {
      if (!product.flow) continue
      const description = words(product.description)
      // The centre: the product, under the description's opening line.
      expect(description.startsWith(words(product.flow.hub)), `${product.id}: hub "${product.flow.hub}"`).toBe(true)
      const ids = product.flow.nodes.map((n) => n.id)
      expect(ids, `${product.id}: a part named like the product`).not.toContain(product.id)
      for (const node of product.flow.nodes) {
        expect(description, `${product.id}: "${node.label}"`).toContain(words(node.label))
        expect(description, `${product.id}: "${node.note}"`).toContain(words(node.note))
      }
      for (const [from, to] of product.flow.links) {
        expect([...ids, product.id], `${product.id}: link ${from} -> ${to}`).toEqual(expect.arrayContaining([from, to]))
        expect(from, `${product.id}: a link from ${from} to itself`).not.toBe(to)
      }
      // Every part is wired in, and the centre too.
      for (const id of [...ids, product.id]) expect(product.flow.links.some((link) => link.includes(id)), `${product.id}: ${id}`).toBe(true)
    }
  })

  test("a flow's links are only the ones its description states", () => {
    // Each part to or from the product at the centre, and the one hand-off
    // between parts a description states (the Slack bot's captures, routed
    // by Claude). Which part feeds which beyond that is Roman's to say
    // (`needs Roman` in constants.ts): a link added for it is added here too.
    expect(Object.fromEntries(content.PRODUCTS.filter((p) => p.flow).map((p) => [p.id, p.flow!.links.map(([a, b]) => `${a} -> ${b}`)]))).toEqual({
      praxis: ['personas -> praxis', 'discovery -> praxis', 'manager -> praxis', 'praxis -> alpaca'],
      'alongside-brain': ['slack -> claude', 'claude -> alongside-brain', 'alongside-brain -> digests'],
    })
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
