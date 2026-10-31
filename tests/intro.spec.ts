import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { CERTIFICATIONS, PERSON, PROJECTS, ROLES } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { collectConsole, collectCspReports, project, sleep } from './helpers'

/**
 * The Roman intro (src/components/stage/intro.tsx): when it shows, what it
 * says, the ways out, and that it is a proper modal while it is up. Every
 * other spec starts as a browser that saw it a moment ago
 * (playwright.config.ts); this one starts from nothing, or loads `/?intro`.
 */

test.use({ storageState: { cookies: [], origins: [] } })

const LAYER = '[data-intro-layer]'
const year = toRoman(new Date().getFullYear())

/** Opens `path` and waits for the intro to be up. */
async function openIntro(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator(`${LAYER} .om-root[data-up="true"]`)).toBeAttached({ timeout: 20_000 })
  await expect(page.locator('html')).toHaveAttribute('data-intro', 'up')
}

const phase = (page: Page) => page.locator(`${LAYER} .om-root`).getAttribute('data-phase')

/** Waits for the intro to have lifted and checks the page is the page again. */
async function expectGone(page: Page) {
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  const inert = await page.evaluate(() => Array.from(document.body.children).filter((el) => el.hasAttribute('inert')).length)
  expect(inert, 'children of <body> left inert').toBe(0)
  await expect(page.locator('#hero-title')).toBeVisible()
}

/**
 * The page scrolls again: the document is no longer held still (a script's
 * scrollBy would move it even then), and the keyboard moves it.
 */
async function expectScrolls(page: Page) {
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden')
  const before = await page.evaluate(() => window.scrollY)
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before)
}

/** Swipes up from the middle of the screen with real touch events. */
async function swipeUp(context: BrowserContext, page: Page) {
  const { width, height } = page.viewportSize()!
  const x = Math.round(width / 2)
  const y = Math.round(height * 0.7)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 20 }] })
    await sleep(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

const fromRoman = (s: string) => {
  if (s === '·') return 0
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let n = 0
  for (let i = 0; i < s.length; i++) n += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]]
  return n
}

test.describe('when the intro shows', () => {
  test('a fresh visit opens on it, a modal over a hidden, inert page, and it is remembered', async ({ page }) => {
    await openIntro(page)
    const dialog = page.getByRole('dialog', { name: 'Intro' })
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    // The page beneath is laid out but not drawn, and out of reach.
    await expect(page.locator('#hero-title')).toBeHidden()
    expect(await page.evaluate(() => document.querySelector('main')!.closest('[inert]') !== null)).toBe(true)
    const seen = await page.evaluate(() => Number(localStorage.getItem('rk:intro')))
    expect(Date.now() - seen).toBeLessThan(60_000)

    // Within the next 12 hours the page opens straight on the Stage.
    await page.reload()
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('after 12 hours it shows again', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rk:intro', String(Date.now() - 12 * 60 * 60 * 1000 - 60_000)))
    await openIntro(page)
  })

  test('?intro shows it again inside the 12 hours', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rk:intro', String(Date.now())))
    await openIntro(page, '/?intro')
  })

  test('a deep link goes straight to its section', async ({ page }) => {
    await page.goto('/#contact')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('never under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?intro')
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})

test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false })
  test('there is no intro, only the page', async ({ page }) => {
    await page.goto('/?intro')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(page.locator('#hero-title')).toBeVisible()
  })
})

test.describe('what it says', () => {
  test('the count climbs in Roman numerals to C', async ({ page }) => {
    await openIntro(page)
    const seen: string[] = []
    const num = page.locator(`${LAYER} .om-num`)
    for (let i = 0; i < 60 && (await phase(page)) === 'load'; i++) {
      seen.push((await num.textContent())!.trim())
      await sleep(100)
    }
    await expect(num).toHaveText('C', { timeout: 15_000 })
    for (const s of seen) expect(s, s).toMatch(/^(·|[IVXLC]+)$/)
    const values = seen.map(fromRoman)
    for (let i = 1; i < values.length; i++) expect(values[i], seen.join(' ')).toBeGreaterThanOrEqual(values[i - 1])
    expect(new Set(seen).size, seen.join(' ')).toBeGreaterThan(3)
  })

  test('the landing says his tagline, the prologue and its year, his counts and, on wide screens, his day and his calling', async ({ page }) => {
    await openIntro(page)
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    const layer = page.locator(LAYER)
    await expect(layer).toContainText(PERSON.tagline)
    await expect(layer).toContainText(`Prologue · ${year}`)
    await expect(layer.locator('.om-pill').first()).toContainText(`${toRoman(PROJECTS.length)}`)
    if (project() !== 'mobile') {
      await expect(layer.locator('.om-pill')).toHaveText([
        `${toRoman(PROJECTS.length)} client projects`,
        `${toRoman(CERTIFICATIONS.length)} Salesforce certifications`,
      ])
      await expect(layer).toContainText(`${ROLES[0].title}, ${ROLES[0].company}`)
      await expect(layer).toContainText(PERSON.music)
    }
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible()
  })

  test('Skip rushes the load', async ({ page }) => {
    await openIntro(page)
    await page.getByRole('button', { name: 'Skip' }).click()
    // Left alone the load takes 3.6 s at least (its count follows the
    // component's surge and stall to the end); rushed, it is over sooner.
    await expect.poll(() => phase(page), { timeout: 3000 }).not.toBe('load')
    // Skip goes with the load; focus must not fall out of the dialog with it.
    await expect.poll(() => page.evaluate((sel) => !!document.activeElement?.closest(sel), LAYER)).toBe(true)
  })
})

test.describe('the ways out', () => {
  test('Enter lifts it onto the page the moment it shows (during the unveil too), focus on main', async ({ page }) => {
    await openIntro(page)
    const enter = page.getByRole('button', { name: 'Enter' })
    await expect(enter).toBeVisible({ timeout: 20_000 })
    // It shows from the unveil on; a click then must not be lost.
    await enter.click()
    await expectGone(page)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main')
    await expectScrolls(page)
  })

  test('Escape during the load lifts it at once, without the unveil', async ({ page }) => {
    await openIntro(page)
    expect(await phase(page)).toBe('load')
    const phases: string[] = []
    await page.exposeFunction('notePhase', (p: string) => phases.push(p))
    await page.evaluate((sel) => {
      const root = document.querySelector(`${sel} .om-root`)!
      new MutationObserver(() => (window as unknown as { notePhase: (p: string) => void }).notePhase(root.getAttribute('data-phase') ?? '')).observe(root, {
        attributes: true,
        attributeFilter: ['data-phase'],
      })
    }, LAYER)
    await page.keyboard.press('Escape')
    await expectGone(page)
    // Straight from the load to the exit: no unveil, no landing on the way.
    expect(phases[0], phases.join(' > ')).toBe('exit')
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main')
    await expectScrolls(page)
  })

  test('scrolling during the load lifts it at once', async ({ page, context, isMobile }) => {
    await openIntro(page)
    expect(await phase(page)).toBe('load')
    if (isMobile) {
      await swipeUp(context, page)
    } else {
      await page.mouse.move(400, 400)
      await page.mouse.wheel(0, 200)
    }
    await expectGone(page)
    await expectScrolls(page)
  })

  test('ArrowDown, PageDown and End lift it too', async ({ page }) => {
    test.skip(project() !== 'desktop', 'Keys are the same everywhere; once is enough.')
    for (const key of ['ArrowDown', 'PageDown', 'End']) {
      await openIntro(page, '/?intro')
      await page.keyboard.press(key)
      await expectGone(page)
    }
  })

  test('a nav link lifts it and lands on its section', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The component shows its nav from 640px wide.')
    await openIntro(page)
    await page.locator(LAYER).getByRole('link', { name: 'Products' }).click()
    await expectGone(page)
    await expect(page).toHaveURL(/#products$/)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('products')
    const top = await page.locator('#products').evaluate((el) => el.getBoundingClientRect().top)
    expect(Math.abs(top), `#products is ${top}px from the top`).toBeLessThan(120)
  })
})

test.describe('a proper modal', () => {
  test('Tab stays inside it while it is up, and every stop shows, ringed', async ({ page }) => {
    await openIntro(page)
    const check = async (when: string) => {
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        // Let a late control's fade (Enter, Skip) catch up with its focus.
        await sleep(350)
        const stop = await page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null
          if (!el || !el.closest(sel)) return { inside: false, name: el?.tagName ?? 'none', opacity: 0, ring: false }
          let opacity = 1
          for (let n: HTMLElement | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity)
          const style = getComputedStyle(el)
          return { inside: true, name: (el.textContent ?? '').trim().slice(0, 24) || el.className.toString().slice(0, 24), opacity, ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 }
        }, LAYER)
        expect(stop.inside, `${when}: Tab ${i + 1} left the intro (${stop.name})`).toBe(true)
        expect(stop.opacity, `${when}: "${stop.name}" is focused but not shown`).toBeGreaterThan(0.6)
        expect(stop.ring, `${when}: "${stop.name}" has no focus ring`).toBe(true)
      }
    }
    await check('load')
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    await check('landing')
  })

  test('if the stage fails to load, the page comes back at once', async ({ page }) => {
    await page.route('**/_next/static/chunks/**', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-intro-layer')) return route.abort()
      return route.fulfill({ response, body })
    })
    await page.goto('/?intro')
    // Well before the gate's 8 s fail-safe.
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', { timeout: 6000 })
    await expect(page.locator('#hero-title')).toBeVisible()
    await expect(page.locator(LAYER)).toHaveCount(0)
  })

  test('if the stage never arrives, the fail-safe gives the page back and it never shows late', async ({ page }) => {
    let held = 0
    await page.route('**/_next/static/chunks/**', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-intro-layer')) {
        held++
        await sleep(12_000)
      }
      return route.fulfill({ response, body }).catch(() => {})
    })
    await page.goto('/?intro')
    await expect(page.locator('html')).toHaveAttribute('data-intro', '')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', { timeout: 11_000 })
    await expect(page.locator('#hero-title')).toBeVisible()
    expect(held, 'the stage was asked for').toBeGreaterThan(0)
    // When it does arrive, it stays away.
    await sleep(5000)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('axe finds nothing during the load or at the landing', async ({ page }) => {
    await openIntro(page)
    const audit = async (when: string) => {
      const results = await new AxeBuilder({ page }).include(LAYER).options({ rules: { 'target-size': { enabled: true } } }).analyze()
      expect(results.violations.map((v) => `${when}: ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    }
    await audit('load')
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    // Let the landing's copy finish fading in.
    await sleep(3000)
    await audit('landing')
  })

  test('the whole intro: a clean console, no CSP report, nothing off-origin', async ({ page, baseURL }) => {
    const console = collectConsole(page)
    const csp = await collectCspReports(page)
    const outside: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (!url.startsWith(baseURL!) && !/^(data|blob):/.test(url)) outside.push(url)
    })
    await openIntro(page)
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Enter' }).click()
    await expectGone(page)
    await sleep(500)
    console.expectClean()
    expect(await csp.reports()).toEqual([])
    expect(outside).toEqual([])
  })
})

test.describe('layout', () => {
  test('no sideways scroll, and the pills never overlap, 320 to 1920 wide', async ({ page }) => {
    test.skip(project() !== 'desktop', 'One sweep of window sizes is enough.')
    // Six intros, each to its landing.
    test.setTimeout(240_000)
    for (const [width, height] of [
      [320, 640],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height })
      await openIntro(page, '/?intro')
      await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
      const m = await page.evaluate((sel) => {
        const pills = [...document.querySelectorAll(`${sel} .om-pill`)].map((p) => p.getBoundingClientRect())
        // The layer is fixed, so the document's scrollWidth can't see it:
        // measure what it shows instead (the word may run to the edges).
        const shown = [...document.querySelectorAll(`${sel} .om-top a, ${sel} .om-brand, ${sel} .om-eyebrow, ${sel} .om-tagline, ${sel} .om-cta, ${sel} .om-aside, ${sel} .om-plate`)]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => [el.className.toString().split(' ')[0], Math.round(el.getBoundingClientRect().left), Math.round(el.getBoundingClientRect().right)] as const)
        return { pills: pills.map((r) => [Math.round(r.left), Math.round(r.right)]), shown }
      }, LAYER)
      expect(m.shown.length, `${width}: nothing measured`).toBeGreaterThan(3)
      for (const [what, l, r] of m.shown) {
        expect(l, `${width}: ${what} starts off screen`).toBeGreaterThanOrEqual(0)
        expect(r, `${width}: ${what} ends off screen`).toBeLessThanOrEqual(width)
      }
      for (const [l, r] of m.pills) {
        expect(l, `${width}: a pill starts off screen`).toBeGreaterThanOrEqual(0)
        expect(r, `${width}: a pill ends off screen`).toBeLessThanOrEqual(width)
      }
      if (m.pills.length === 2) expect(m.pills[0][1], `${width}: the pills overlap`).toBeLessThan(m.pills[1][0])
    }
  })
})
