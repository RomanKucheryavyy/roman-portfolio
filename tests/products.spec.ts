import { expect, test, type Locator, type Page } from '@playwright/test'
import { PRODUCTS } from '@/lib/content'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act II, his own products: the public ones' live previews (real
 * screenshots scrolling in a browser and a phone frame) and the private
 * ones' diagrams (their parts around them). Runs in all three projects; the
 * hover and the layout sweep only where a mouse and a resizable window make
 * sense.
 */

const LIVE = PRODUCTS.filter((p) => p.preview && p.url)
const FLOW = PRODUCTS.filter((p) => p.flow)
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const figureOf = (page: Page, id: string) => page.locator(`#products figure[data-product="${id}"]`)

/** Each shot in a figure: shown at all, how its scroll animation stands, where it is in its loop, and how far it has moved. */
function shots(figure: Locator) {
  return figure.locator('img').evaluateAll((imgs) =>
    (imgs as HTMLImageElement[]).map((img) => {
      const scroll = img.getAnimations()[0]
      return {
        alt: img.alt,
        shown: img.getBoundingClientRect().width > 0,
        loaded: img.complete && img.naturalWidth > 0,
        state: scroll?.playState ?? 'none',
        time: Number(scroll?.currentTime ?? 0),
        loop: Number(scroll?.effect?.getTiming().duration ?? 0),
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

  test("a preview waits until most of it is in view, and starts again from the top of the page after leaving", async ({ page }) => {
    await gotoHome(page)
    const figure = figureOf(page, LIVE[1].id)
    // Only its top edge showing, at the bottom of the screen: it holds still, at the top.
    await figure.evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().top - (window.innerHeight - 70), behavior: 'instant' }))
    await sleep(800)
    const still = async () => (await shots(figure)).filter((s) => s.shown).map((s) => `${s.state} ${s.time}`)
    await expect.poll(still).toEqual(project() === 'mobile' ? ['paused 0'] : ['paused 0', 'paused 0'])
    // In view, it plays; then off screen, it goes back to the start of its loop.
    await bringIn(figure)
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    await sleep(1500)
    expect((await shots(figure)).filter((s) => s.shown).every((s) => s.time > 1000)).toBe(true)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(still).toEqual(project() === 'mobile' ? ['paused 0'] : ['paused 0', 'paused 0'])
  })

  test("a preview's browser and phone share one loop, so they reach each end of the page together", async ({ page }) => {
    test.skip(project() === 'mobile', 'Below md the phone shows alone.')
    await gotoHome(page)
    for (const product of LIVE) {
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      await expect.poll(() => states(figure)).toEqual(['running', 'running'])
      const [desktop, phone] = (await shots(figure)).filter((s) => s.shown)
      expect(desktop.loop, product.id).toBeGreaterThan(0)
      expect(phone.loop, product.id).toBe(desktop.loop)
      expect(Math.abs(phone.time - desktop.time), product.id).toBeLessThan(50)
    }
  })

  test('a preview plays when it arrives in view with an older observation in the same batch', async ({ page }) => {
    // Scrolled to as it mounts, on a busy page, one IntersectionObserver
    // batch can hold both the preview's first, off-screen entry and its
    // on-screen one. Make every batch that brings a preview on screen look
    // like that: the last entry is where it is now, and it must play.
    await page.addInitScript(() => {
      const Native = window.IntersectionObserver
      window.IntersectionObserver = class extends Native {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super((entries, observer) => {
            const batch = entries.flatMap((entry) => {
              if (!entry.isIntersecting || !entry.target.matches('figure[data-preview]')) return [entry]
              const stale = {
                target: entry.target,
                time: entry.time - 16,
                isIntersecting: false,
                intersectionRatio: 0,
                rootBounds: entry.rootBounds,
                boundingClientRect: entry.boundingClientRect,
                intersectionRect: new DOMRectReadOnly(),
              }
              return [stale as IntersectionObserverEntry, entry]
            })
            callback(batch, observer)
          }, options)
        }
      }
    })
    await page.goto('/')
    await expect(page.locator('#products [data-preview]')).toHaveCount(4, { timeout: 30_000 })
    const figure = figureOf(page, LIVE[0].id)
    await bringIn(figure)
    await expect.poll(() => states(figure), { timeout: 10_000 }).toEqual(expect.arrayContaining(['running']))
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

  test('the private products show their parts around them, wired with beams, and no screenshots', async ({ page }) => {
    await gotoHome(page)
    for (const product of FLOW) {
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      const group = figure.getByRole('group', { name: `The parts of ${product.title}` })
      await expect(group).toBeVisible()
      await expect(group.locator('[data-flow-hub]')).toContainText(product.title)
      await expect(group.getByText(product.flow!.hub, { exact: true })).toBeVisible()
      for (const node of product.flow!.nodes) {
        await expect(group.getByText(node.label, { exact: true })).toBeVisible()
        await expect(group.getByText(node.note, { exact: true })).toBeVisible()
      }
      // The links, for screen readers too (the beams are drawn only).
      const name = (id: string) => (id === product.id ? product.title : product.flow!.nodes.find((n) => n.id === id)!.label)
      await expect(group.locator('ul.sr-only li')).toHaveText(product.flow!.links.map(([from, to]) => `From ${name(from)} to ${name(to)}`))
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
      await expect(figure.locator('figcaption')).toHaveText(/^Private, so no screenshots\. Its parts, in its own words\./)
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

  test('at every width: no sideways scroll, every diagram inside its panel, and every beam in the open', async ({ page }) => {
    test.setTimeout(120_000)
    await gotoHome(page)
    for (const width of [320, 360, 390, 430, 600, 767, 768, 900, 1023, 1024, 1100, 1150, 1279, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(400)
      const report = await page.evaluate(() => ({
        sideways: document.documentElement.scrollWidth - window.innerWidth,
        panels: [...document.querySelectorAll('#products [data-preview="flow"] [role="group"]')].map((panel) => {
          const box = panel.getBoundingClientRect()
          const diagram = panel.querySelector('[data-flow-diagram]')!
          const cards = [...diagram.querySelectorAll('[data-flow-node]')].map((c) => c.getBoundingClientRect())
          const inside = (c: DOMRect) => c.top >= box.top && c.bottom <= box.bottom && c.left >= box.left && c.right <= box.right
          const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
          // Each beam's track, sampled: its length, and the share of it no card covers.
          const beams = [...diagram.querySelectorAll(':scope > svg > path:not(.motion-safe-only)')].map((path) => {
            const track = path as SVGPathElement
            const svg = track.ownerSVGElement!.getBoundingClientRect()
            const length = track.getTotalLength()
            let open = 0
            for (let i = 0; i <= 50; i++) {
              const at = track.getPointAtLength((length * i) / 50)
              const x = svg.left + at.x
              const y = svg.top + at.y
              if (!cards.some((c) => x > c.left + 1 && x < c.right - 1 && y > c.top + 1 && y < c.bottom - 1)) open++
            }
            return { length, open: open / 51 }
          })
          return {
            overflow: diagram.scrollHeight - diagram.clientHeight,
            outside: cards.filter((c) => !inside(c)).length,
            overlapping: cards.filter((c, i) => cards.some((d, j) => j > i && overlaps(c, d))).length,
            beams,
          }
        }),
      }))
      expect(report.sideways, `${width}px: sideways scroll`).toBeLessThanOrEqual(0)
      for (const [i, panel] of report.panels.entries()) {
        expect(panel.overflow, `${width}px: diagram ${i + 1} overflows`).toBeLessThanOrEqual(1)
        expect(panel.outside, `${width}px: cards outside diagram ${i + 1}`).toBe(0)
        expect(panel.overlapping, `${width}px: cards overlapping in diagram ${i + 1}`).toBe(0)
        expect(panel.beams.length, `${width}px: beams in diagram ${i + 1}`).toBe(FLOW[i].flow!.links.length)
        for (const [j, beam] of panel.beams.entries()) {
          expect(beam.length, `${width}px: diagram ${i + 1}, beam ${j + 1} long enough to see`).toBeGreaterThanOrEqual(36)
          expect(beam.open, `${width}px: diagram ${i + 1}, beam ${j + 1} out from under the cards`).toBeGreaterThanOrEqual(0.9)
        }
      }
    }
  })
})

test.describe('the title cards', () => {
  const cardOf = (page: Page, id: string) => page.locator(`#products [data-title-card="${id}"]`)

  test('each product opens on its title card: its own words, hidden from assistive tech, nothing to focus, images from this origin', async ({ page }) => {
    await gotoHome(page)
    await expect(page.locator('#products [data-title-card]')).toHaveCount(PRODUCTS.length)
    for (const product of PRODUCTS) {
      const card = cardOf(page, product.id)
      await expect(card).toHaveAttribute('aria-hidden', 'true')
      await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(card.locator('.om-root[data-phase="landing"]')).toBeAttached({ timeout: 20_000 })
      await expect(card.locator('.om-word')).toContainText(product.title)
      await expect(card.locator('.om-tagline')).toHaveText(product.tagline)
      await expect(card.locator('.om-pill').first()).toHaveText(product.status)
      await expect(card).toContainText(product.url ? domain(product.url).replace(/^www\./, '') : 'Private')
      const reachable = await card.evaluate((el) =>
        [...el.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex]')]
          .filter((n) => n.tabIndex >= 0 && n.getClientRects().length > 0)
          .map((n) => n.outerHTML.slice(0, 80)),
      )
      expect(reachable, `${product.id}: focusable in its card`).toEqual([])
      const sources = await card.evaluate((el) => [...el.querySelectorAll('img')].map((img) => img.currentSrc || img.src))
      for (const src of sources) expect(new URL(src).origin, src).toBe(new URL(page.url()).origin)
    }
  })

  test('a card plays when it arrives and stops once it has left; nothing below moves when it mounts', async ({ page }) => {
    await gotoHome(page)
    const product = PRODUCTS[0]
    const card = cardOf(page, product.id)
    const row = page.locator('#products li', { has: page.locator('h3', { hasText: product.title }) }).getByText(product.description)
    // Off screen at the top of the page: a block of its own height, no stage.
    await expect(card).toHaveAttribute('data-live', 'false')
    const before = await card.evaluate((el) => el.getBoundingClientRect().height)
    const offset = async () => {
      const [c, r] = await Promise.all([card.boundingBox(), row.boundingBox()])
      return Math.round(r!.y - c!.y)
    }
    const gapBefore = await offset()
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(card).toHaveAttribute('data-live', 'true')
    await expect(card.locator('.om-root')).toBeAttached({ timeout: 20_000 })
    // It opens on its own word filling in, not on the intro's count.
    await expect(card.locator('.om-counter')).toBeHidden()
    expect(await card.evaluate((el) => el.getBoundingClientRect().height)).toBe(before)
    expect(await offset()).toBe(gapBefore)
    // Gone from the screen: the stage unmounts.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(card).toHaveAttribute('data-live', 'false')
    await expect(card.locator('.om-root')).toHaveCount(0)
  })

  test('a swipe or wheel over a card scrolls the page, and the row below keeps the heading (for screen readers) and the link', async ({ page }) => {
    test.skip(project() === 'mobile', 'touch.spec swipes on a card.')
    await gotoHome(page)
    const card = cardOf(page, PRODUCTS[0].id)
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(card.locator('.om-root')).toBeAttached({ timeout: 20_000 })
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const y0 = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 400)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0 + 200)
    // The card is a picture; the row below it is the product.
    const row = page.locator('#products li', { has: page.locator('h3', { hasText: PRODUCTS[0].title }) }).first()
    await expect(row.getByRole('heading', { level: 3, name: PRODUCTS[0].title, exact: true })).toHaveCount(1)
    await expect(row.getByText(PRODUCTS[0].description)).toBeVisible()
    if (PRODUCTS[0].url) await expect(row.getByRole('link', { name: domain(PRODUCTS[0].url), exact: true })).toBeVisible()
  })

  test('a row doesn\'t repeat its card: the name, tagline, number and status are there for screen readers only', async ({ page }) => {
    await gotoHome(page)
    for (const product of PRODUCTS) {
      const row = page.locator('#products li', { has: page.locator('h3', { hasText: product.title }) }).first()
      const words = row.locator('.sr-only').filter({ has: page.locator('h3') })
      await expect(words.locator('h3')).toHaveText(product.title)
      await expect(words).toContainText(product.tagline)
      await expect(words).toContainText(`Status: ${product.status}`)
      // Clipped to nothing: on screen, the card above says them.
      const box = await words.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return { w: r.width, h: r.height }
      })
      expect(box.w * box.h, `${product.id}: the row's own copy of the card's words takes no room`).toBeLessThanOrEqual(1)
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

  test('a title card opens straight on its still landing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    const card = page.locator(`#products [data-title-card="${PRODUCTS[0].id}"]`)
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const root = card.locator('.om-root')
    await expect(root).toBeAttached({ timeout: 20_000 })
    // No load: it is on the landing within a moment of mounting (a playing
    // card holds its load for 1.8 s at least). The intro's count, barcode and
    // plate are the intro's alone: never shown on a card.
    await expect(root).toHaveAttribute('data-phase', 'landing', { timeout: 600 })
    await expect(root).toHaveAttribute('aria-busy', 'false', { timeout: 600 })
    for (const part of ['.om-counter', '.om-bars', '.om-plate']) await expect(card.locator(part)).toBeHidden()
  })
})
