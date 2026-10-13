import { expect, test } from '@playwright/test'
import { collectConsole, collectCspReports, gotoHome, wheelThrough } from './helpers'

/**
 * The floor: every public route answers, the home page survives a full scroll
 * without a console error, and the deck's detail view works from a keyboard.
 */

const OK_ROUTES: { path: string; type?: RegExp }[] = [
  { path: '/', type: /text\/html/ },
  { path: '/works', type: /text\/html/ },
  { path: '/resume', type: /text\/html/ },
  { path: '/robots.txt', type: /text\/plain/ },
  { path: '/sitemap.xml', type: /xml/ },
  { path: '/opengraph-image', type: /^image\/png/ },
  { path: '/humans.txt', type: /text\/plain/ },
]

test.describe('routes', () => {
  for (const { path, type } of OK_ROUTES) {
    test(`${path} answers 200`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      if (type) expect(res.headers()['content-type']).toMatch(type)
    })
  }

  test('an unknown path answers 404', async ({ request }) => {
    const res = await request.get('/does-not-exist')
    expect(res.status()).toBe(404)
  })
})

test.describe('console', () => {
  test('the home page scrolls end to end with no unexpected console output', async ({ page }) => {
    const log = collectConsole(page)
    await gotoHome(page)
    await wheelThrough(page)
    // Every section mounted and the page is still there.
    for (const id of ['measures', 'symphony', 'compositions', 'interlude', 'conductor', 'compose']) {
      await expect(page.locator(`#${id}`)).toBeAttached()
    }
    log.expectClean()
  })

  // What proves each page rendered. /works has no visible h1 on desktop yet
  // (the wheel's title is not a heading), so it waits on its <main>.
  const LANDMARK: Record<string, string> = { '/works': 'main', '/resume': 'h1' }
  for (const [path, landmark] of Object.entries(LANDMARK)) {
    test(`${path} loads with no unexpected console output`, async ({ page }) => {
      const log = collectConsole(page)
      await page.goto(path)
      await expect(page.locator(landmark).first()).toBeVisible()
      await page.waitForTimeout(1500)
      log.expectClean()
    })
  }

  test('the 404 loads with only its own 404 in the console', async ({ page }) => {
    // The browser reports the document's own 404 status as a failed resource.
    const log = collectConsole(page, [/Failed to load resource: the server responded with a status of 404/])
    const res = await page.goto('/does-not-exist')
    expect(res?.status()).toBe(404)
    await page.waitForTimeout(1000)
    log.expectClean()
  })
})

test.describe('content security policy (report-only)', () => {
  const CSP_ROUTES = ['/', '/works', '/colophon', '/resume', '/llms.txt', '/does-not-exist']

  test('every route sends the policy report-only, and nothing enforces one', async ({ request }) => {
    for (const path of CSP_ROUTES) {
      const headers = (await request.get(path)).headers()
      expect(headers['content-security-policy-report-only'], path).toContain("default-src 'self'")
      expect(headers['content-security-policy-report-only'], path).toContain("frame-ancestors 'none'")
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

  test('the home page, the ocean and the Spline phone: no report', async ({ page }) => {
    const project = test.info().project.name
    const csp = await collectCspReports(page)
    const spline = { requested: false, unreachable: '' }
    page.on('request', (req) => {
      if (/spline\.design/.test(req.url())) spline.requested = true
    })
    page.on('requestfailed', (req) => {
      if (/spline\.design/.test(req.url())) spline.unreachable = `${req.url()} (${req.failure()?.errorText ?? 'failed'})`
    })
    // The ocean renders under the hero from the first frame (its WebGL2 path
    // here; the static fallback in no-webgl). The scroll mounts every section.
    await gotoHome(page)
    await wheelThrough(page)
    if (project !== 'mobile') {
      // The Spline phone is the desktop deck's last card (the phone deck
      // never loads it, and with WebGL off it never downloads).
      await page.locator('#symphony').scrollIntoViewIfNeeded()
      await page.getByRole('button', { name: 'Previous piece' }).click()
      const card = page.locator('#symphony [data-work="fubc-coffee-ios"]')
      if (project === 'desktop') {
        await expect.poll(() => spline.requested, { timeout: 15_000 }).toBe(true)
        // A canvas means the runtime loaded and drew. If the host is out of
        // this runner's reach, the requests it did make were still checked
        // against the policy (the check comes before the network).
        if (!spline.unreachable) await expect(card.locator('canvas')).toBeAttached({ timeout: 20_000 })
        else test.info().annotations.push({ type: 'spline-unreachable', description: spline.unreachable })
      }
      // The runtime fetches its WebAssembly and starts its workers after the first frame.
      await page.waitForTimeout(4000)
    }
    expect(await csp.reports()).toEqual([])
  })

  for (const path of ['/works', '/colophon', '/resume', '/does-not-exist']) {
    test(`${path}: no report`, async ({ page }) => {
      const csp = await collectCspReports(page)
      await page.goto(path)
      await expect(page.locator('main#main')).toHaveCount(1)
      await page.waitForTimeout(1500)
      expect(await csp.reports()).toEqual([])
    })
  }
})

test.describe('detail view', () => {
  test('Enter opens the front card, Escape closes it and focus returns to the card', async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'The detail view is desktop-only by design: the phone card already shows everything.')
    const log = collectConsole(page)
    await gotoHome(page)
    await page.locator('#symphony').scrollIntoViewIfNeeded()

    const open = page.getByRole('button', { name: 'Open Alongside Coffee' })
    await expect(open).toBeVisible()
    // The detail view's code is fetched after mount, but the open index is
    // state: pressing Enter before the chunk arrives still opens it on arrival.
    await open.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Alongside Coffee' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
    log.expectClean()
  })
})
