import { expect, test, type Page } from '@playwright/test'
import { RANK } from '@/lib/content'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act IV, Credentials: his Trailhead rank leads it as its crowning honour
 * (src/components/stage/rank-honour.tsx), then the frieze of certification
 * seals. Runs in all three projects; the width sweep only on desktop, where
 * the window can be resized.
 */

const honourOf = (page: Page) => page.locator('section#credentials [data-rank]')

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
  honourOf(page)
    .locator('[data-word]')
    .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))

async function bringIn(page: Page) {
  await honourOf(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(300)
}

test.describe('Act IV, the rank', () => {
  test('leads the act: its words from the record, an h3 under the act\'s h2, before the seals', async ({ page }) => {
    await gotoHome(page)
    await bringIn(page)
    const section = page.locator('section#credentials')
    const rank = section.getByRole('heading', { level: 3, name: `${RANK.platform} ${RANK.name}` })
    await expect(rank).toBeVisible()
    await expect(rank).toHaveText(new RegExp(`^${RANK.platform}\\s+${RANK.name}$`))
    await expect(section.getByText(RANK.standing, { exact: true })).toBeVisible()

    // The act's one h2 first, then the rank's h3; no h1 in the act.
    const headings = await section
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((el) => `${el.tagName} ${el.textContent?.replace(/\s+/g, ' ').trim()}`))
    expect(headings[0]).toMatch(/^H2 \d+ Salesforce certifications$/)
    expect(headings[1]).toBe(`H3 ${RANK.platform} ${RANK.name}`)
    expect(headings.filter((h) => /^H[12] /.test(h))).toHaveLength(1)

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

    // The drawing and the glory are decoration: hidden from screen readers,
    // nothing in the honour takes focus, and it links nowhere (no profile
    // address was given).
    const drawn = await honourOf(page).evaluate((box) => ({
      svgHidden: [...box.querySelectorAll('svg')].every((svg) => svg.closest('[aria-hidden="true"]')),
      gloryHidden: box.querySelector('[data-glory]')?.getAttribute('aria-hidden'),
      links: box.querySelectorAll('a').length,
      focusable: [...box.querySelectorAll<HTMLElement>('*')].filter((el) => {
        el.focus({ preventScroll: true })
        return document.activeElement === el
      }).length,
    }))
    expect(drawn).toEqual({ svgHidden: true, gloryHidden: 'true', links: 0, focusable: 0 })
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
    // What keeps going while it is on screen: the rays, and the sheen across the medal and the name.
    await expect.poll(() => motion(page)).toEqual({ total: 3, entrance: 0, running: 3 })

    // Off screen, all of it holds still.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(0)
    await bringIn(page)
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(3)
  })

  test('stands still and whole under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await bringIn(page)
    await sleep(1000)
    expect(await motion(page)).toEqual({ total: 0, entrance: 0, running: 0 })
    expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
    await expect(page.locator('section#credentials h3')).toBeVisible()
  })

  test.describe('without scripts', () => {
    test.use({ javaScriptEnabled: false })

    test('the server\'s HTML is the finished honour', async ({ page }) => {
      await page.goto('/')
      await expect(honourOf(page).locator('h3')).toHaveText(new RegExp(`${RANK.name}$`))
      expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
      await expect(honourOf(page).locator('svg').first()).toBeVisible()
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
        const parts = [honour.querySelector('svg')!, ...honour.querySelectorAll('h3, p')].map(rect)
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
