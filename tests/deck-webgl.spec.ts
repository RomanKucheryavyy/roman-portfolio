import { existsSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { gotoHome } from './helpers'

/**
 * The one Spline card (FUBC Coffee iOS) must never take the site down.
 *
 * Before W0's WebGLBoundary, a Spline failure (no WebGL, or its scene host
 * unreachable) threw through the whole React tree and left a blank page. These
 * are W0's acceptance scenarios. Until the boundary is on the branch they are
 * marked as expected failures, so the suite records the bug instead of hiding
 * it, and the moment the file lands they must pass.
 */
const BOUNDARY_LANDED = existsSync(path.join(process.cwd(), 'src', 'components', 'ui', 'WebGLBoundary.tsx'))
const PENDING_W0 = 'Spline white-screens the site until W0 adds WebGLBoundary'

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
    test.fail(!BOUNDARY_LANDED, PENDING_W0)
    await page.route(/spline\.design/, (route) => route.abort())

    const card = await frontTheSplineCard(page)
    await page.waitForTimeout(3000)
    await expect(page.locator('main')).toBeAttached()
    await expect(page.locator('#symphony')).toBeAttached()
    await expect(card.locator('img[src*="fubc-coffee-ios"]')).toBeAttached({ timeout: 10_000 })
  })

  test('with WebGL off, the site survives, shows the screenshot and never fetches Spline', async ({ page }) => {
    test.skip(test.info().project.name !== 'no-webgl', 'Runs only where WebGL is switched off.')
    test.fail(!BOUNDARY_LANDED, PENDING_W0)
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
})
