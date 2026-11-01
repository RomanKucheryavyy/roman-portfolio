import { expect, test, type Locator, type Page } from '@playwright/test'
import { isChain } from '@/components/stage/preview-box'
import { PRODUCTS, type FlowNode } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { monthYear } from '@/lib/site-facts'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act II, his own products: the public ones' live previews (real
 * screenshots scrolling in a browser and a phone frame, together at every
 * width) and the private ones' inscriptions (their parts, in their
 * descriptions' words, no boxes and no lines). Runs in all three projects;
 * the hover and the layout sweep only where a mouse and a resizable window
 * make sense.
 */

const LIVE = PRODUCTS.filter((p) => p.preview && p.url)
const FLOW = PRODUCTS.filter((p) => p.flow)
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
const nameOf = (node: FlowNode) => (node.count ? `${node.count.word} ${node.label}` : node.label)
const words = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()

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
      // The browser and the phone, at every width.
      expect(shown.map((s) => s.alt)).toEqual([
        `Screenshot of ${domain(product.url!)} in a desktop browser`,
        `Screenshot of ${domain(product.url!)} on a phone`,
      ])
      // Real files, not a drawing: each shown <img> has decoded pixels.
      expect(shown.every((s) => s.loaded)).toBe(true)
      // One quiet line: the site and when the shots were taken.
      await expect(figure.locator('figcaption > span')).toHaveText(`${domain(product.url!)} · ${monthYear(product.preview!.captured)}`)
      // One composition at every width, a phone's too: the phone overlapping
      // the browser's lower corner, both inside the preview, nothing boxed.
      const frames = await figure.locator('a[aria-label^="Visit"]').evaluate((a) => {
        const [browser, phone] = [...a.querySelectorAll('[data-preview-screen]')].map((s) => s.parentElement!.getBoundingClientRect())
        const stage = a.getBoundingClientRect()
        return {
          overlap: browser.left < phone.right && phone.left < browser.right && browser.top < phone.bottom && phone.top < browser.bottom,
          lower: phone.bottom > browser.bottom,
          inside: [browser, phone].every((r) => r.left >= stage.left - 1 && r.right <= stage.right + 1 && r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1),
          phoneShare: phone.width / stage.width,
        }
      })
      expect(frames, product.id).toEqual({ overlap: true, lower: true, inside: true, phoneShare: expect.any(Number) })
      expect(frames.phoneShare, `${product.id}: the phone reads as a phone`).toBeGreaterThanOrEqual(0.25)
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
    await expect.poll(still).toEqual(['paused 0', 'paused 0'])
    // In view, it plays; then off screen, it goes back to the start of its loop.
    await bringIn(figure)
    await expect.poll(() => states(figure)).toEqual(expect.arrayContaining(['running']))
    await sleep(1500)
    expect((await shots(figure)).filter((s) => s.shown).every((s) => s.time > 1000)).toBe(true)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(still).toEqual(['paused 0', 'paused 0'])
  })

  test("a preview's browser and phone share one loop, so they reach each end of the page together", async ({ page }) => {
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

  test("the private products are set as inscriptions of their parts: their descriptions' words, no boxes, no lines, no screenshots", async ({ page }) => {
    await gotoHome(page)
    for (const product of FLOW) {
      const flow = product.flow!
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      const group = figure.getByRole('group', { name: `The parts of ${product.title}` })
      await expect(group).toBeVisible()
      // Every part's name and what it does, the product's own line, and the
      // description's words that lead into a part, all on screen.
      await expect(group.getByText(flow.hub, { exact: true })).toBeVisible()
      for (const node of flow.nodes) {
        await expect(group.getByText(node.label, { exact: true })).toBeVisible()
        await expect(group.getByText(node.note, { exact: true })).toBeVisible()
        if (node.lead) await expect(group.getByText(node.lead, { exact: true })).toBeVisible()
        // A count the description spells out stands as its numeral, which
        // screen readers skip for the word itself.
        if (node.count) {
          const numeral = group.getByText(toRoman(node.count.value), { exact: true })
          await expect(numeral).toBeVisible()
          await expect(numeral).toHaveAttribute('aria-hidden', 'true')
          await expect(group.locator('span.sr-only', { hasText: node.count.word })).toHaveCount(1)
        }
      }
      // Nothing on it that isn't the description's (or the product's own name).
      const description = words(product.description)
      const shown = await group.evaluate((el) =>
        [...el.querySelectorAll<HTMLElement>('p')]
          .filter((p) => !p.closest('[aria-hidden="true"], .sr-only') && p.getAttribute('aria-hidden') !== 'true')
          .flatMap((p) => p.innerText.split('·'))
          .map((t) => t.trim())
          .filter(Boolean),
      )
      expect(shown.length, product.id).toBeGreaterThan(0)
      for (const text of shown) expect(text === product.title || description.includes(words(text)), `${product.id}: "${text}"`).toBe(true)
      // The links, for screen readers too (the reading order carries them on screen).
      const name = (id: string) => (id === product.id ? product.title : nameOf(flow.nodes.find((n) => n.id === id)!))
      await expect(group.locator('ul.sr-only li')).toHaveText(flow.links.map(([from, to]) => `From ${name(from)} to ${name(to)}`))
      // ...and the reading order follows them. A chain: each link's start
      // before its end, numbered I, II, III... in that order. A desk: the
      // product's own line, then the parts that work into it, then what it
      // works through.
      const order = await group.evaluate((el) => (el as HTMLElement).innerText.toLowerCase())
      const at = (id: string) => order.indexOf((id === product.id ? (isChain(flow) ? product.title : flow.hub) : flow.nodes.find((n) => n.id === id)!.label).toLowerCase())
      if (isChain(flow)) {
        for (const [from, to] of flow.links) expect(at(from), `${product.id}: ${from} before ${to}`).toBeLessThan(at(to))
        await expect(group.locator('li > span[aria-hidden="true"]')).toHaveText(Array.from({ length: flow.links.length + 1 }, (_, i) => toRoman(i + 1)))
      } else {
        const into = flow.links.filter(([, to]) => to === product.id).map(([from]) => from)
        const out = flow.links.filter(([from]) => from === product.id).map(([, to]) => to)
        for (const part of into) {
          expect(at(product.id), `${product.id}: the desk before ${part}`).toBeLessThan(at(part))
          for (const next of out) expect(at(part), `${product.id}: ${part} before ${next}`).toBeLessThan(at(next))
        }
      }
      // No screenshots, no drawings, no boxes, no rules.
      await expect(figure.locator('img')).toHaveCount(0)
      await expect(group.locator('svg')).toHaveCount(0)
      const edged = await group.evaluate((el) =>
        [el, ...el.querySelectorAll('*')].filter((n) => {
          const cs = getComputedStyle(n)
          return ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 && cs.getPropertyValue(`border-${side.toLowerCase()}-style`) !== 'none') || cs.outlineStyle !== 'none'
        }).length,
      )
      expect(edged, `${product.id}: elements with an edge`).toBe(0)
    }
  })

  test("a chain pulses down while on screen, and its Pause stops it; a desk only moves as it arrives, so it has none", async ({ page }) => {
    await gotoHome(page)
    for (const product of FLOW) {
      const figure = figureOf(page, product.id)
      const steps = figure.locator('[data-pulse]')
      const looping = () => steps.evaluateAll((els) => els.map((el) => el.getAnimations().some((a) => a.effect?.getTiming().iterations === Infinity && a.playState === 'running')))
      const lit = () => steps.evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))
      if (!isChain(product.flow!)) {
        await bringIn(figure)
        await expect(steps).toHaveCount(0)
        await expect(figure.getByRole('button')).toHaveCount(0)
        continue
      }
      const count = product.flow!.links.length + 1
      // Off screen at the top of the page: still, every step whole.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(looping).toEqual(Array(count).fill(false))
      await bringIn(figure)
      await expect.poll(looping, { timeout: 10_000 }).toEqual(Array(count).fill(true))
      // Each step dims and lights in turn, never below the words' AA floor (0.55).
      const seen = new Set<number>()
      for (let i = 0; i < 24; i++) {
        const now = await lit()
        expect(Math.min(...now), 'a dimmed step stays readable').toBeGreaterThanOrEqual(0.54)
        seen.add(now.indexOf(Math.max(...now)))
        await sleep(200)
      }
      expect(seen.size, 'the light passes down the chain').toBeGreaterThanOrEqual(3)
      await figure.getByRole('button', { name: `Pause the ${product.title} pulse` }).click()
      await expect.poll(looping).toEqual(Array(count).fill(false))
      await expect.poll(lit).toEqual(Array(count).fill(1))
      await figure.getByRole('button', { name: `Play the ${product.title} pulse` }).click()
      await expect.poll(looping).toEqual(Array(count).fill(true))
      // Off screen again: it stops.
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(looping).toEqual(Array(count).fill(false))
    }
  })

  test('an inscription rises in, line by line, as it arrives (the count struck in), and never hides what is on screen', async ({ page }) => {
    await gotoHome(page)
    const product = FLOW.find((p) => p.flow!.nodes.some((n) => n.count))!
    const figure = figureOf(page, product.id)
    // Just below the screen: its lines are held at their first frame.
    await figure.evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().top - window.innerHeight - 40, behavior: 'instant' }))
    await sleep(300)
    const lines = () => figure.locator('[data-line]').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))
    expect(Math.max(...(await lines())), 'held below the screen').toBe(0)
    await bringIn(figure)
    // Then they come in, and let go: whole, with nothing left running.
    await expect.poll(lines, { timeout: 6000 }).toEqual((await lines()).map(() => 1))
    await expect.poll(() => figure.locator('[data-line], [data-strike]').evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length)).toBe(0)
  })

  test('an inscription that arrives already on screen is whole at once, with no entrance', async ({ page }) => {
    // Hold back the previews' chunk, bring the row on screen (the block
    // holding the inscription's place is the same size), then let it land there.
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route('**/_next/static/chunks/**', async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-preview-screen')) await held
      await route.fulfill({ response, body })
    })
    await page.goto('/')
    const product = FLOW.find((p) => p.flow!.nodes.some((n) => n.count))!
    await expect(page.locator('#products h3')).toHaveCount(4)
    await page.locator('#products li', { has: page.locator('h3', { hasText: product.title }) }).getByText(product.description).scrollIntoViewIfNeeded()
    await sleep(300)
    release()
    const figure = figureOf(page, product.id)
    await expect(figure.locator('[data-line]').first()).toBeAttached({ timeout: 30_000 })
    const lines = () => figure.locator('[data-line]').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)))
    for (let i = 0; i < 6; i++) {
      expect(Math.min(...(await lines())), 'nothing on screen is hidden to be brought in').toBe(1)
      await sleep(100)
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

  test("at every width: no sideways scroll, every inscription inside its block, and each preview's browser and phone together", async ({ page }) => {
    test.setTimeout(120_000)
    // Layout only: no entrance holding the inscriptions' lines off their places.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    for (const width of [320, 335, 340, 355, 360, 365, 375, 390, 400, 430, 600, 767, 768, 900, 1023, 1024, 1100, 1150, 1279, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(400)
      const report = await page.evaluate(() => ({
        sideways: document.documentElement.scrollWidth - window.innerWidth,
        blocks: [...document.querySelectorAll('#products [data-preview="flow"] [role="group"]')].map((block) => {
          const box = block.getBoundingClientRect()
          const texts = [...block.querySelectorAll('p, li')].filter((n) => !n.closest('.sr-only')).map((n) => n.getBoundingClientRect())
          return {
            outside: texts.filter((r) => r.top < box.top - 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.right > box.right + 1).length,
            // Its words in the middle of the block: the room above and below them, within a line of each other.
            room: [texts.length ? Math.min(...texts.map((r) => r.top)) - box.top : 0, texts.length ? box.bottom - Math.max(...texts.map((r) => r.bottom)) : 0],
          }
        }),
        previews: [...document.querySelectorAll('#products [data-preview="live"] a')].map((a) => {
          const [browser, phone] = [...a.querySelectorAll('[data-preview-screen]')].map((s) => s.parentElement!.getBoundingClientRect())
          const stage = a.getBoundingClientRect()
          return {
            shown: [browser.width > 0, phone.width > 0],
            overlap: browser.left < phone.right && phone.left < browser.right && browser.top < phone.bottom && phone.top < browser.bottom,
            inside: [browser, phone].every((r) => r.left >= stage.left - 1 && r.right <= stage.right + 1 && r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1),
          }
        }),
      }))
      expect(report.sideways, `${width}px: sideways scroll`).toBeLessThanOrEqual(0)
      for (const [i, block] of report.blocks.entries()) {
        expect(block.outside, `${width}px: words outside inscription ${i + 1}`).toBe(0)
        expect(Math.min(...block.room), `${width}px: inscription ${i + 1} fills its block`).toBeGreaterThanOrEqual(0)
        expect(Math.abs(block.room[0] - block.room[1]), `${width}px: inscription ${i + 1} centred`).toBeLessThanOrEqual(24)
      }
      for (const [i, preview] of report.previews.entries()) {
        expect(preview.shown, `${width}px: preview ${i + 1} shows the browser and the phone`).toEqual([true, true])
        expect(preview.overlap, `${width}px: preview ${i + 1}'s phone overlaps its browser`).toBe(true)
        expect(preview.inside, `${width}px: preview ${i + 1}'s frames inside its stage`).toBe(true)
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
      // Where it lives and its status, one quiet line at the page's 12px floor
      // (two on a phone); its number in Roman numerals.
      const eyebrow = card.locator('.om-eyebrow')
      await expect(eyebrow).toContainText(product.url ? domain(product.url).replace(/^www\./, '') : 'Private')
      await expect(eyebrow).toContainText(product.status)
      expect(parseFloat(await eyebrow.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12)
      await expect(card.locator('.om-brand')).toHaveText(toRoman(PRODUCTS.indexOf(product) + 1))
      // No ornaments: no pills, no stars, no rules; and no stage light: no
      // spotlight on the pointer...
      for (const part of ['.om-pill', '.om-star', '.om-rule', '.om-spot']) {
        const shown = await card.locator(part).evaluateAll((els) => els.filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none').length)
        expect(shown, `${product.id}: ${part} shown`).toBe(0)
      }
      // ...and no shafts from above: the light's canvas holds only its
      // drifting dust (shafts would light a third of it).
      const lit = await card.locator('canvas.om-light').evaluate((canvas: HTMLCanvasElement) => {
        const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
        return n / (data.length / 4)
      })
      expect(lit, `${product.id}: share of the light's canvas lit`).toBeLessThan(0.03)
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

  test('the four words share one scale: a long title on two lines, none more than 1.4 times another, each inside its card', async ({ page }) => {
    await gotoHome(page)
    const sizes: number[] = []
    for (const product of PRODUCTS) {
      const card = cardOf(page, product.id)
      await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(card.locator('.om-root[data-phase="landing"]')).toBeAttached({ timeout: 20_000 })
      // Its letters set (on a busy machine they can rise in as the card mounts).
      await expect
        .poll(() => card.locator('.om-l').evaluateAll((els) => els.every((el) => getComputedStyle(el).transform === 'none' && getComputedStyle(el).opacity === '1')))
        .toBe(true)
      const word = await card.evaluate((el) => {
        const box = el.getBoundingClientRect()
        const letters = [...el.querySelectorAll('.om-l')].map((l) => l.getBoundingClientRect())
        const size = parseFloat(getComputedStyle(el.querySelector('.om-word')!).fontSize)
        return {
          size,
          lines: new Set(letters.map((r) => Math.round(r.top))).size,
          // Each letter's box, which runs below its capitals' baseline by its face's descent.
          inside: letters.every((r) => r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom + 0.3 * size),
        }
      })
      expect(word.lines, `${product.id}: lines`).toBe(product.title.includes(' ') ? 2 : 1)
      expect(word.inside, `${product.id}: the word inside its card`).toBe(true)
      sizes.push(word.size)
    }
    expect(Math.max(...sizes) / Math.min(...sizes), `word sizes ${sizes.join(', ')}`).toBeLessThanOrEqual(1.4)
  })

  test('on a phone a card scrolls in composed and lands within 1.5 s of arriving', async ({ page }) => {
    test.skip(project() !== 'mobile', 'A phone mounts its card ahead and opens it on its landing.')
    await gotoHome(page)
    const card = cardOf(page, PRODUCTS[2].id)
    // Just below the screen: already mounted, its word and its eyebrow up, its entrance held.
    await card.evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().top - window.innerHeight - 60, behavior: 'instant' }))
    await expect(card.locator('.om-root')).toBeAttached({ timeout: 20_000 })
    await expect(card.locator('[data-arrived="false"]')).toBeAttached()
    await expect(card.locator('.om-root')).toHaveAttribute('data-phase', 'landing')
    await expect.poll(() => card.locator('.om-l').evaluateAll((els) => Math.min(...els.map((el) => Number(getComputedStyle(el).opacity))))).toBe(1)
    // Arrived: the light, the statue and the tagline are all in within 1.5 s.
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const t0 = Date.now()
    const landed = () =>
      card.evaluate((el) => {
        const op = (sel: string) => [...el.querySelectorAll(sel)].map((n) => Number(getComputedStyle(n).opacity))
        const fig = el.querySelector('.om-fig')
        return (
          el.querySelector('[data-arrived="true"]') !== null &&
          !!fig &&
          Math.min(...op('.om-fig')) >= 0.99 &&
          Math.abs(new DOMMatrix(getComputedStyle(fig).transform).m42) < 2 &&
          Math.min(...op('.om-tagline span')) >= 0.99 &&
          getComputedStyle(el.querySelector('.om-flood')!).clipPath.startsWith('circle(120%')
        )
      })
    await expect.poll(landed, { timeout: 1500, intervals: [100] }).toBe(true)
    expect(Date.now() - t0).toBeLessThanOrEqual(1700)
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
  test('nothing moves: the shots show the top of each page, the inscriptions stand whole and still, and there is nothing to pause', async ({ page }) => {
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
      const figure = figureOf(page, product.id)
      await bringIn(figure)
      await sleep(1500)
      const still = await figure.locator('[data-line]').evaluateAll((els) => els.map((el) => [Number(getComputedStyle(el).opacity), el.getAnimations({ subtree: true }).length]))
      expect(still, product.id).toEqual(still.map(() => [1, 0]))
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
    // A phone's entrance is not armed either: nothing is held back.
    await expect(card.locator('[data-arrived]')).toHaveCount(0)
  })
})
