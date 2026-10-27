import { expect, test, type Page } from '@playwright/test'
import { PRODUCTS } from '@/lib/content'
import { collectConsole, gotoHome } from './helpers'

const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * The keyboard-only pass, as a test. Tab through each page from the top the
 * way a keyboard user does, and at every stop check what they would see:
 *
 * - the first stop is "Skip to content";
 * - the focused element is not transparent (no ancestor at opacity 0) and
 *   not visibility:hidden;
 * - it has a visible indicator: some part of how it is drawn (its outline,
 *   ring, border, background or colour, or its parent's focus-within ring)
 *   differs from the same element unfocused, and an outline that is the
 *   indicator is actually drawn;
 * - it has a non-empty accessible name;
 * - once the page has scrolled to it, it is inside the viewport and not
 *   under the Stage's fixed top bar, nor painted over by anything else.
 *
 * On the home page the walk must pass Send, the end of the page's one job,
 * and goes on to the end of the footer. Every route is walked until focus
 * leaves the page. It runs in all three projects: desktop and no-webgl at
 * 1440, mobile at 390.
 */

const MAX_STOPS = 250

interface Look {
  outlineStyle: string
  outlineWidth: string
  outlineColor: string
  boxShadow: string
  borderColor: string
  backgroundColor: string
  color: string
  textDecorationLine: string
  parentBoxShadow: string
  parentOutlineStyle: string
}

interface Stop {
  n: number
  what: string
  opacity: number
  visibility: string
  inViewport: boolean
  underNav: boolean
  /** What is painted over the middle of it, if anything is. */
  coveredBy: string | null
  focused: Look
}

/**
 * Waits until the focused element (and its parent, for a focus-within ring)
 * has no running transition: most indicators fade in (transition-colors), and
 * read at the first frame a pill's white fill is still transparent.
 */
async function settleFocus(page: Page) {
  await page
    .waitForFunction(
      () => {
        const el = document.activeElement
        if (!el || el === document.body) return true
        const running = (node: Element | null) => !!node && node.getAnimations().some((a) => a.playState === 'running' && a instanceof CSSTransition)
        return !running(el) && !running(el.parentElement)
      },
      undefined,
      { timeout: 2000, polling: 50 },
    )
    .catch(() => {}) // an endless transition is read as it stands
}

/** How the focused element is drawn, read in the page. Also tags it data-kw=<n> for the unfocused read. */
async function readStop(page: Page, n: number): Promise<Stop | null> {
  await settleFocus(page)
  return page.evaluate((n) => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body || el === document.documentElement) return null
    el.setAttribute('data-kw', String(n))
    const look = (node: Element): Look => {
      const s = getComputedStyle(node)
      const p = node.parentElement ? getComputedStyle(node.parentElement) : null
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
        borderColor: `${s.borderTopColor} ${s.borderRightColor} ${s.borderBottomColor} ${s.borderLeftColor}`,
        backgroundColor: s.backgroundColor,
        color: s.color,
        textDecorationLine: s.textDecorationLine,
        parentBoxShadow: p?.boxShadow ?? 'none',
        parentOutlineStyle: p?.outlineStyle ?? 'none',
      }
    }
    let opacity = 1
    for (let node: Element | null = el; node; node = node.parentElement) opacity *= parseFloat(getComputedStyle(node).opacity)
    const r = el.getBoundingClientRect()
    const inViewport = r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
    // Under the fixed top bar: the middle of the element's part inside the
    // viewport belongs to the bar. (The bar's own items are, of course, fine.)
    const nav = Array.from(document.querySelectorAll('header')).find((h) => getComputedStyle(h).position === 'fixed') ?? null
    const [left, right] = [Math.max(r.left, 0), Math.min(r.right, innerWidth)]
    const [top0, bottom] = [Math.max(r.top, 0), Math.min(r.bottom, innerHeight)]
    const hit = document.elementFromPoint(Math.min((left + right) / 2, innerWidth - 1), Math.min((top0 + bottom) / 2, innerHeight - 1))
    const underNav = !!nav && !nav.contains(el) && !!hit && nav.contains(hit)
    // Painted over. elementFromPoint skips inert subtrees, so for this one
    // read the page is not inert anywhere and the hit is what is drawn on
    // top. The attribute goes back before the frame ends.
    const inert = Array.from(document.querySelectorAll<HTMLElement>('[inert]'))
    for (const node of inert) node.inert = false
    const top = document.elementFromPoint(Math.min((left + right) / 2, innerWidth - 1), Math.min((top0 + bottom) / 2, innerHeight - 1))
    for (const node of inert) node.inert = true
    const coveredBy =
      top && !el.contains(top) && !top.contains(el) && !(nav && nav.contains(top))
        ? `${top.tagName.toLowerCase()}${top.closest('section[id]') ? ` in #${top.closest('section[id]')!.id}` : ''}`
        : null
    const name = el.getAttribute('aria-label') || (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return {
      n,
      what: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${name}"`,
      opacity,
      visibility: getComputedStyle(el).visibility,
      inViewport,
      underNav,
      coveredBy,
      focused: look(el),
    }
  }, n)
}

/** The same elements' looks with nothing focused. Missing means the node was replaced since. */
async function readUnfocused(page: Page): Promise<Record<string, Look>> {
  return page.evaluate(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    const out: Record<string, Look> = {}
    for (const el of Array.from(document.querySelectorAll('[data-kw]'))) {
      const s = getComputedStyle(el)
      const p = el.parentElement ? getComputedStyle(el.parentElement) : null
      out[el.getAttribute('data-kw')!] = {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
        borderColor: `${s.borderTopColor} ${s.borderRightColor} ${s.borderBottomColor} ${s.borderLeftColor}`,
        backgroundColor: s.backgroundColor,
        color: s.color,
        textDecorationLine: s.textDecorationLine,
        parentBoxShadow: p?.boxShadow ?? 'none',
        parentOutlineStyle: p?.outlineStyle ?? 'none',
      }
    }
    return out
  })
}

const alphaOf = (color: string) => {
  const m = color.match(/rgba?\(([^)]+)\)/)
  if (!m) return color === 'transparent' ? 0 : 1
  const parts = m[1].split(/[\s,/]+/).filter(Boolean)
  return parts[3] === undefined ? 1 : parseFloat(parts[3])
}

const outlineDrawn = (l: Look) => l.outlineStyle !== 'none' && parseFloat(l.outlineWidth) >= 1 && alphaOf(l.outlineColor) > 0

/** What changed between unfocused and focused: the indicator. */
function indicatorOf(focused: Look, unfocused: Look | undefined): string[] {
  if (!unfocused) return outlineDrawn(focused) ? ['outline'] : []
  const changed = (Object.keys(focused) as (keyof Look)[]).filter((k) => focused[k] !== unfocused[k])
  // An outline counts only if it is drawn; a changed-but-invisible outline is no indicator.
  return changed.filter((k) => !k.startsWith('outline') || outlineDrawn(focused))
}

/**
 * Tabs from the top of the page until `done` says so, focus leaves the page,
 * or MAX_STOPS. Returns every stop.
 */
async function walk(page: Page, done: (stop: Stop) => boolean = () => false) {
  const stops: Stop[] = []
  for (let n = 1; n <= MAX_STOPS; n++) {
    await page.keyboard.press('Tab')
    let stop = await readStop(page, n)
    if (!stop) break // focus left the document: the walk is over
    // Give the page (a smooth scroll, an entrance) a moment to bring the element into view.
    for (let tries = 0; tries < 15 && stop && (!stop.inViewport || stop.underNav || stop.coveredBy || stop.opacity === 0); tries++) {
      await page.waitForTimeout(100)
      stop = await readStop(page, n)
    }
    if (!stop) break
    await expect(page.locator(':focus'), `stop ${n}: ${stop.what}`).toHaveAccessibleName(/\S/)
    stops.push(stop)
    if (n > 1 && stop.what.startsWith('a "Skip to content"')) break // wrapped round
    if (done(stop)) break
  }
  return stops
}

function check(stops: Stop[], unfocused: Record<string, Look>, { fromTop = true }: { fromTop?: boolean } = {}) {
  expect(stops.length, 'the walk found something to focus').toBeGreaterThan(0)
  test.info().annotations.push({ type: 'stops', description: `${stops.length}: ${stops.at(-1)!.what}` })
  if (fromTop) expect(stops[0].what, 'the first stop').toBe('a "Skip to content"')
  const problems: string[] = []
  for (const stop of stops) {
    const where = `stop ${stop.n}: ${stop.what}`
    if (!(stop.opacity > 0)) problems.push(`${where} is transparent (opacity ${stop.opacity})`)
    if (stop.visibility === 'hidden') problems.push(`${where} is visibility:hidden`)
    if (!stop.inViewport) problems.push(`${where} is outside the viewport`)
    if (stop.underNav) problems.push(`${where} is under the fixed top bar`)
    if (stop.coveredBy) problems.push(`${where} is painted over by ${stop.coveredBy}`)
    if (indicatorOf(stop.focused, unfocused[String(stop.n)]).length === 0) problems.push(`${where} has no visible focus indicator`)
  }
  expect(problems).toEqual([])
}

test.describe('keyboard walk', () => {
  test('home: from the skip link to the end of the footer, then Send, every stop visible, named and in view', async ({ page }) => {
    test.setTimeout(240_000)
    const log = collectConsole(page)
    await gotoHome(page)
    const stops = await walk(page)
    const unfocused = await readUnfocused(page)
    check(stops, unfocused)
    expect(stops.at(-1)!.what, 'the walk ends in the footer').toBe('a "Email"')
    // The message box's three fields are on the way.
    for (const field of [/^input#c-name /, /^input#c-email /, /^textarea.* "Message"$/]) {
      expect(stops.some((s) => field.test(s.what)), String(field)).toBe(true)
    }
    // So is every product's control: each public one's preview and link,
    // and every preview's and diagram's Pause.
    const productStops = PRODUCTS.flatMap((p) => [
      ...(p.url ? [`a "Visit ${domain(p.url)}"`, `a "${domain(p.url)}"`] : []),
      `button "Pause the ${p.title} ${p.url ? 'preview' : 'diagram'}"`,
    ])
    for (const stop of productStops) expect(stops.map((s) => s.what), stop).toContain(stop)

    // Send is disabled until the box holds a name, an address and a message,
    // so the empty page's walk passes it by. Filled in, it is the stop after
    // the message. (A message the box has no suggestion for, so Tab moves on
    // rather than accepting one.)
    const box = page.locator('#contact form')
    await box.getByLabel('Name', { exact: true }).fill('Keyboard')
    await box.getByLabel('Email', { exact: true }).fill('keys@example.com')
    const message = box.getByRole('textbox', { name: 'Message', exact: true })
    await message.fill('Hello there. I have a question about a project.')
    await page.waitForTimeout(800)
    await message.focus()
    await page.keyboard.press('Tab')
    const send = await readStop(page, 900)
    expect(send?.what).toBe('button "Send"')
    await expect(page.locator(':focus')).toHaveAccessibleName('Send')
    check([send!], await readUnfocused(page), { fromTop: false })
    log.expectClean()
  })

  test('home: the message box’s failure and sent panels, every control a visible, named, ringed stop', async ({ page }) => {
    const log = collectConsole(page, [/status of 502/])
    // The first POST fails, the second (Try again) is delivered.
    let posts = 0
    await page.route('**/api/contact', (route) =>
      posts++ === 0
        ? route.fulfill({ status: 502, json: { error: 'delivery_failed' } })
        : route.fulfill({ json: { ok: true, delivered: ['forms'], receipt: false } }),
    )
    await gotoHome(page, '/#contact')
    const box = page.locator('#contact form')
    await box.getByLabel('Name', { exact: true }).fill('Keyboard')
    await box.getByLabel('Email', { exact: true }).fill('keys@example.com')
    await box.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello there. I have a question about a project.')
    await page.waitForTimeout(800)
    await page.locator('#contact form button[aria-label="Send"]').focus()
    await page.keyboard.press('Enter')

    // Focus lands on each panel's heading; from there Tab reaches its controls in order.
    const contact = page.locator('#contact')
    await expect(contact.getByRole('heading', { name: 'Your message didn’t go through' })).toBeFocused({ timeout: 15_000 })
    const failed: Stop[] = []
    for (let n = 1; n <= 4; n++) {
      await page.keyboard.press('Tab')
      failed.push((await readStop(page, 1000 + n))!)
    }
    expect(failed.map((s) => s.what)).toEqual(['button "Try again"', 'button "Edit message"', 'button "Copy email"', 'a "Open in your mail app"'])
    check(failed, await readUnfocused(page), { fromTop: false })

    await contact.getByRole('button', { name: 'Try again' }).focus()
    await page.keyboard.press('Enter')
    await expect(contact.getByRole('heading', { name: 'Message sent' })).toBeFocused({ timeout: 10_000 })
    await page.keyboard.press('Tab')
    const another = await readStop(page, 1100)
    expect(another?.what).toBe('button "Send another message"')
    check([another!], await readUnfocused(page), { fromTop: false })
    log.expectClean()
  })

  for (const route of ['/resume', '/does-not-exist']) {
    test(`${route}: every stop visible, named and in view`, async ({ page }) => {
      const log = collectConsole(page, route === '/does-not-exist' ? [/status of 404/] : [])
      await page.goto(route)
      await expect(page.locator('main#main')).toHaveCount(1)
      await page.waitForTimeout(500)
      const stops = await walk(page)
      const unfocused = await readUnfocused(page)
      check(stops, unfocused)
      log.expectClean()
    })
  }
})
