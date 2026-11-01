import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { gotoHome, sleep } from './helpers'

/**
 * On a phone, a vertical swipe that starts on one of the page's interactive
 * pieces still scrolls the page: the About badges (matter-js, which a
 * sideways drag still throws), the client-work folios (StackingCards, which
 * stack on a phone held upright: one in the flow, and one pinned under the
 * top bar), the products' previews, diagrams and title cards, and the Experience
 * timeline (Lifeline's phone list). Real touch
 * events through CDP, which the compositor scrolls with (a synthesized
 * scroll gesture does not scroll anything in headless Chromium).
 */

test.skip(({ isMobile }) => !isMobile, 'Touch scrolling is a phone concern; the mobile project has a touch screen.')

/** Swipes up from (x, y) by `distance` px in 20 moves, with real touch events. */
async function swipeUp(context: BrowserContext, page: Page, x: number, y: number, distance = 400) {
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 20; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - (i * distance) / 20 }] })
    await sleep(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

/** Puts `selector`'s box mid-screen and returns a point inside it that is really it on screen. */
async function centre(page: Page, selector: string) {
  const target = page.locator(selector).first()
  await target.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(600)
  const box = (await target.boundingBox())!
  const x = Math.round(box.x + box.width / 2)
  const y = Math.round(Math.min(box.y + box.height / 2, 600))
  const hit = await page.evaluate(([px, py, sel]) => !!document.elementFromPoint(px, py)?.closest(sel), [x, y, selector] as const)
  expect(hit, `${selector} is what the swipe starts on`).toBe(true)
  return { x, y }
}

const PIECES: [string, string, (page: Page) => Promise<void>][] = [
  [
    'a badge in the About block',
    '#about [aria-label="Keywords"] > div',
    async (page) => {
      await page.locator('#about').scrollIntoViewIfNeeded()
      await expect(page.locator('#about [aria-label="Keywords"] > div').first()).toBeVisible({ timeout: 15_000 })
      // Let the pile come to rest.
      await sleep(2500)
    },
  ],
  ['a client-work card', '#work [data-slot="card"]', async () => {}],
  // A product's live preview (its link holds the scrolling screenshots) and
  // a private product's diagram.
  ['a product preview', '#products [data-preview="live"] a', async () => {}],
  ['a product diagram', '#products [data-preview="flow"] [role="group"]', async () => {}],
  // A product's title card (the Roman staging above its row), once its stage is up.
  [
    'a product title card',
    '#products [data-title-card]',
    async (page) => {
      const card = page.locator('#products [data-title-card]').first()
      await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(card.locator('.om-root')).toBeAttached({ timeout: 20_000 })
    },
  ],
  ['the Experience timeline', '#experience article', async () => {}],
]

for (const [what, selector, ready] of PIECES) {
  test(`a vertical swipe that starts on ${what} scrolls the page`, async ({ page, context }) => {
    await gotoHome(page)
    await ready(page)
    const { x, y } = await centre(page, selector)
    const before = await page.evaluate(() => window.scrollY)
    await swipeUp(context, page, x, y)
    await sleep(1200)
    const after = await page.evaluate(() => window.scrollY)
    expect(after - before, `scrollY ${before} -> ${after}`).toBeGreaterThan(200)
  })
}

test('a vertical swipe that starts on a pinned client-work folio scrolls the page', async ({ page, context }) => {
  await gotoHome(page)
  // Where the fifth folio has just pinned (the stack's top plus every slot
  // before it), with the first four stacked under it.
  await page.evaluate(() => {
    const items = [...document.querySelectorAll<HTMLElement>('#work [data-stack-item]')]
    let top = items[0].parentElement!.getBoundingClientRect().top + scrollY
    for (const slot of items.slice(0, 4)) top += slot.offsetHeight
    scrollTo({ top, behavior: 'instant' })
  })
  await sleep(600)
  const folio = page.locator('#work [data-slot="card"]').nth(4)
  expect(await folio.evaluate((el) => getComputedStyle(el.closest('[data-stack-item]')!).position), 'the folios stack at 390x844').toBe('sticky')
  const box = (await folio.boundingBox())!
  const [x, y] = [Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2)]
  expect(await page.evaluate(([px, py]) => !!document.elementFromPoint(px, py)?.closest('[data-slot="card"]'), [x, y] as const), 'the swipe starts on the folio').toBe(true)
  const before = await page.evaluate(() => window.scrollY)
  await swipeUp(context, page, x, y)
  await sleep(1200)
  const after = await page.evaluate(() => window.scrollY)
  expect(after - before, `scrollY ${before} -> ${after}`).toBeGreaterThan(200)
})
