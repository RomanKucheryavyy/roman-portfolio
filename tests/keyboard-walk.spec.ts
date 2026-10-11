import { expect, test, type Page } from '@playwright/test'
import { LINKS } from '@/lib/constants'
import { collectConsole, gotoHome, waitForChrome } from './helpers'

/**
 * The keyboard-only pass, as a test (W12). Tab through each page from the top
 * the way a keyboard user does, and at every stop check what they would see:
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
 *   under the fixed nav.
 *
 * On the home page the walk must reach Send ("Send message"), the end of the
 * page's one job. Every other route is walked until focus leaves the page.
 * It runs in all three projects: desktop and no-webgl at 1440, mobile at 390.
 */

const MAX_STOPS = 250

/**
 * The one known gap, and it is not ours to close: the hero's GitHub and
 * LinkedIn icon links have no accessible name. Naming them is two attributes
 * in Hero.tsx, which is frozen until Roman approves W10 item 4a (the same two
 * nodes are the only entries left in tests/a11y-baseline.json). Every other
 * check still applies to them; only the name is reported instead of failed.
 * Delete this the day they get their names.
 */
const OWNER_GATED_UNNAMED = `#hero a[href="${LINKS.github}"], #hero a[href="${LINKS.linkedin}"]`

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
    // Under the fixed nav: the middle of the element's part inside the
    // viewport belongs to the nav. (The nav's own items are, of course, fine.)
    const nav = document.querySelector('nav')
    const [left, right] = [Math.max(r.left, 0), Math.min(r.right, innerWidth)]
    const [top, bottom] = [Math.max(r.top, 0), Math.min(r.bottom, innerHeight)]
    const hit = document.elementFromPoint(Math.min((left + right) / 2, innerWidth - 1), Math.min((top + bottom) / 2, innerHeight - 1))
    const underNav = !!nav && !nav.contains(el) && !!hit && nav.contains(hit)
    const name = el.getAttribute('aria-label') || (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return {
      n,
      what: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} "${name}"`,
      opacity,
      visibility: getComputedStyle(el).visibility,
      inViewport,
      underNav,
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
    // Give the page (Lenis, a reveal) a moment to bring the element into view.
    for (let tries = 0; tries < 15 && stop && (!stop.inViewport || stop.underNav || stop.opacity === 0); tries++) {
      await page.waitForTimeout(100)
      stop = await readStop(page, n)
    }
    if (!stop) break
    if (await page.locator(':focus').evaluate((el, gated) => el.matches(gated), OWNER_GATED_UNNAMED)) {
      test.info().annotations.push({ type: 'owner-gated', description: `stop ${n}: ${stop.what} has no name (W10 item 4a)` })
    } else {
      await expect(page.locator(':focus'), `stop ${n}: ${stop.what}`).toHaveAccessibleName(/\S/)
    }
    stops.push(stop)
    if (n > 1 && stop.what.startsWith('a "Skip to content"')) break // wrapped round
    if (done(stop)) break
  }
  return stops
}

function check(stops: Stop[], unfocused: Record<string, Look>) {
  expect(stops.length, 'the walk found something to focus').toBeGreaterThan(0)
  test.info().annotations.push({ type: 'stops', description: `${stops.length}: ${stops.at(-1)!.what}` })
  expect(stops[0].what, 'the first stop').toBe('a "Skip to content"')
  const problems: string[] = []
  for (const stop of stops) {
    const where = `stop ${stop.n}: ${stop.what}`
    if (!(stop.opacity > 0)) problems.push(`${where} is transparent (opacity ${stop.opacity})`)
    if (stop.visibility === 'hidden') problems.push(`${where} is visibility:hidden`)
    if (!stop.inViewport) problems.push(`${where} is outside the viewport`)
    if (stop.underNav) problems.push(`${where} is under the fixed nav`)
    if (indicatorOf(stop.focused, unfocused[String(stop.n)]).length === 0) problems.push(`${where} has no visible focus indicator`)
  }
  expect(problems).toEqual([])
}

test.describe('keyboard walk', () => {
  test('home: from the skip link to Send, every stop visible, named and in view', async ({ page }) => {
    const log = collectConsole(page)
    await gotoHome(page)
    await waitForChrome(page)
    const stops = await walk(page, (stop) => stop.what.endsWith('"Send message"'))
    const unfocused = await readUnfocused(page)
    check(stops, unfocused)
    expect(stops.at(-1)!.what, 'the walk reaches Send').toMatch(/"Send message"$/)
    log.expectClean()
  })

  for (const route of ['/works', '/colophon', '/resume', '/does-not-exist']) {
    test(`${route}: every stop visible, named and in view`, async ({ page }) => {
      const log = collectConsole(page, route === '/does-not-exist' ? [/status of 404/] : [])
      await page.goto(route)
      await expect(page.locator('main#main')).toHaveCount(1)
      await waitForChrome(page)
      const stops = await walk(page)
      const unfocused = await readUnfocused(page)
      check(stops, unfocused)
      log.expectClean()
    })
  }
})
