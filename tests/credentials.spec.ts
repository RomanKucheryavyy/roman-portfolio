import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { CERTIFICATIONS } from '@/lib/constants'
import { LIVE_CLIENT_WORK } from '@/lib/work'
import { capture, contrast, gotoHome } from './helpers'

/**
 * W5: Credentials (The Measures) and About (The Conductor).
 *
 * - The facts are derived: the record row, the intro counts, the code card,
 *   the timeline all read site-facts / CERTIFICATIONS / the work list.
 * - The live App Store line renders only when Apple answered.
 * - The cert cards are keyboard toggles with one heading each.
 * - Reduced motion leaves everything drawn and still.
 * - The Conductor's ScrollTriggers are reverted when it unmounts.
 *
 * Each test names the project it belongs to and skips the others. Never waits
 * for `networkidle`: the ocean, Lenis and the deck keep the page busy forever.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function only(project: 'desktop' | 'mobile') {
  const name = test.info().project.name
  test.skip(name !== '' && name !== project, `runs in the ${project} project`)
}

/** Walks down to an element in steps, so every scroll-triggered reveal on the way fires. */
async function scrollToId(page: Page, id: string) {
  await page.evaluate(async (target: string) => {
    const el = document.getElementById(target)
    if (!el) throw new Error(`#${target} is not on the page`)
    const goal = el.getBoundingClientRect().top + window.scrollY - 90
    let y = window.scrollY
    while (Math.abs(goal - y) > 10) {
      y += Math.sign(goal - y) * Math.min(400, Math.abs(goal - y))
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
  }, id)
  await page.mouse.wheel(0, 1)
  await settle(400)
}

/** Then on through the section to its end, so its lower reveals and the timeline fire too. */
async function scrollThrough(page: Page, id: string) {
  await scrollToId(page, id)
  await page.evaluate(async (target: string) => {
    const el = document.getElementById(target)!
    const end = el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 40
    let y = window.scrollY
    while (y < end) {
      y = Math.min(end, y + 300)
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 150))
    }
  }, id)
  await page.mouse.wheel(0, 1)
  await settle(1200)
}

/** The <dd> after the <dt> that reads `term`, in the Credentials record row. */
const recordCell = (page: Page, term: string) =>
  page.locator('#measures dl > div').filter({ has: page.locator('dt', { hasText: term }) }).locator('dd')

const APP_STORE_NULLS = { rating: null, count: null, version: null, updated: null, firstRelease: null, checkedAt: null }

test.describe('source', () => {
  test('the sections import their facts instead of typing them', () => {
    only('desktop')
    for (const file of ['Measures.tsx', 'Conductor.tsx']) {
      const src = readFileSync(path.join(ROOT, 'src/components/sections', file), 'utf8')
      expect(src, file).not.toMatch(/Gov Cloud|Signature Success|Government Cloud|MindTree/)
    }
  })

  test('the dead #halftone filter is gone', () => {
    only('desktop')
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (readFileSync(full, 'utf8').includes('halftone')) hits.push(full)
      }
    }
    walk(path.join(ROOT, 'src'))
    expect(hits).toEqual([])
  })
})

test.describe('Credentials', () => {
  test('the record row states the current role and derives every count', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await scrollToId(page, 'measures')

    const measures = page.locator('#measures')
    await expect(measures).toContainText('Signature Success')
    expect(await page.evaluate(() => document.body.textContent ?? '')).not.toContain('Sr. TSE, Salesforce Gov Cloud')

    await expect(measures.locator('dl')).toHaveCount(1)
    const terms = await measures.locator('dl dt').count()
    expect(terms).toBeGreaterThan(0)
    expect(terms).toBeLessThanOrEqual(6)

    await expect(recordCell(page, 'Certified')).toContainText(String(CERTIFICATIONS.length))
    await expect(recordCell(page, 'Shipped')).toContainText(String(LIVE_CLIENT_WORK.length))
    const uw = await measures.evaluate((el) => (el.textContent ?? '').split('UW Tacoma').length - 1)
    expect(uw, '"UW Tacoma" in #measures').toBe(1)
  })

  test('the Shipped cell shows the App Store rating only when Apple answered', async ({ page }) => {
    only('desktop')
    await page.route('**/api/app-store', (route) => route.fulfill({ json: APP_STORE_NULLS }))
    const answered = page.waitForResponse('**/api/app-store')
    await gotoHome(page)
    await answered
    await scrollToId(page, 'measures')
    await settle(300)
    const shipped = recordCell(page, 'Shipped')
    await expect(shipped).toBeVisible()
    await expect(shipped).not.toContainText('ratings')
    await expect(shipped).not.toContainText('5.0')

    await page.unroute('**/api/app-store')
    await page.route('**/api/app-store', (route) =>
      route.fulfill({ json: { ...APP_STORE_NULLS, rating: 5, count: 11, checkedAt: '2026-10-10T00:00:00Z' } }),
    )
    await page.reload()
    await expect(page.locator('#hero h1')).toBeVisible({ timeout: 30_000 })
    await scrollToId(page, 'measures')
    await expect(recordCell(page, 'Shipped')).toContainText('5.0 · 11 ratings · checked')
  })

  test('each cert card leads with its full name and flips from the keyboard', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await scrollThrough(page, 'measures')
    await page.mouse.move(0, 0)

    const headings = page.locator('#measures h3')
    await expect(headings).toHaveCount(CERTIFICATIONS.length)
    await expect(headings).toHaveText(CERTIFICATIONS.map((c) => c.name))
    for (let i = 0; i < CERTIFICATIONS.length; i++) await expect(headings.nth(i)).toBeVisible()

    const toggles = page.locator('#measures button[aria-pressed]')
    await expect(toggles).toHaveCount(CERTIFICATIONS.length)

    // Into the first card from the keyboard, so :focus-visible applies.
    await toggles.first().focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    const focused = () =>
      page.evaluate(() => ({
        label: document.activeElement?.getAttribute('aria-label') ?? '',
        pressed: document.activeElement?.getAttribute('aria-pressed') ?? '',
      }))

    // rotateY(180deg) as Chromium serialises it; a card at rest computes `none`.
    const TURNED = /^matrix3d\(-1, 0, (-?0|1\.2\d*e-16), 0, 0, 1, 0, 0, (-?0|-?1\.2\d*e-16), 0, -1, 0, 0, 0, 0, 1\)$/
    const cards = page.locator('#measures .flip-card')
    const turn = (i: number) => () => cards.nth(i).locator('.flip-card-inner').evaluate((el) => getComputedStyle(el).transform)
    const pressed = (i: number) => cards.nth(i).locator('button[aria-pressed]').getAttribute('aria-pressed')

    expect((await focused()).pressed).toBe('false')
    // Focus alone shows the back.
    await expect.poll(turn(0)).toMatch(TURNED)

    // Enter pins it: the back stays once focus moves on, and the state says so.
    await page.keyboard.press('Enter')
    expect((await focused()).pressed).toBe('true')
    await page.keyboard.press('Tab')
    expect(await pressed(0)).toBe('true')
    await expect.poll(turn(0)).toMatch(TURNED)

    // Space lets it go: once focus moves on, the front is back.
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Space')
    expect((await focused()).pressed).toBe('false')
    await page.keyboard.press('Tab')
    expect(await pressed(0)).toBe('false')
    await expect.poll(turn(0)).toBe('none')
    await page.keyboard.press('Shift+Tab')

    const walk: string[] = []
    for (let i = 0; i < CERTIFICATIONS.length; i++) {
      walk.push((await focused()).label)
      await page.keyboard.press('Tab')
    }
    expect(walk).toEqual(CERTIFICATIONS.map((c) => `Flip the ${c.name} card`))

    // A click pins a card too, so it still shows its back after the mouse leaves.
    // The walk tabbed out of the section and the page followed, so come back first.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await scrollToId(page, 'measures')
    await settle(600)
    const third = (await cards.nth(2).boundingBox())!
    expect(third.y + third.height, 'the third card is on screen').toBeLessThan(page.viewportSize()!.height)
    await page.mouse.click(third.x + 20, third.y + 20)
    await page.mouse.move(0, 0)
    expect(await pressed(2)).toBe('true')
    await expect.poll(turn(2)).toMatch(TURNED)
    await page.mouse.click(third.x + 20, third.y + 20)
    await page.mouse.move(0, 0)
    expect(await pressed(2)).toBe('false')
    await expect.poll(turn(2)).toBe('none')
  })

  test('a tap flips a card on a phone, and the longest name fits its front', async ({ page }) => {
    only('mobile')
    await gotoHome(page)
    await scrollThrough(page, 'measures')

    const card = page.locator('#measures .flip-card').filter({ hasText: 'Advanced Administrator' })
    await card.scrollIntoViewIfNeeded()
    await settle(900)
    const fit = await card.evaluate((el) => {
      const front = el.querySelector('.flip-card-front') as HTMLElement
      const box = el.getBoundingClientRect()
      const parts = [...front.children].filter((c) => c.getBoundingClientRect().height > 0)
      return {
        height: box.height,
        overflowY: front.scrollHeight - front.clientHeight,
        overflowX: front.scrollWidth - front.clientWidth,
        lowest: Math.max(...parts.map((c) => c.getBoundingClientRect().bottom)) - box.top,
      }
    })
    expect(fit.height).toBe(176) // h-44
    expect(fit.overflowY).toBeLessThanOrEqual(0)
    expect(fit.overflowX).toBeLessThanOrEqual(0)
    expect(fit.lowest).toBeLessThanOrEqual(176)
    await card.screenshot({ path: test.info().outputPath('advanced-administrator-390.png') })

    const toggle = card.locator('button[aria-pressed]')
    await toggle.tap()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect
      .poll(() => card.locator('.flip-card-inner').evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^matrix3d\(-1,/)
  })
})

test.describe('About', () => {
  test('on a phone the plain intro comes before the photo', async ({ page }) => {
    only('mobile')
    await gotoHome(page)
    await scrollToId(page, 'conductor')
    const intro = page.locator('#conductor header p').last()
    await expect(intro).toContainText('Signature Success')
    const introTop = (await intro.boundingBox())!.y
    const photoTop = (await page.locator('#conductor img[alt="Roman Kucheryavyy"]').boundingBox())!.y
    expect(introTop).toBeLessThan(photoTop)
  })

  test('facts and prose are readable, and the timeline is one list of five', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await scrollThrough(page, 'conductor')

    const conductor = page.locator('#conductor')
    await expect(conductor).toContainText('Signature Success')

    const readable = await page.evaluate(() => {
      const section = document.getElementById('conductor')!
      const prose = [
        section.querySelector('header > p:last-of-type'),
        ...[...section.querySelectorAll('p')].filter((p) => /^(Music and code|Off the clock)/.test(p.textContent?.trim() ?? '')),
      ].filter(Boolean) as Element[]
      return [...section.querySelectorAll('dd'), ...prose].map((el) => ({
        text: (el.textContent ?? '').trim().slice(0, 40),
        size: parseFloat(getComputedStyle(el).fontSize),
        color: getComputedStyle(el).color,
      }))
    })
    expect(readable.filter((r) => /^(Music|Off)/.test(r.text))).toHaveLength(2)
    expect(readable.length).toBeGreaterThanOrEqual(7) // 4 facts, the intro, 2 paragraphs
    for (const r of readable) {
      expect(r.size, `${r.text} font size`).toBeGreaterThanOrEqual(14)
      expect(contrast(r.color, '#0a0a0a'), `${r.text} contrast`).toBeGreaterThanOrEqual(4.5)
    }

    const items = conductor.locator('ol[data-timeline] > li')
    await expect(items).toHaveCount(5)
    for (const text of await items.allTextContents()) expect(text).not.toContain('8 Certs')
    const labelSizes = await conductor
      .locator('ol[data-timeline] li span:not([aria-hidden]):not(.sr-only)')
      .evaluateAll((els) => els.filter((el) => el.textContent?.trim()).map((el) => parseFloat(getComputedStyle(el).fontSize)))
    expect(labelSizes.length).toBeGreaterThanOrEqual(10)
    for (const size of labelSizes) expect(size).toBeGreaterThanOrEqual(12)
    // The current entry says so to assistive tech.
    await expect(items.last()).toContainText('current')
  })

  test('the timeline dots sit at their real years on the rail', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await scrollThrough(page, 'conductor')
    const at = await page.locator('#conductor ol[data-timeline]').evaluate((ol) => {
      const box = ol.getBoundingClientRect()
      return [...ol.querySelectorAll(':scope > li')].map((li) => {
        const dot = li.querySelector('.rounded-full') as HTMLElement
        const d = dot.getBoundingClientRect()
        return {
          year: Number(li.textContent?.match(/\d{4}/)?.[0]),
          at: (d.left + d.width / 2 - box.left) / box.width,
        }
      })
    })
    const first = at[0].year
    const last = at[at.length - 1].year
    for (const { year, at: x } of at) {
      // Within a dot's width of the year's share of the span.
      expect(Math.abs(x - (year - first) / (last - first)), `${year}`).toBeLessThan(0.012)
    }
  })

  test('under reduced motion the rule, the caret and the helix are still, and drawn', async ({ page }) => {
    only('desktop')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await scrollToId(page, 'measures')

    const helix = page.locator('#measures [aria-hidden="true"] > div[style*="preserve-3d"]')
    await expect(helix).toBeAttached()
    const first = await helix.evaluate((el) => getComputedStyle(el).transform)
    await settle(500)
    expect(await helix.evaluate((el) => getComputedStyle(el).transform)).toBe(first)

    await scrollThrough(page, 'conductor')
    const line = page.locator('#conductor [data-timeline-line]')
    expect(await line.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
    const dots = await page.locator('#conductor [data-timeline-dot]').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))
    expect(dots).toEqual(['1', '1', '1', '1', '1'])

    const caret = page.locator('#conductor [role="region"][aria-label="roman.ts"] .inline-block')
    await expect(caret).toHaveCount(1)
    for (let i = 0; i < 3; i++) {
      expect(await caret.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
      await settle(350)
    }
  })

  test('without reduced motion the helix does turn (the still check above means something)', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await scrollToId(page, 'measures')
    const helix = page.locator('#measures [aria-hidden="true"] > div[style*="preserve-3d"]')
    const first = await helix.evaluate((el) => getComputedStyle(el).transform)
    await settle(500)
    expect(await helix.evaluate((el) => getComputedStyle(el).transform)).not.toBe(first)
  })

  test('under reduced motion A Year in Measures shows every note', async ({ page }) => {
    only('desktop')
    const weeks = Array.from({ length: 52 }, (_, i) => {
      const d = new Date(Date.UTC(2025, 9, 12 + i * 7))
      return { start: d.toISOString().slice(0, 10), count: i % 4 === 0 ? 0 : (i % 7) + 1 }
    })
    await page.route('**/api/contributions', (route) =>
      route.fulfill({ json: { user: 'RomanKucheryavyy', total: 120, approximate: false, weeks } }),
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await scrollThrough(page, 'conductor')

    const notes = page.locator('#conductor [data-week-note]')
    await expect(notes.first()).toBeAttached()
    expect(await notes.count()).toBe(weeks.filter((w) => w.count > 0).length)
    const opacities = await notes.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))
    expect(new Set(opacities)).toEqual(new Set(['1']))
  })

  test('leaving for /works and coming back leaves no extra ScrollTriggers', async ({ page }) => {
    only('desktop')
    // ScrollTrigger isn't on window in a production build. The first tween
    // given a scrollTrigger assigns `tween.scrollTrigger = instance`; a
    // non-enumerable accessor on Object.prototype catches that assignment and
    // keeps the instance's class (the one with static getAll), then gives the
    // tween its own plain property, so GSAP sees nothing different.
    await page.addInitScript(() => {
      Object.defineProperty(Object.prototype, 'scrollTrigger', {
        configurable: true,
        enumerable: false,
        get() {
          return undefined
        },
        set(value: unknown) {
          Object.defineProperty(this, 'scrollTrigger', { value, writable: true, configurable: true, enumerable: true })
          const w = window as unknown as { __ST?: unknown }
          const ctor = value && typeof value === 'object' ? Object.getPrototypeOf(value)?.constructor : null
          if (!w.__ST && ctor && typeof ctor.getAll === 'function' && typeof ctor.create === 'function') w.__ST = ctor
        },
      })
    })
    await gotoHome(page)

    const count = () =>
      page.evaluate(() => {
        const ST = (window as unknown as { __ST?: { getAll(): unknown[] } }).__ST
        return ST ? ST.getAll().length : -1
      })
    const stable = async () => {
      let last = await count()
      for (let i = 0; i < 20; i++) {
        await settle(400)
        const now = await count()
        if (now === last && now >= 0) return now
        last = now
      }
      return last
    }

    const before = await stable()
    expect(before, 'ScrollTrigger was found').toBeGreaterThan(0)
    await page.evaluate(() => ((window as unknown as { __softNav: number }).__softNav = 1))

    // Click the link without scrolling to it, so no once-trigger fires on the way.
    await page.evaluate(() => (document.querySelector('a[href="/works"]') as HTMLAnchorElement).click())
    await page.waitForURL('**/works')
    await settle(1000)
    await page.goBack()
    await page.waitForURL((url) => url.pathname === '/')
    await expect(page.locator('#hero h1')).toBeVisible({ timeout: 30_000 })
    expect(await page.evaluate(() => (window as unknown as { __softNav?: number }).__softNav), 'stayed one document').toBe(1)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    expect(await stable()).toBe(before)
  })

  test('Conductor has no horizontal overflow at 1024 and 1440', async ({ page }) => {
    only('desktop')
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await gotoHome(page)
      await scrollThrough(page, 'conductor')
      const overflow = await page.locator('#conductor').evaluate((section) => {
        const out: string[] = []
        if (section.scrollWidth > section.clientWidth) out.push(`section ${section.scrollWidth} > ${section.clientWidth}`)
        for (const el of section.querySelectorAll<HTMLElement>('*')) {
          if (el.closest('svg') || el.classList.contains('sr-only')) continue
          const cs = getComputedStyle(el)
          if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.display === 'inline') continue
          if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName} ${el.className}`.slice(0, 120))
        }
        const box = section.getBoundingClientRect()
        for (const el of section.querySelectorAll<HTMLElement>('ol[data-timeline] li')) {
          const r = el.getBoundingClientRect()
          if (r.left < box.left - 1 || r.right > box.right + 1) out.push(`timeline item out of the section: ${el.textContent}`)
        }
        return out
      })
      expect(overflow, `overflow at ${width}`).toEqual([])
      if (process.env.CAPTURE_DIR) await capture(page, `conductor-${width}`)
    }
  })
})
