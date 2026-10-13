import { expect, test, type Page } from '@playwright/test'
import { gotoHome } from './helpers'

/**
 * The one Spline card (FUBC Coffee iOS) must never take the site down.
 *
 * Before W0's WebGLBoundary, a Spline failure (no WebGL, or its scene host
 * unreachable) threw through the whole React tree and left a blank page. These
 * are W0's acceptance scenarios; they ran as expected failures until the
 * boundary landed, and now they must pass.
 */

const SPLINE_HOSTS = /spline\.design|unpkg\.com/

/** Brings FUBC Coffee iOS, the last piece, to the front of the desktop deck. */
async function frontTheSplineCard(page: Page) {
  await gotoHome(page)
  await page.locator('#symphony').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Previous piece' }).click()
  return page.locator('#symphony [data-work="fubc-coffee-ios"]')
}

test.describe('deck and WebGL', () => {
  test('with the Spline host unreachable, the site survives and the card shows its screenshot', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'A desktop-deck scenario (the phone deck never loads Spline).')
    await page.route(/spline\.design/, (route) => route.abort())

    const card = await frontTheSplineCard(page)
    await page.waitForTimeout(3000)
    await expect(page.locator('main')).toBeAttached()
    await expect(page.locator('#symphony')).toBeAttached()
    await expect(card.locator('img[src*="fubc-coffee-ios"]')).toBeAttached({ timeout: 10_000 })
  })

  test('with WebGL off, the site survives, shows the screenshot and never fetches Spline', async ({ page }) => {
    test.skip(test.info().project.name !== 'no-webgl', 'Runs only where WebGL is switched off.')
    const splineRequests: string[] = []
    page.on('request', (req) => { if (SPLINE_HOSTS.test(req.url())) splineRequests.push(req.url()) })

    const card = await frontTheSplineCard(page)
    await page.waitForTimeout(3000)
    await expect(page.locator('main')).toBeAttached()
    await expect(page.locator('#symphony')).toBeAttached()
    await expect(card.locator('img[src*="fubc-coffee-ios"]')).toBeAttached({ timeout: 10_000 })
    expect(splineRequests).toEqual([])
  })

  test('on a normal network, the Spline phone draws a canvas in the front card', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'A desktop-deck scenario (the phone deck never loads Spline).')
    // The scene comes from Spline's own host, which this suite does not run.
    // If the runner cannot reach it at all (a network error, not an HTTP
    // status), there is nothing of ours to test: skip, and say why. Any
    // response that arrives, even an error status, still has to end in a canvas.
    const unreachable: string[] = []
    page.on('requestfailed', (req) => {
      if (/spline\.design/.test(req.url())) unreachable.push(`${req.url()} (${req.failure()?.errorText ?? 'failed'})`)
    })
    const card = await frontTheSplineCard(page)
    try {
      await expect(card.locator('canvas')).toBeAttached({ timeout: 10_000 })
    } catch (err) {
      test.skip(unreachable.length > 0, `Spline's host was unreachable from this runner: ${unreachable[0]}`)
      throw err
    }
    await expect(page.locator('#symphony')).toBeAttached()
  })

  test('the Spline phone gives its WebGL context back when its card leaves the front', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'A desktop-deck scenario (the phone deck never loads Spline).')
    // The scene remounts on every visit to the front. Each mount left a live
    // context behind, and at the 16th Chrome evicted the oldest one: the
    // hero's ocean, for the rest of the session.
    const unreachable: string[] = []
    page.on('requestfailed', (req) => {
      if (/spline\.design/.test(req.url())) unreachable.push(`${req.url()} (${req.failure()?.errorText ?? 'failed'})`)
    })
    const card = await frontTheSplineCard(page)
    try {
      await expect(card.locator('canvas')).toBeAttached({ timeout: 10_000 })
    } catch (err) {
      test.skip(unreachable.length > 0, `Spline's host was unreachable from this runner: ${unreachable[0]}`)
      throw err
    }
    const canvas = await card.locator('canvas').first().elementHandle()
    await page.getByRole('button', { name: 'Next piece' }).click()
    await expect
      .poll(() =>
        canvas!.evaluate((el) => {
          const c = el as HTMLCanvasElement
          const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
          return !c.isConnected && (gl?.isContextLost() ?? true)
        }),
      )
      .toBe(true)
    await expect(page.locator('#hero canvas').first()).toBeAttached()
  })
})
