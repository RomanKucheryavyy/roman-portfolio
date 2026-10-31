import { expect, test, type Page } from '@playwright/test'
import { RANK } from '@/lib/content'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act IV, Credentials: his Trailhead rank leads it as its crowning honour
 * (src/components/stage/rank-honour.tsx, on designali-in/award), then the
 * frieze of certification seals. Runs in all three projects; the width
 * sweep only on desktop, where the window can be resized.
 */

const honourOf = (page: Page) => page.locator('section#credentials [data-rank]')

/** The honour's three lines of words, in reading order: the platform (the page's), then the award's title and subtitle. */
const WORDS = ['[data-platform]', '.rk-award > div > :nth-child(2)', '.rk-award > div > :nth-child(4)']

/** The honour's own animations: all of them, the entrance's (finite), and how many are running. */
function motion(page: Page) {
  return honourOf(page).evaluate((box) => {
    const mine = document.getAnimations().filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target
      return !!target && box.contains(target)
    })
    return {
      total: mine.length,
      entrance: mine.filter((a) => a.effect?.getTiming().iterations !== Infinity).length,
      running: mine.filter((a) => a.playState === 'running').length,
    }
  })
}

/** The opacity each of the honour's words is drawn at. */
const wordOpacities = (page: Page) =>
  honourOf(page).evaluate((box, words) => words.map((w) => Number(getComputedStyle(box.querySelector(w)!).opacity)), WORDS)

async function bringIn(page: Page) {
  await honourOf(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(300)
}

test.describe('Act IV, the rank', () => {
  test('leads the act: its words from the record, in reading order, none of them a heading, before the seals', async ({ page }) => {
    await gotoHome(page)
    await bringIn(page)
    const section = page.locator('section#credentials')
    const honour = honourOf(page)
    for (const words of [RANK.platform, RANK.name, RANK.standing]) await expect(honour.getByText(words, { exact: true })).toBeVisible()
    // The platform, the name, the standing: in that order, one element each.
    const order = await honour.evaluate((box, words) => words.map((w) => box.querySelector(w)?.textContent?.trim()), WORDS)
    expect(order).toEqual([RANK.platform, RANK.name, RANK.standing])

    // The act's one heading is its h2, the eight certifications: the rank is
    // not filed under it as a heading of its own (nor is anything an h1).
    const headings = await section
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((el) => `${el.tagName} ${el.textContent?.replace(/\s+/g, ' ').trim()}`))
    expect(headings).toHaveLength(1)
    expect(headings[0]).toMatch(/^H2 \d+ Salesforce certifications$/)
    await expect(section.getByRole('heading', { name: new RegExp(RANK.name) })).toHaveCount(0)
    // No level pill: the component's own word is not shown or read.
    await expect(honour.getByText('GOLD', { exact: true })).toBeHidden()

    // Before the frieze in the document, and drawn above it.
    const place = await section.evaluate((s) => {
      const honour = s.querySelector('[data-rank]')!
      const frieze = s.querySelector('[aria-label="Salesforce certifications"]')!
      return {
        before: !!(honour.compareDocumentPosition(frieze) & Node.DOCUMENT_POSITION_FOLLOWING),
        above: honour.getBoundingClientRect().bottom <= frieze.getBoundingClientRect().top,
      }
    })
    expect(place).toEqual({ before: true, above: true })

    // The drawing and the glory are decoration: every drawing is hidden from
    // screen readers or has nothing to read (no role, name or title), nothing
    // in the honour takes focus, and it links nowhere (no profile address was
    // given).
    const drawn = await honour.evaluate((box) => ({
      svgSilent: [...box.querySelectorAll('svg')].every(
        (svg) => !!svg.closest('[aria-hidden="true"]') || (!svg.getAttribute('role') && !svg.getAttribute('aria-label') && !svg.querySelector('title')),
      ),
      gloryHidden: box.querySelector('[data-glory]')?.getAttribute('aria-hidden'),
      links: box.querySelectorAll('a').length,
      focusable: [...box.querySelectorAll<HTMLElement>('*')].filter((el) => {
        el.focus({ preventScroll: true })
        return document.activeElement === el
      }).length,
    }))
    expect(drawn).toEqual({ svgSilent: true, gloryHidden: 'true', links: 0, focusable: 0 })
    // The laurel is gold (the page's gradient), not the component's own ink.
    const fill = await honour.locator('.rk-award > svg').evaluate((svg) => getComputedStyle(svg).fill)
    expect(fill).toContain('rk-laurel')
  })

  test('arrives once in view, comes to rest, and keeps its slow light going only while on screen', async ({ page }) => {
    await gotoHome(page)
    // Off screen as the page opens: the entrance is ready, its words held back.
    await expect.poll(() => motion(page).then((m) => m.entrance)).toBeGreaterThan(0)
    expect((await motion(page)).running, 'nothing moves before it is seen').toBe(0)
    expect(await wordOpacities(page)).toEqual(expect.arrayContaining([0]))

    await bringIn(page)
    // The entrance plays and lets go of every element once done.
    await expect.poll(() => motion(page).then((m) => m.entrance), { timeout: 20_000 }).toBe(0)
    expect((await wordOpacities(page)).every((o) => o === 1), 'every word drawn in full').toBe(true)
    // What keeps going while it is on screen: the rays, and the sheen across the name.
    await expect.poll(() => motion(page)).toEqual({ total: 2, entrance: 0, running: 2 })

    // Off screen, all of it holds still.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(0)
    await bringIn(page)
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(2)
  })

  test('opens finished when the page lands on it: nothing seen is hidden to be brought in again', async ({ page }) => {
    // Every frame from the first paint: the lowest opacity each word is drawn
    // at while the honour is on screen.
    await page.addInitScript((words) => {
      const low = words.map(() => 1)
      ;(window as unknown as { __low: number[] }).__low = low
      const start = performance.now()
      const look = () => {
        const box = document.querySelector('[data-rank]')
        if (box) {
          const r = box.getBoundingClientRect()
          if (r.top < innerHeight && r.bottom > 0)
            words.forEach((w, i) => {
              const el = box.querySelector(w)
              if (el) low[i] = Math.min(low[i], Number(getComputedStyle(el).opacity))
            })
        }
        if (performance.now() - start < 6000) requestAnimationFrame(look)
      }
      requestAnimationFrame(look)
    }, WORDS)
    await gotoHome(page, '/#credentials')
    await expect.poll(() => honourOf(page).evaluate((box) => box.getBoundingClientRect().top < innerHeight)).toBe(true)
    await sleep(2500)
    expect(await page.evaluate(() => (window as unknown as { __low: number[] }).__low), 'the lowest opacity of each word while on screen').toEqual([1, 1, 1])
    expect((await motion(page)).entrance, 'no entrance').toBe(0)
    // Its light still goes round.
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(2)
  })

  test('stands still and whole under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await bringIn(page)
    await sleep(1000)
    expect(await motion(page)).toEqual({ total: 0, entrance: 0, running: 0 })
    expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
    await expect(honourOf(page).getByText(RANK.name, { exact: true })).toBeVisible()
  })

  test.describe('without scripts', () => {
    test.use({ javaScriptEnabled: false })

    test('the server\'s HTML is the finished honour', async ({ page }) => {
      await page.goto('/')
      await expect(honourOf(page).getByText(RANK.name, { exact: true })).toBeVisible()
      expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
      // The laurel, in its gold.
      await expect(honourOf(page).locator('.rk-award > svg')).toBeVisible()
      expect(await honourOf(page).locator('.rk-award > svg').evaluate((svg) => getComputedStyle(svg).fill)).toContain('rk-laurel')
    })
  })

  test('fits from 320 to 1920: no sideways scroll, its words on screen, clear of the header and above the seals', async ({ page }) => {
    test.skip(project() !== 'desktop', 'resizes the window')
    await gotoHome(page)
    for (const width of [320, 360, 390, 414, 600, 768, 1024, 1279, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(200)
      const fit = await page.evaluate(() => {
        const rect = (el: Element) => el.getBoundingClientRect()
        const title = document.querySelector('#credentials-title')!
        const header = rect(title.parentElement!)
        const honour = document.querySelector('#credentials [data-rank]')!
        const parts = [honour.querySelector('.rk-award > svg')!, ...honour.querySelectorAll('p')].map(rect)
        const frieze = rect(document.querySelector('[aria-label="Salesforce certifications"]')!)
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
        return {
          sideways: document.documentElement.scrollWidth - window.innerWidth,
          titleOverflow: title.scrollWidth - title.clientWidth,
          onScreen: parts.every((b) => b.left >= 0 && b.right <= window.innerWidth),
          clearOfHeader: parts.every((b) => !overlaps(b, header)),
          aboveSeals: parts.every((b) => b.bottom <= frieze.top),
        }
      })
      expect(fit, `${width}px`).toEqual({ sideways: 0, titleOverflow: 0, onScreen: true, clearOfHeader: true, aboveSeals: true })
    }
  })
})
