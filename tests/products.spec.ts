import { expect, test, type Locator, type Page } from '@playwright/test'
import { PRODUCTS } from '@/lib/content'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act II, his own products: the public ones' live previews (real
 * screenshots scrolling in a browser and a phone frame) and the private
 * ones' "how it works" diagrams. Runs in all three projects; the hover and
 * the layout sweep only where a mouse and a resizable window make sense.
 */

const LIVE = PRODUCTS.filter((p) => p.preview && p.url)
const FLOW = PRODUCTS.filter((p) => p.flow)
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const figureOf = (page: Page, id: string) => page.locator(`#products figure[data-product="${id}"]`)

/** Each shot in a figure: shown at all, how its scroll animation stands, and how far it has moved. */
function shots(figure: Locator) {
  return figure.locator('img').evaluateAll((imgs) =>
    (imgs as HTMLImageElement[]).map((img) => {
      const scroll = img.getAnimations()[0]
      return {
        alt: img.alt,
        shown: img.getBoundingClientRect().width > 0,
        loaded: img.complete && img.naturalWidth > 0,
        state: scroll?.playState ?? 'none',
        y: new DOMMatrix(getComputedStyle(img).transform).m42,
      }
    }),
  )
}
const states = async (figure: Locator) => (await shots(figure)).filter((s) => s.shown).map((s) => s.state)

/** Puts the figure in the middle of the screen. */
async function bringIn(figure: Locator) {
  await figure.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(300)
}

test.describe('the products act', () => {
  test('shows his four products in his order, labelled as his own, after the client work', async ({ page }) => {
    await gotoHome(page)
    await expect(page.locator('#products h3')).toHaveText(['Alongside Events', 'Sembly', 'Praxis', 'Alongside Brain'])
    await expect(page.locator('#work p').first()).toContainText('Client work')
    await expect(page.locator('#products p').first()).toContainText('My own products')
    await expect(page.locator('#products [data-preview="live"]')).toHaveCount(LIVE.length)
    await expect(page.locator('#products [data-preview="flow"]')).toHaveCount(FLOW.length)
  })

  test('each public product shows its real screenshots, named, and links to its site', async ({ page }) => {
    await gotoHome(page)
    for (const product of LIVE) {
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      const link = figure.getByRole('link', { name: `Visit ${domain(product.url!)}` })
      await expect(link).toHaveAttribute('href', product.url!)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect.poll(async () => (await shots(figure)).filter((s) => s.shown).every((s) => s.loaded), { timeout: 15_000 }).toBe(true)
      const all = await shots(figure)
      const shown = all.filter((s) => s.shown)
      // The browser frame from md, the phone always.
      expect(shown.map((s) => s.alt)).toEqual(
        project() === 'mobile'
          ? [`Screenshot of ${domain(product.url!)} on a phone`]
          : [`Screenshot of ${domain(product.url!)} in a desktop browser`, `Screenshot of ${domain(product.url!)} on a phone`],
      )
      // Real files, not a drawing: each shown <img> has decoded pixels.
      expect(shown.every((s) => s.loaded)).toBe(true)
      await expect(figure.locator('figcaption')).toContainText(`Screenshots from ${domain(product.url!)}`)
    }
  })

  test('a preview scrolls itself while on screen, and holds still once off screen', async ({ page }) => {
    await gotoHome(page)
    const figure = figureOf(page, LIVE[0].id)
    await bringIn(figure)
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    expect(new Set(await states(figure))).toEqual(new Set(['running']))
    // Past its rest at the top, the shots have moved up.
    await expect.poll(async () => (await shots(figure)).filter((s) => s.shown).every((s) => s.y < -5), { timeout: 10_000 }).toBe(true)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => states(figure)).toEqual(expect.not.arrayContaining(['running']))
  })

  test('a preview holds still while the pointer is over it or its link has focus', async ({ page }) => {
    await gotoHome(page)
    const product = LIVE[0]
    const figure = figureOf(page, product.id)
    const link = figure.getByRole('link', { name: `Visit ${domain(product.url!)}` })
    await bringIn(figure)
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    if (project() !== 'mobile') {
      await link.hover()
      await expect.poll(() => states(figure)).toEqual(expect.not.arrayContaining(['running']))
      await page.mouse.move(2, 2)
      await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    }
    await link.focus()
    await expect.poll(() => states(figure)).toEqual(expect.not.arrayContaining(['running']))
    await link.blur()
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
  })

  test('Pause stops a preview and Play starts it again', async ({ page }) => {
    await gotoHome(page)
    const product = LIVE[0]
    const figure = figureOf(page, product.id)
    await bringIn(figure)
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    await figure.getByRole('button', { name: `Pause the ${product.title} preview` }).click()
    await expect(figure.getByRole('button', { name: `Play the ${product.title} preview` })).toBeVisible()
    await page.mouse.move(2, 2)
    await sleep(500)
    expect(await states(figure)).toEqual(expect.not.arrayContaining(['running']))
    await figure.getByRole('button', { name: `Play the ${product.title} preview` }).click()
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
  })

  test('the private products show how they work: their own parts, wired with beams, and no screenshots', async ({ page }) => {
    await gotoHome(page)
    for (const product of FLOW) {
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      const group = figure.getByRole('group', { name: `How ${product.title} works` })
      await expect(group).toBeVisible()
      for (const node of product.flow!.nodes) {
        await expect(group.getByText(node.label, { exact: true })).toBeVisible()
        await expect(group.getByText(node.note, { exact: true })).toBeVisible()
      }
      await expect(figure.locator('img')).toHaveCount(0)
      // One beam per link, its pulse running while the diagram is on screen.
      const pulses = group.locator('svg path.motion-safe-only')
      await expect(pulses).toHaveCount(product.flow!.links.length)
      const play = () => pulses.evaluateAll((paths) => paths.map((p) => getComputedStyle(p).animationPlayState))
      await expect.poll(play).toEqual(product.flow!.links.map(() => 'running'))
      await figure.getByRole('button', { name: `Pause the ${product.title} diagram` }).click()
      await expect.poll(play).toEqual(product.flow!.links.map(() => 'paused'))
      await figure.getByRole('button', { name: `Play the ${product.title} diagram` }).click()
      await expect.poll(play).toEqual(product.flow!.links.map(() => 'running'))
      await expect(figure.locator('figcaption')).toContainText('Private, so no screenshots.')
    }
  })

  test('nothing below moves when the previews land', async ({ page }) => {
    // Hold back the previews' own chunk, measure, let it through, measure again.
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/_next/static/chunks/**', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-preview-screen')) await held
      await route.fulfill({ response, body })
    })
    await page.goto('/')
    await expect(page.locator('#products h3')).toHaveCount(4)
    await expect(page.locator('#experience')).toBeAttached()
    await sleep(800)
    expect(await page.locator('#products [data-preview]').count(), 'the previews are held back').toBe(0)
    const where = () =>
      page.evaluate(() => ({
        rows: [...document.querySelectorAll('#products > ol > li')].map((li) => Math.round((li as HTMLElement).offsetHeight)),
        next: Math.round(document.querySelector('#experience')!.getBoundingClientRect().top + window.scrollY),
      }))
    const before = await where()
    release()
    await expect(page.locator('#products [data-preview]')).toHaveCount(4, { timeout: 15_000 })
    await sleep(500)
    expect(await where()).toEqual(before)
  })
})

test.describe('the products act, laid out', () => {
  test.skip(() => project() !== 'desktop', 'One sweep of widths, in the resizable desktop window.')

  test('at every width: no sideways scroll, and every diagram inside its panel', async ({ page }) => {
    test.setTimeout(120_000)
    await gotoHome(page)
    for (const width of [320, 360, 390, 430, 600, 767, 768, 900, 1023, 1024, 1100, 1279, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(350)
      const report = await page.evaluate(() => ({
        sideways: document.documentElement.scrollWidth - window.innerWidth,
        panels: [...document.querySelectorAll('#products [data-preview="flow"] [role="group"]')].map((panel) => {
          const box = panel.getBoundingClientRect()
          const diagram = panel.querySelector('[data-flow-diagram]')!
          const cards = [...diagram.querySelectorAll(':scope > div > div')].map((c) => c.getBoundingClientRect())
          return {
            overflow: diagram.scrollHeight - diagram.clientHeight,
            outside: cards.filter((c) => c.top < box.top || c.bottom > box.bottom || c.left < box.left || c.right > box.right).length,
          }
        }),
      }))
      expect(report.sideways, `${width}px: sideways scroll`).toBeLessThanOrEqual(0)
      for (const [i, panel] of report.panels.entries()) {
        expect(panel.overflow, `${width}px: diagram ${i + 1} overflows`).toBeLessThanOrEqual(1)
        expect(panel.outside, `${width}px: cards outside diagram ${i + 1}`).toBe(0)
      }
    }
  })
})

test.describe('the products act, under reduced motion', () => {
  test('nothing moves: the shots show the top of each page, the beams hold still, and there is nothing to pause', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    for (const product of LIVE) {
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      await expect.poll(async () => (await shots(figure)).filter((s) => s.shown).every((s) => s.loaded), { timeout: 15_000 }).toBe(true)
    }
    await sleep(3500)
    for (const product of LIVE) {
      const all = (await shots(figureOf(page, product.id))).filter((s) => s.shown)
      expect(all.map((s) => [s.state, s.y]), product.id).toEqual(all.map(() => ['none', 0]))
    }
    for (const product of FLOW) {
      const pulses = figureOf(page, product.id).locator('svg path.motion-safe-only')
      await expect(pulses).toHaveCount(product.flow!.links.length)
      expect(await pulses.evaluateAll((paths) => paths.map((p) => getComputedStyle(p).animationName))).toEqual(
        product.flow!.links.map(() => 'none'),
      )
    }
    await expect(page.locator('#products').getByRole('button', { name: /^(Pause|Play) the / })).toHaveCount(0)
  })
})
