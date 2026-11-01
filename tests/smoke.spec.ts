import { expect, test } from '@playwright/test'
import { RANK } from '@/lib/content'
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
    // In the no-webgl project this is the machine with no WebGL: the
    // footer's glass is WebGL, and the page must read without it.
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

  test('the hero is the Roman print: no curtain, no stage light, the name, his words and the two ways in', async ({ page }) => {
    await gotoHome(page)
    const hero = page.locator('#top')
    // The curtain is gone: nothing in the hero draws on a canvas, before the painting or after.
    const canvases = () => hero.locator('canvas').evaluateAll((all) => all.filter((c) => c.getBoundingClientRect().width > 0 && getComputedStyle(c).display !== 'none').length)
    expect(await canvases(), 'canvases drawn in the hero').toBe(0)
    await expect(page.locator('#hero-title')).toHaveText(/^Roman\s+Kucheryavyy$/)
    await expect(page.locator('#top h1')).toHaveCount(1)
    await expect(hero.locator('[data-hero-copy] p')).toHaveText('Salesforce engineer by day. Full-stack builder by nature. Conductor by calling.')
    await expect(hero.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '#work')
    await expect(hero.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '#contact')
    if (project() !== 'no-webgl') {
      await expect(page.locator('[data-hero-painting] [data-shown="true"] .om-fig img')).toBeAttached({ timeout: 30_000 })
      expect(await canvases(), 'canvases drawn in the hero once the painting is in').toBe(0)
      // No light of any kind: the component's shafts and dust, its spotlight and its flash are all off.
      for (const part of ['.om-light', '.om-spot', '.om-flash']) await expect(page.locator(`[data-hero-painting] ${part}`)).toBeHidden()
    }
  })

  test('the hero painting is decoration that lands after the name: hidden, inert, nothing to focus, Hercules, the name the largest paint', async ({ page }) => {
    await page.addInitScript(() => {
      const seen: string[] = []
      ;(window as unknown as { __lcp: string[] }).__lcp = seen
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const el = (entry as PerformanceEntry & { element?: Element | null }).element
          seen.push(el?.closest('#hero-title') ? 'name' : (el?.tagName.toLowerCase() ?? 'gone'))
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    const statues: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/images/cast/')) statues.push(new URL(req.url()).pathname)
    })
    await gotoHome(page)
    const painting = page.locator('[data-hero-painting]')
    await expect(painting).toHaveAttribute('aria-hidden', 'true')
    await expect(painting).toHaveAttribute('inert', '')
    if (project() === 'no-webgl') {
      // Without WebGL the painting never comes: a machine drawing every
      // frame in software keeps its frames for the page.
      await page.waitForTimeout(3000)
      await expect(painting.locator('*')).toHaveCount(0)
      expect(statues, 'photographs fetched without WebGL').toEqual([])
    } else {
      // It mounts (after the page) and fades in: Hercules, standing in the
      // intro's print with the blurred David behind, as the intro has him.
      await expect(painting.locator('[data-shown="true"] .om-fig img')).toHaveAttribute('src', '/images/cast/hercules.webp', { timeout: 30_000 })
      await expect(painting.locator('.om-fig')).toHaveCount(1)
      await expect(painting.locator('.om-backdrop')).toHaveAttribute('src', '/images/cast/david-backdrop.webp')
      // None of the component's own interface, loading or ornament shows, and nothing in it is reachable.
      for (const part of ['.om-chrome', '.om-wordlayer', '.om-ring', '.om-flood']) await expect(painting.locator(part)).toBeHidden()
      const focusable = await painting.evaluate((box) =>
        [...box.querySelectorAll<HTMLElement>('*')].filter((el) => {
          el.focus({ preventScroll: true })
          return document.activeElement === el
        }).length,
      )
      expect(focusable, 'elements in the painting that took focus').toBe(0)
      // Still: once he has risen, nothing in it moves (no light, no dust, no bob, no grain).
      await expect
        .poll(() => painting.evaluate((box) => box.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length), {
          message: 'animations running in the painting once it has landed',
          timeout: 15_000,
        })
        .toBe(0)
      await page.waitForTimeout(1000)
      expect(await painting.evaluate((box) => box.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length)).toBe(0)
    }
    const lcp = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp)
    expect(lcp.at(-1), `largest paints: ${lcp.join(', ')}`).toBe('name')
  })

  test('the name keeps AA where it meets the statue: the print behind its letters, without their halo, at 3:1 or more', async ({ page }) => {
    test.skip(project() === 'no-webgl', 'no painting without WebGL')
    await gotoHome(page)
    await expect(page.locator('[data-hero-painting] [data-shown="true"] .om-fig img')).toBeAttached({ timeout: 30_000 })
    // Landed and risen.
    await page.waitForTimeout(3500)
    for (const line of ['#hero-title > span:first-child', '#hero-title > span:last-child']) {
      const el = page.locator(line)
      const box = (await el.boundingBox())!
      const clip = { x: 0, y: Math.max(0, box.y), width: page.viewportSize()!.width, height: Math.min(box.height, page.viewportSize()!.height - box.y) }
      const ink = await el.evaluate((e) => getComputedStyle(e).color)
      // What stands behind the letters (the letters gone), and where the letters are (in magenta, no halo).
      await el.evaluate((e) => e.style.setProperty('color', 'transparent', 'important'))
      await el.evaluate((e) => e.style.setProperty('text-shadow', 'none', 'important'))
      const behind = (await page.screenshot({ clip })).toString('base64')
      await el.evaluate((e) => e.style.setProperty('color', '#ff00ff', 'important'))
      const glyphs = (await page.screenshot({ clip })).toString('base64')
      await el.evaluate((e) => e.removeAttribute('style'))
      const { ratio, count } = await page.evaluate(
        async ({ behind, glyphs, ink }) => {
          const read = async (b64: string) => {
            const img = new Image()
            img.src = `data:image/png;base64,${b64}`
            await img.decode()
            const c = document.createElement('canvas')
            c.width = img.width
            c.height = img.height
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            return ctx.getImageData(0, 0, c.width, c.height).data
          }
          const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
          const [bg, mg] = await Promise.all([read(behind), read(glyphs)])
          const under: number[] = []
          for (let i = 0; i < mg.length; i += 4) if (mg[i] > 200 && mg[i + 1] < 90 && mg[i + 2] > 200) under.push(lum(bg[i], bg[i + 1], bg[i + 2]))
          under.sort((a, b) => a - b)
          const worst = under[Math.floor(under.length * 0.95)]
          const [r, g, b] = ink.match(/\d+/g)!.map(Number)
          const text = lum(r, g, b)
          return { ratio: (Math.max(text, worst) + 0.05) / (Math.min(text, worst) + 0.05), count: under.length }
        },
        { behind, glyphs, ink },
      )
      expect(count, `${line}: letter pixels found`).toBeGreaterThan(200)
      expect(ratio, `${line}: the name's ink against the print behind its letters (95th percentile)`).toBeGreaterThanOrEqual(3)
    }
  })

  for (const [w, h] of [
    [390, 844],
    [375, 667],
    [1440, 900],
  ] as const) {
    test(`at ${w}x${h} the first screen holds the name, his words, both ways in and his head`, async ({ page }) => {
      test.skip((w < 768) !== (project() === 'mobile'), 'phone sizes on the phone, the desktop on the desktop')
      await page.setViewportSize({ width: w, height: h })
      await gotoHome(page)
      const bar = await page.locator('header').first().evaluate((el) => el.getBoundingClientRect().bottom)
      for (const sel of ['#hero-title > span:first-child', '#hero-title > span:last-child', '[data-hero-copy] p', '#top a[href="#work"]', '#top a[href="#contact"]']) {
        const r = (await page.locator(sel).boundingBox())!
        // A name line's box is wider than its letters by its tracking (the
        // space after its last letter, and the padding that balances it).
        const spacing = await page.locator(sel).evaluate((el) => parseFloat(getComputedStyle(el).letterSpacing) || 0)
        expect(r.y, `${sel} below the top bar`).toBeGreaterThanOrEqual(bar - 1)
        expect(r.y + r.height, `${sel} inside the first screen`).toBeLessThanOrEqual(h + 1)
        expect(r.x, `${sel} on screen`).toBeGreaterThanOrEqual(-1 - spacing)
        expect(r.x + r.width, `${sel} on screen`).toBeLessThanOrEqual(w + 1 + spacing)
      }
      // The two ways in on one row.
      const [see, touch] = await Promise.all(['#top a[href="#work"]', '#top a[href="#contact"]'].map(async (s) => (await page.locator(s).boundingBox())!))
      expect(Math.abs(see.y + see.height / 2 - (touch.y + touch.height / 2)), 'See the work and Get in touch on one row').toBeLessThan(4)
      expect(await page.evaluate(() => document.documentElement.scrollWidth), 'no sideways scroll').toBeLessThanOrEqual(w)
      if (project() === 'no-webgl') return
      // Hercules's head (the photograph's crown and chin, hero-painting-stage.tsx HEAD) inside the first screen, clear of his words above.
      await expect(page.locator('[data-hero-painting] [data-shown="true"] .om-fig img')).toBeAttached({ timeout: 30_000 })
      await page.waitForTimeout(3000)
      const head = await page.evaluate(() => {
        const fig = document.querySelector('[data-hero-painting] .om-fig')!.getBoundingClientRect()
        return { crown: fig.top + fig.height * 0.046, chin: fig.top + fig.height * 0.44 }
      })
      expect(head.crown, 'his crown below the top bar').toBeGreaterThan(bar)
      expect(head.chin, 'his chin inside the first screen').toBeLessThan(h)
      if (w < 768) expect(head.crown, 'his crown below the two ways in').toBeGreaterThan(see.y + see.height)
    })
  }

  test('the hero painting stays away for a browser that saves data', async ({ page }) => {
    test.skip(project() === 'no-webgl', 'never there without WebGL')
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g' }) })
    })
    const statues: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/images/cast/')) statues.push(new URL(req.url()).pathname)
    })
    await gotoHome(page)
    await expect(page.locator('#hero-title')).toBeVisible()
    await page.waitForTimeout(3000)
    await expect(page.locator('[data-hero-painting] *')).toHaveCount(0)
    expect(statues, 'photographs fetched for a browser that saves data').toEqual([])
  })

  test("the hero painting's code failing to load leaves the page as it is", async ({ page }) => {
    test.skip(project() === 'no-webgl', 'never asked for without WebGL')
    // The painting's chunk is the one that carries its rise (hero-painting-stage.tsx RISE_FROM); every other script loads.
    const aborted: string[] = []
    await page.route('**/_next/static/chunks/*.js', async (route) => {
      const res = await route.fetch()
      const body = await res.text()
      if (body.includes('om-tilt]:translate-y-[12%]')) {
        aborted.push(route.request().url())
        await route.abort()
      } else await route.fulfill({ response: res, body })
    })
    const log = collectConsole(page, [/ChunkLoadError|Failed to load chunk|net::ERR_FAILED|Failed to load resource/])
    await gotoHome(page)
    await expect.poll(() => aborted.length, { timeout: 30_000 }).toBeGreaterThan(0)
    await page.waitForTimeout(1500)
    await expect(page.locator('#hero-title')).toBeVisible()
    await expect(page.locator('#top a[href="#work"]')).toBeVisible()
    for (const id of SECTION_IDS) await expect(page.locator(`section#${id}`)).toBeAttached()
    await expect(page.locator('[data-hero-painting] *')).toHaveCount(0)
    log.expectClean()
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

/**
 * Every act header's entrance (section-header.tsx, reveal.ts): the numeral
 * alone as the chapter mark, then the kicker, the h2 and the intro, each
 * part held only while the header waits below the screen, played once as
 * it rises into view, then let go. Never for a header on screen as the page
 * starts, never under reduced motion, never the hero's h1.
 */
test.describe('act headers', () => {
  const PARTS = ['numeral', 'kicker', 'title', 'intro'] as const

  test('the chapter mark: the numeral alone on its line, gold Cinzel, then the kicker, then the h2; no rule beside it', async ({ page }) => {
    await gotoHome(page)
    const header = page.locator('#credentials-title').locator('xpath=..')
    const shape = await header.evaluate((box) => {
      const part = (name: string) => box.querySelector<HTMLElement>(`[data-reveal="${name}"]`)!
      // Layout boxes (offsets), so a part still held at its first frame reads where it stands.
      const at = (el: HTMLElement) => ({ top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight })
      const numeral = at(part('numeral'))
      const kicker = at(part('kicker'))
      const title = at(part('title'))
      const style = getComputedStyle(part('numeral'))
      return {
        firstLine: box.querySelector('p')!.textContent,
        alone: kicker.top >= numeral.bottom - 1 && title.top >= kicker.bottom - 1,
        size: parseFloat(style.fontSize),
        family: style.fontFamily,
        // Nothing drawn as a line: no element in the header a few px tall with a fill.
        lines: [...box.querySelectorAll('*')].filter((el) => {
          const r = el.getBoundingClientRect()
          return r.height > 0 && r.height <= 2 && r.width > 8 && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
        }).length,
      }
    })
    expect(shape.firstLine?.replace(/\s+/g, ' ').trim()).toBe('Act IV, Credentials')
    expect(shape.alone, 'numeral, kicker and title each on a line of their own').toBe(true)
    expect(shape.size).toBeGreaterThanOrEqual(project() === 'mobile' ? 60 : 108)
    expect(shape.family).toMatch(/Cinzel/i)
    expect(shape.lines, 'rules drawn in the header').toBe(0)
  })

  test('a header below the screen is held, rises into view once, and is let go whole', async ({ page }) => {
    await gotoHome(page)
    const header = page.locator('#experience-title').locator('xpath=..')
    const read = () =>
      header.evaluate((box, parts) => {
        const els = parts.map((p) => box.querySelector<HTMLElement>(`[data-reveal="${p}"]`)).filter((el): el is HTMLElement => !!el)
        return {
          opacity: els.map((el) => Number(getComputedStyle(el).opacity)),
          animations: els.flatMap((el) => el.getAnimations()).length,
        }
      }, PARTS as unknown as string[])
    // Held at its first frame while it waits below.
    await expect.poll(async () => (await read()).opacity[0]).toBe(0)
    await header.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    // Played, then let go: whole, with nothing left on it. (The observer's
    // word can take a few seconds on a machine drawing four WebGL pages in
    // software at once.)
    await expect
      .poll(async () => {
        const now = await read()
        return now.animations === 0 && now.opacity.length >= 3 && now.opacity.every((o) => o === 1)
      }, { timeout: 15_000 })
      .toBe(true)
    // The hero's name never takes part.
    expect(await page.locator('#hero-title').evaluate((h1) => [h1, ...h1.querySelectorAll('*')].flatMap((el) => el.getAnimations()).length)).toBe(0)
  })

  test('a header on screen as the page starts is never drawn below full', async ({ page }) => {
    await page.addInitScript(() => {
      const low = [1, 1, 1, 1]
      ;(window as unknown as { __low: number[] }).__low = low
      const start = performance.now()
      const look = () => {
        const box = document.getElementById('credentials-title')?.parentElement
        if (box) {
          const r = box.getBoundingClientRect()
          if (r.top < innerHeight && r.bottom > 0)
            ['numeral', 'kicker', 'title', 'intro'].forEach((name, i) => {
              const el = box.querySelector(`[data-reveal="${name}"]`)
              if (el) low[i] = Math.min(low[i], Number(getComputedStyle(el).opacity))
            })
        }
        if (performance.now() - start < 6000) requestAnimationFrame(look)
      }
      requestAnimationFrame(look)
    })
    await gotoHome(page, '/#credentials')
    await page.waitForTimeout(2000)
    expect(await page.evaluate(() => (window as unknown as { __low: number[] }).__low)).toEqual([1, 1, 1, 1])
  })

  test('under reduced motion every header stands whole, and nothing is held', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await page.waitForTimeout(1000)
    const held = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => Number(getComputedStyle(el).opacity) < 1 || el.getAnimations().length > 0).length,
    )
    expect(held).toBe(0)
  })

  test('printed, or saved as a PDF, the page is whole: no entrance still waiting below the screen leaves its part blank', async ({ page }) => {
    await gotoHome(page)
    await expect(page.locator('#contact form')).toBeAttached({ timeout: 30_000 })
    await expect(page.locator('[data-inscription]').first()).toBeAttached({ timeout: 30_000 })
    const held = () =>
      page.evaluate(() => [...document.querySelectorAll('main *')].filter((el) => el.getAnimations().some((a) => a.playState === 'paused') && Number(getComputedStyle(el).opacity) < 0.99).length)
    // At the top of the page the acts below are held at their first frame...
    await expect.poll(held).toBeGreaterThan(0)
    // ...and printing lets every one of them go, whole.
    await page.pdf({ path: test.info().outputPath('page.pdf') })
    expect(await held()).toBe(0)
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
    expect(await page.locator('main#main').evaluate((el) => getComputedStyle(el.parentElement!).backgroundColor)).toBe('rgb(11, 8, 6)')
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
    expect(person.award, 'his Trailhead rank, from the record').toBe(`${RANK.platform} ${RANK.name}`)
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
    expect(summary).toContain(RANK.name)
    expect(summary).toContain(RANK.standing)
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
    for (const heading of ['## Client work', '## My own products', '## Experience', `## ${RANK.platform}`, '## Certifications', '## Links']) expect(llms).toContain(heading)
    expect(llms).toContain(`- ${RANK.name}: ${RANK.standing}`)
  })
})
