import { expect, test } from '@playwright/test'
import { SECTION_IDS, collectConsole, collectCspReports, gotoHome, project, scrollThrough } from './helpers'

/**
 * The floor: every route answers, the retired ones redirect to the right
 * place, the home page survives a full scroll with nothing in the console and
 * nothing the Content-Security-Policy would block, and the server HTML says
 * what it should. Runs in all three projects; the no-WebGL project is the
 * machine with no WebGL at all.
 */

const OK_ROUTES: { path: string; type: RegExp }[] = [
  { path: '/', type: /text\/html/ },
  { path: '/resume', type: /text\/html/ },
  { path: '/robots.txt', type: /text\/plain/ },
  { path: '/sitemap.xml', type: /xml/ },
  { path: '/manifest.webmanifest', type: /manifest\+json|json/ },
  { path: '/llms.txt', type: /text\/markdown/ },
  { path: '/humans.txt', type: /text\/plain/ },
  { path: '/opengraph-image', type: /^image\/png/ },
  { path: '/twitter-image', type: /^image\/png/ },
  { path: '/apple-icon', type: /^image\/png/ },
  { path: '/icon.svg', type: /^image\/svg\+xml/ },
  // The globe's map, served from this origin (connect-src 'self').
  { path: '/countries-110m.json', type: /json/ },
]

/** Old addresses and where they land now (next.config.ts REDIRECTS). */
const REDIRECTS: [string, string][] = [
  ['/credentials', '/#credentials'],
  ['/work', '/#work'],
  ['/products', '/#products'],
  ['/about', '/#about'],
  ['/contact', '/#contact'],
  ['/works', '/#work'],
  ['/works/fubc-coffee-ios', '/#work'],
  ['/colophon', '/'],
]

test.describe('routes', () => {
  for (const { path, type } of OK_ROUTES) {
    test(`${path} answers 200`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toMatch(type)
    })
  }

  test('an unknown path, and every retired API, answers 404', async ({ request }) => {
    for (const path of ['/does-not-exist', '/api/contributions', '/api/app-store']) {
      expect((await request.get(path)).status(), path).toBe(404)
    }
  })

  test('old addresses redirect, temporarily, to the Stage', async ({ request }) => {
    for (const [from, to] of REDIRECTS) {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status(), from).toBe(307)
      expect(new URL(res.headers().location, 'http://x').pathname + new URL(res.headers().location, 'http://x').hash, from).toBe(to)
    }
  })

  test('every redirect lands on a section that exists', async ({ page }) => {
    await page.goto('/')
    for (const [, to] of REDIRECTS) {
      const id = to.split('#')[1]
      if (id) await expect(page.locator(`section#${id}`), to).toHaveCount(1)
    }
  })
})

test.describe('the home page', () => {
  test('scrolls end to end with no unexpected console output', async ({ page }) => {
    const log = collectConsole(page)
    await gotoHome(page)
    await scrollThrough(page)
    for (const id of SECTION_IDS) await expect(page.locator(`section#${id} h2#${id}-title`)).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    log.expectClean()
  })

  test('reads in full: every section heading, its cards and the footer are drawn', async ({ page }) => {
    // In the no-webgl project this is the machine with no WebGL: the curtain
    // and the footer's glass are WebGL, and the page must read without them.
    await gotoHome(page)
    await scrollThrough(page)
    await expect(page.locator('#hero-title')).toHaveText(/Roman\s*Kucheryavyy/)
    await expect(page.locator('#work h3')).toHaveCount(9)
    await expect(page.locator('#products h3')).toHaveCount(4)
    await expect(page.getByRole('group', { name: 'Salesforce certifications' })).toBeAttached()
    await expect(page.locator('#contact form')).toBeVisible()
    await expect(page.locator('footer')).toContainText('Roman Kucheryavyy')
    if (project() === 'no-webgl') {
      const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'))
      expect(webgl, 'this project really has no WebGL').toBe(false)
    }
  })

  test('no request leaves this origin', async ({ page, baseURL }) => {
    const outside: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (!url.startsWith(baseURL!) && !/^(data|blob):/.test(url)) outside.push(url)
    })
    await gotoHome(page)
    await scrollThrough(page)
    expect(outside).toEqual([])
  })

  test('/#contact lands on its heading and stays there while the page loads', async ({ page }) => {
    await page.goto('/#contact')
    await expect(page.locator('#contact form')).toBeAttached({ timeout: 30_000 })
    await page.waitForTimeout(1500)
    const top = await page.locator('#contact').evaluate((el) => el.getBoundingClientRect().top)
    // scroll-mt-14: the section sits 56px down, under the top bar.
    expect(Math.abs(top - 56), `#contact top is ${top}`).toBeLessThanOrEqual(2)
  })
})

test.describe('other pages', () => {
  test('/resume loads with no unexpected console output', async ({ page }) => {
    const log = collectConsole(page)
    await page.goto('/resume')
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForTimeout(1000)
    log.expectClean()
  })

  test('the 404 is the Stage\'s, with a way home, and only its own 404 in the console', async ({ page }) => {
    // The browser reports the document's own 404 status as a failed resource.
    const log = collectConsole(page, [/Failed to load resource: the server responded with a status of 404/])
    const res = await page.goto('/does-not-exist')
    expect(res?.status()).toBe(404)
    await expect(page.locator('main#main h1')).toHaveText('This page is not on the programme.')
    await expect(page.getByRole('alert').filter({ hasText: 'Nothing is written for this address.' })).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Back to the home page' })).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '/#work')
    await expect(page.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/#contact')
    // The Stage's ground (imperial.ts), not Next's white.
    expect(await page.locator('main#main').evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor)).toBe('rgb(7, 5, 15)')
    log.expectClean()
  })
})

test.describe('content security policy (report-only)', () => {
  const CSP_ROUTES = ['/', '/resume', '/llms.txt', '/does-not-exist']

  test('every route sends the policy report-only, and nothing enforces one', async ({ request }) => {
    for (const path of CSP_ROUTES) {
      const headers = (await request.get(path)).headers()
      const csp = headers['content-security-policy-report-only']
      expect(csp, path).toContain("default-src 'self'")
      expect(csp, path).toContain("frame-ancestors 'none'")
      expect(csp, path).toContain("connect-src 'self';")
      // What only the Spline phone needed is gone.
      expect(csp, path).not.toMatch(/unsafe-eval|spline|unpkg|worker-src|blob:/)
      expect(headers['content-security-policy'], path).toBeUndefined()
      expect(headers['x-content-type-options'], path).toBe('nosniff')
    }
  })

  test('reports have somewhere to go, and the endpoint takes either format', async ({ request }) => {
    const headers = (await request.get('/')).headers()
    expect(headers['content-security-policy-report-only']).toContain('report-uri /api/csp-report')
    expect(headers['content-security-policy-report-only']).toContain('report-to csp')
    expect(headers['reporting-endpoints']).toBe('csp="/api/csp-report"')
    const legacy = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: JSON.stringify({ 'csp-report': { 'violated-directive': 'img-src', 'blocked-uri': 'https://example.com/x.png', 'document-uri': '/' } }),
    })
    expect(legacy.status()).toBe(204)
    const modern = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/reports+json' },
      data: JSON.stringify([{ type: 'csp-violation', body: { effectiveDirective: 'img-src', blockedURL: 'https://example.com/x.png', documentURL: '/' } }]),
    })
    expect(modern.status()).toBe(204)
    expect((await request.post('/api/csp-report', { data: 'not json' })).status()).toBe(204)
  })

  test('the home page, scrolled end to end: no report', async ({ page }) => {
    const csp = await collectCspReports(page)
    await gotoHome(page)
    await scrollThrough(page)
    // The globe's map and the shaders arrive after the first frame.
    await page.waitForTimeout(1500)
    expect(await csp.reports()).toEqual([])
  })

  for (const path of ['/resume', '/does-not-exist']) {
    test(`${path}: no report`, async ({ page }) => {
      const csp = await collectCspReports(page)
      await page.goto(path)
      await expect(page.locator('main#main')).toHaveCount(1)
      await page.waitForTimeout(1500)
      expect(await csp.reports()).toEqual([])
    })
  }
})

test.describe('server HTML', () => {
  test('/ has one main, one JSON-LD graph (a Person, no job title, no ratings) and its own canonical', async ({ request }) => {
    const html = await (await request.get('/')).text()
    expect(html.match(/<main\b[^>]*id="main"/g)).toHaveLength(1)
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    expect(blocks).toHaveLength(1)
    const graph = JSON.parse(blocks[0][1])['@graph'] as Record<string, unknown>[]
    const person = graph.find((n) => n['@type'] === 'Person')!
    expect(person.name).toBe('Roman Kucheryavyy')
    expect(person).not.toHaveProperty('jobTitle')
    expect(blocks[0][1]).not.toMatch(/aggregateRating|ratingValue/)
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/romankucheryavyy\.com"\/>/)
    expect(html).toContain('<title>Roman Kucheryavyy — Salesforce engineer &amp; full-stack builder</title>')
  })

  test('/ carries a <noscript> summary of the whole page', async ({ request }) => {
    const html = await (await request.get('/')).text()
    const summary = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? ''
    for (const text of ['At a glance', 'Client work', 'My own products', 'Experience', 'Salesforce certifications', 'In my own words']) {
      expect(summary, text).toContain(text)
    }
    expect(summary).toContain('Alongside Coffee')
    expect(summary).toContain('Platform Developer I')
    expect(summary).toContain('mailto:kucheryavyyroman@gmail.com')
  })

  test('the share card is named with its size, type and his tagline', async ({ request }) => {
    const html = await (await request.get('/')).text()
    expect(html).toMatch(/<meta property="og:image:width" content="1200"\/>/)
    expect(html).toMatch(/<meta property="og:image:height" content="630"\/>/)
    expect(html).toContain(
      '<meta property="og:image:alt" content="Roman Kucheryavyy: Salesforce engineer by day. Full-stack builder by nature. Conductor by calling."/>',
    )
    expect(html).not.toContain('Orchestrating Logic')
  })

  test('the sitemap, robots.txt and llms.txt name only live routes', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])).toEqual(['https://romankucheryavyy.com'])
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain('Sitemap: https://romankucheryavyy.com/sitemap.xml')
    const llms = await (await request.get('/llms.txt')).text()
    expect(llms).toMatch(/^# Roman Kucheryavyy\n/)
    expect(llms).not.toMatch(/\/works|\/colophon|Program notes/)
    expect(llms).not.toMatch(/\(\d{3}\)\s*\d{3}-\d{4}/)
    for (const heading of ['## Client work', '## My own products', '## Experience', '## Certifications', '## Links']) expect(llms).toContain(heading)
  })
})
