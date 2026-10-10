import { expect, test } from '@playwright/test'
import { collectConsole, gotoHome, wheelThrough } from './helpers'

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
