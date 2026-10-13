import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { CERTIFICATIONS, SITE } from '@/lib/constants'
import { FIXTURE_WORK } from '@/lib/case-studies'
import { RESUME_PUBLIC } from '@/lib/routes'
import { CLIENT_WORK, PRODUCTS } from '@/lib/work'
import { gotoHome, waitForChrome } from './helpers'

/**
 * The proof and head routes (W8): program notes, the liner notes, llms.txt,
 * the sitemap and robots, the share cards, the icons and manifest, and the 404.
 *
 * Tests tagged @fixture need a build with CASE_STUDY_FIXTURE=1 (CI's
 * e2e-fixture job) and skip otherwise; the rest assume the default build,
 * where every case study is a draft. Set APP_STORE_ID_OVERRIDE=0 for both the
 * build and the run to exercise the failed App Store lookup.
 *
 * Mostly server HTML (request.get, or a page with JavaScript off): these
 * routes have to say what they say before any script runs.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const FIXTURE = process.env.CASE_STUDY_FIXTURE === '1'
const FIXTURE_PATH = `/works/${FIXTURE_WORK.id}`

/** The page's server HTML as text. */
async function html(request: APIRequestContext, url: string) {
  const res = await request.get(url)
  return { res, text: await res.text() }
}

const count = (text: string, re: RegExp) => text.match(new RegExp(re.source, 'g'))?.length ?? 0

/** Width and height from a PNG's IHDR chunk. */
function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

async function noSeriousAxe(page: Page) {
  await waitForChrome(page)
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
  expect(serious, 'serious or critical axe violations').toEqual([])
}

test.describe('program notes', () => {
  test('an unknown slug and an unpublished draft are both 404', async ({ request }) => {
    expect((await request.get('/works/not-a-slug')).status()).toBe(404)
    expect((await request.get('/works/fubc-coffee-ios')).status()).toBe(404)
  })

  test('an unknown or draft slug has no share card either: a 404, not a 500', async ({ request }) => {
    for (const slug of ['not-a-slug', 'fubc-coffee-ios']) {
      for (const card of ['opengraph-image', 'twitter-image']) {
        const url = `/works/${slug}/${card}`
        expect((await request.get(url)).status(), url).toBe(404)
      }
    }
  })

  test('no built client chunk carries a draft, its open questions or the fixture', () => {
    // The deck and the detail view only need to know which pieces have
    // published notes; the home page works that out on the server. These are
    // a draft's gap, a draft's claim and the fixture's marker.
    const needles = /Whether to name the church|First released on the App Store on|FIXTURE — not real|must never ship/
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(file)
        else if (needles.test(readFileSync(file, 'utf8'))) hits.push(path.relative(ROOT, file))
      }
    }
    walk(path.join(ROOT, '.next', 'static'))
    expect(hits).toEqual([])
  })

  test('the default sitemap lists no program notes', async ({ request }) => {
    test.skip(FIXTURE, 'the fixture build publishes one')
    const { text } = await html(request, '/sitemap.xml')
    const works = [...text.matchAll(/<loc>[^<]*\/works(\/[^<]*)?<\/loc>/g)]
    expect(works.map((m) => m[1] ?? '')).toEqual([''])
  })
})

test.describe('program notes @fixture', () => {
  test.skip(!FIXTURE, 'needs a build with CASE_STUDY_FIXTURE=1')
  test.use({ javaScriptEnabled: false })

  test('@fixture the page says everything in its server HTML', async ({ page, request }) => {
    expect((await request.get(FIXTURE_PATH)).status()).toBe(200)
    await page.goto(FIXTURE_PATH)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(FIXTURE_WORK.title)
    // The boxed rehearsal letter is aria-hidden, so each heading's name is the word alone.
    for (const name of ['Problem', 'Constraint', 'Decision', 'Outcome', "What I'd do differently"]) {
      await expect(page.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(1)
    }
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'works' })
    await expect(crumb).toHaveAttribute('href', '/works')

    // One footnote per claim, one numbered source per footnote, and every link lands.
    const marks = page.locator('sup a[href^="#src-"]')
    const sources = page.locator('ol > li[id^="src-"]')
    const n = await marks.count()
    expect(n).toBeGreaterThan(0)
    expect(await sources.count()).toBe(n)
    for (const href of await marks.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
      await expect(page.locator(href!)).toHaveCount(1)
    }
  })

  test('@fixture its structured data parses, with a breadcrumb and no rating', async ({ request }) => {
    const { text } = await html(request, FIXTURE_PATH)
    const blocks = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
    const graph = blocks.flatMap((b) => b['@graph'] ?? [b])
    const crumbs = graph.find((node) => node['@type'] === 'BreadcrumbList')
    expect(crumbs.itemListElement.map((i: { item: string }) => i.item)).toEqual([
      `${SITE.url}/works`,
      `${SITE.url}${FIXTURE_PATH}`,
    ])
    expect(text).not.toMatch(/aggregateRating|reviewCount|ratingValue/)
  })

  test('@fixture a failed App Store lookup leaves no rating in the outcome', async ({ page }) => {
    test.skip(process.env.APP_STORE_ID_OVERRIDE !== '0', 'needs APP_STORE_ID_OVERRIDE=0 at build and run')
    await page.goto(FIXTURE_PATH)
    const outcome = page.locator('section[aria-labelledby="block-outcome"]')
    await expect(outcome).toBeVisible()
    await expect(outcome).not.toContainText('5.0')
    await expect(outcome).not.toContainText('ratings')
  })

  test('@fixture it has its own card, sitemap entry and llms.txt line', async ({ request }) => {
    const { text } = await html(request, FIXTURE_PATH)
    expect(text).toContain(`<link rel="canonical" href="${SITE.url}${FIXTURE_PATH}"/>`)
    expect(text).toMatch(new RegExp(`<meta property="og:image" content="[^"]*${FIXTURE_PATH}/opengraph-image`))
    const card = await request.get(`${FIXTURE_PATH}/opengraph-image`)
    expect(card.headers()['content-type']).toMatch(/^image\/png/)
    expect(pngSize(await card.body())).toEqual({ width: 1200, height: 630 })

    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toMatch(new RegExp(`<loc>${SITE.url}${FIXTURE_PATH}</loc>\\s*<lastmod>`))
    expect(await (await request.get('/llms.txt')).text()).toContain(`${SITE.url}${FIXTURE_PATH}`)
  })
})

test.describe('program notes, hydrated @fixture', () => {
  test.skip(!FIXTURE, 'needs a build with CASE_STUDY_FIXTURE=1')

  test('@fixture no serious or critical axe violations', async ({ page }) => {
    await page.goto(FIXTURE_PATH)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await noSeriousAxe(page)
  })
})

test.describe('404', () => {
  test('one title, one noindex, no canonical', async ({ request }) => {
    const { res, text } = await html(request, '/does-not-exist')
    expect(res.status()).toBe(404)
    const head = text.slice(0, text.indexOf('</head>'))
    expect(count(head, /<title>/)).toBe(1)
    expect(head).toContain('<title>Not found — Roman Kucheryavyy</title>')
    const robots = head.match(/<meta name="robots" content="[^"]*"/g) ?? []
    expect(robots).toEqual(['<meta name="robots" content="noindex"'])
    expect(head).not.toContain('rel="canonical"')
    // Its own share text, not the home page's, and no og:url calling it the home page.
    expect(head).toContain('<meta property="og:title" content="Not found — Roman Kucheryavyy"/>')
    expect(head).toContain('<meta name="twitter:title" content="Not found — Roman Kucheryavyy"/>')
    expect(head).toMatch(/<meta name="description" content="Nothing is written for this address\./)
    expect(head).not.toContain('property="og:url"')
  })

  test('black even under a light colour scheme, with a heading, an alert and three ways out', async ({ browser, request }) => {
    const context = await browser.newContext({ colorScheme: 'light' })
    const page = await context.newPage()
    await page.goto('/does-not-exist')
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(0, 0, 0)')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tacet.')
    const main = page.locator('main#main')
    // Scoped to main: Next's route announcer is a role=alert of its own.
    await expect(main.getByRole('alert')).toHaveText(
      'Nothing is written for this address. The page moved, or the link has a typo.',
    )
    for (const [name, href] of [
      ['Back to the top', '/'],
      ['The setlist', '/works'],
      ['Let’s compose', '/#compose'],
    ]) {
      const link = main.getByRole('link', { name })
      await expect(link).toHaveAttribute('href', href)
      expect((await request.get(href, { maxRedirects: 0 })).status()).toBeLessThan(400)
    }
    await context.close()
  })
})

test.describe('llms.txt', () => {
  test('says what the cards say, as markdown, with no phone number', async ({ request }) => {
    const res = await request.get('/llms.txt')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toMatch(/^text\/markdown/)
    const text = await res.text()
    expect(text.startsWith(`# ${SITE.name}\n\n> ${SITE.description}`)).toBe(true)
    for (const work of [...CLIENT_WORK, ...PRODUCTS]) expect(text).toContain(work.title)
    for (const cert of CERTIFICATIONS) expect(text).toContain(`${cert.name} (${cert.date})`)
    expect(text).not.toMatch(/802-6464|\(\d{3}\)\s?\d{3}-\d{4}|\+1\s?\d{3}/)
  })
})

test.describe('sitemap and robots', () => {
  test('the sitemap lists the real routes, with no build-time dates', async ({ request }) => {
    const text = await (await request.get('/sitemap.xml')).text()
    expect(text).toContain(`<loc>${SITE.url}/works</loc>`)
    expect(text).toContain(`<loc>${SITE.url}/colophon</loc>`)
    if (!RESUME_PUBLIC) expect(text).not.toContain('/resume')
    // Only program notes carry a lastmod, and it is a study's own day, never a timestamp.
    for (const [, lastmod] of text.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('robots.txt keeps crawlers out of /api and lets them read the résumé noindex', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text()
    expect(text).toMatch(/^Disallow: \/api\/$/m)
    if (!RESUME_PUBLIC) expect(text).not.toMatch(/^Disallow: \/resume/m)
    expect(text).toContain(`Sitemap: ${SITE.url}/sitemap.xml`)
  })
})

test.describe('icons, manifest and share cards', () => {
  test('every route links a static icon', async ({ request }) => {
    const icon = await request.get('/icon.svg')
    expect(icon.status()).toBe(200)
    expect(icon.headers()['content-type']).toMatch(/^image\/svg\+xml/)
    for (const route of ['/', '/works', '/resume', '/colophon', '/does-not-exist']) {
      const { text } = await html(request, route)
      expect(text, route).toMatch(/<link rel="icon" href="\/icon\.svg[^"]*"/)
      expect(text, route).toMatch(/<link rel="apple-touch-icon" href="\/apple-icon[^"]*"/)
      expect(text, route).toContain('<link rel="manifest" href="/manifest.webmanifest"')
    }
  })

  test('the manifest has icons, and each one is served', async ({ request }) => {
    const manifest = await (await request.get('/manifest.webmanifest')).json()
    expect(manifest).toMatchObject({ id: '/', start_url: '/', short_name: 'RK.', name: SITE.name })
    expect(manifest.icons.length).toBeGreaterThan(0)
    for (const { src } of manifest.icons) expect((await request.get(src)).status(), src).toBe(200)
    expect((await request.get('/manifest.json')).status()).toBe(404)
  })

  test('the apple icon is a 180x180 PNG', async ({ request }) => {
    const res = await request.get('/apple-icon')
    expect(res.headers()['content-type']).toMatch(/^image\/png/)
    expect(pngSize(await res.body())).toEqual({ width: 180, height: 180 })
  })

  test('every page names its card with its size, type and alt', async ({ request }) => {
    for (const route of ['/', '/colophon', '/resume', '/works', '/does-not-exist']) {
      const { text } = await html(request, route)
      expect(text, route).toMatch(/<meta property="og:image" content="[^"]*\/opengraph-image/)
      expect(text, route).toContain('<meta property="og:image:width" content="1200"/>')
      expect(text, route).toContain('<meta property="og:image:height" content="630"/>')
      expect(text, route).toContain('<meta property="og:image:type" content="image/png"/>')
      expect(text, route).toMatch(/<meta property="og:image:alt" content="[^"]+"/)
      expect(text, route).toMatch(/<meta name="twitter:image" content="[^"]*\/twitter-image/)
    }
  })

  test('the home and /works cards are 1200x630 PNGs, and /works points at its own', async ({ request }) => {
    for (const card of ['/opengraph-image', '/works/opengraph-image', '/works/twitter-image']) {
      const res = await request.get(card)
      expect(res.headers()['content-type'], card).toMatch(/^image\/png/)
      expect(pngSize(await res.body()), card).toEqual({ width: 1200, height: 630 })
    }
    const { text } = await html(request, '/works')
    expect(text).toMatch(/<meta property="og:image" content="[^"]*\/works\/opengraph-image/)
    expect(text).toMatch(/<meta name="twitter:image" content="[^"]*\/works\/twitter-image/)
  })
})

test.describe('colophon', () => {
  test('states this build and the budgets exactly, and no performance score', async ({ page }) => {
    const res = await page.goto('/colophon')
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Liner notes')

    /** The value beside a FactList term. The term is escaped: a route like /works/[slug] is not a pattern. */
    const valueOf = (term: string) =>
      page
        .locator('dt', { hasText: new RegExp(`^${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
        .locator('xpath=following-sibling::dd[1]')

    // next.config.ts copies Netlify's COMMIT_REF into the build; anywhere else it is unset.
    const sha = process.env.COMMIT_REF ?? ''
    await expect(valueOf('Commit')).toHaveText(sha ? sha.slice(0, 7) : 'local build')

    const budget = JSON.parse(readFileSync(path.join(ROOT, 'scripts/budget.json'), 'utf8'))
    // The 404 route is listed under a plain name, with its key as the note.
    const LABEL: Record<string, string> = { '/_not-found': '404 page' }
    for (const [route, bytes] of Object.entries<number>(budget.routes)) {
      await expect(valueOf(LABEL[route] ?? route)).toContainText(`${bytes.toLocaleString('en-US')} B`)
    }
    await expect(valueOf('any other route')).toHaveText(`${budget.defaultRouteBudget.toLocaleString('en-US')} B`)

    expect(await page.locator('body').innerText()).not.toMatch(/lighthouse/i)
  })

  test('every engineering note cites a commit that exists', () => {
    const source = readFileSync(path.join(ROOT, 'src/app/colophon/page.tsx'), 'utf8')
    const notes = source.slice(source.indexOf('const NOTES'), source.indexOf('// ── Facts'))
    const shas = [...notes.matchAll(/'([0-9a-f]{7,40})'/g)].map((m) => m[1])
    expect(shas.length).toBeGreaterThan(0)
    for (const sha of shas) {
      // Needs full history (CI checks out with fetch-depth: 0). Throws if missing.
      execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: ROOT, stdio: 'pipe' })
    }
  })

  test('no serious or critical axe violations', async ({ page }) => {
    await page.goto('/colophon')
    await noSeriousAxe(page)
  })

  test("sits on the home page's column (one SectionShell)", async ({ page }) => {
    const column = (selector: string) =>
      page.locator(selector).evaluate((section) => {
        const s = getComputedStyle(section)
        const inner = section.firstElementChild as HTMLElement
        return { left: s.paddingLeft, right: s.paddingRight, max: getComputedStyle(inner).maxWidth, x: inner.getBoundingClientRect().x }
      })
    await page.goto('/colophon')
    const colophon = await column('main#main > section')
    await gotoHome(page)
    expect(colophon).toEqual(await column('#measures'))
  })

  test("its header is a movement's header: the same kicker, heading and intro type (one HeaderFrame)", async ({ page }) => {
    // The page's h1 and a movement's h2 are both HeaderFrame (SectionShell.tsx).
    // Before W12 the pages outside home copied its class strings, and only the
    // column above was checked; this checks the type itself.
    const type = (header: string) =>
      page.locator(header).evaluate((el) => {
        const pick = (node: Element | null) => {
          if (!node) return null
          const s = getComputedStyle(node)
          return {
            family: s.fontFamily,
            size: s.fontSize,
            weight: s.fontWeight,
            tracking: s.letterSpacing,
            transform: s.textTransform,
            color: s.color,
            gap: [s.marginTop, s.marginBottom],
          }
        }
        return {
          header: getComputedStyle(el).marginBottom,
          kicker: pick(el.querySelector(':scope > p.section-label')),
          heading: pick(el.querySelector(':scope > h1, :scope > h2')),
          intro: pick(el.querySelector(':scope > p:not(.section-label)')),
        }
      })
    await page.goto('/colophon')
    const colophon = await type('main#main > section > div > header')
    await gotoHome(page)
    const measures = await type('#measures > div > header')
    expect(colophon.kicker).not.toBeNull()
    expect(colophon.intro).not.toBeNull()
    expect(colophon).toEqual(measures)
  })
})

test('humans.txt describes the ocean the site ships', () => {
  const text = readFileSync(path.join(ROOT, 'public/humans.txt'), 'utf8')
  expect(text).not.toMatch(/terrain/i)
  expect(text).toContain('FFT ocean')
})
