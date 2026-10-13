import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { CLIENT_WORK, PRODUCTS, counterOf } from '@/lib/work'
import { collectConsole, gotoHome, wheelThrough } from './helpers'

/**
 * The work surfaces (W6): the home deck on desktop and phone, the products,
 * the detail view and /works.
 *
 * Each test names the project it belongs to and skips the others. Never waits
 * for `networkidle`: the ocean, Lenis and the deck keep the page busy forever.
 */

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const TOTAL = CLIENT_WORK.length

function only(project: 'desktop' | 'mobile') {
  const name = test.info().project.name
  test.skip(name !== '' && name !== project, `runs in the ${project} project`)
}

/** Walks down in steps (so every reveal on the way fires) until the element is centred. */
async function centre(page: Page, selector: string) {
  await page.evaluate(async (sel: string) => {
    const el = document.querySelector(sel)
    if (!el) throw new Error(`${sel} is not on the page`)
    const r = el.getBoundingClientRect()
    const goal = r.top + window.scrollY + r.height / 2 - window.innerHeight / 2
    let y = window.scrollY
    while (Math.abs(goal - y) > 10) {
      y += Math.sign(goal - y) * Math.min(400, Math.abs(goal - y))
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  }, selector)
  await page.mouse.wheel(0, 1)
  await settle(600)
}

const DECK = '#symphony [role="region"]'
/** The deck's screen-reader narration reads "02 / 09: Mark Lutsyuk". */
async function expectCounter(page: Page, n: number) {
  await expect(page.locator(`${DECK} [aria-live="polite"]`)).toHaveText(
    `${counterOf(n, TOTAL)}: ${CLIENT_WORK[n].title}`,
  )
}

// ── the phone deck ─────────────────────────────────────────────────────────

const PHONE_DECKS = [
  { label: '390x844 touch', project: 'mobile' as const, viewport: null },
  { label: '720x450', project: 'desktop' as const, viewport: { width: 720, height: 450 } },
]

test.describe('phone deck controls', () => {
  for (const { label, project, viewport } of PHONE_DECKS) {
    test(`${label}: Previous / Next buttons are 44px targets and turn the deck`, async ({ page }) => {
      only(project)
      const log = collectConsole(page)
      if (viewport) await page.setViewportSize(viewport)
      await gotoHome(page)
      await centre(page, DECK)

      const prev = page.locator('#symphony').getByRole('button', { name: 'Previous piece' })
      const next = page.locator('#symphony').getByRole('button', { name: 'Next piece' })
      for (const button of [prev, next]) {
        const box = await button.boundingBox()
        expect(box, 'button has a box').not.toBeNull()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }

      await expectCounter(page, 0)
      await next.click()
      await expectCounter(page, 1)
      await prev.click()
      await expectCounter(page, 0)

      // The keyboard alone reaches every card: Enter on the button, then the arrows.
      await next.focus()
      await page.keyboard.press('Enter')
      await expectCounter(page, 1)
      const seen = new Set<string>([counterOf(0, TOTAL), counterOf(1, TOTAL)])
      for (let i = 2; i < TOTAL; i++) {
        await page.keyboard.press('ArrowRight')
        await expectCounter(page, i)
        seen.add(counterOf(i, TOTAL))
      }
      expect(seen.size).toBe(TOTAL)
      await page.keyboard.press('ArrowRight')
      await expectCounter(page, 0)
      await page.keyboard.press('ArrowLeft')
      await expectCounter(page, TOTAL - 1)
      log.expectClean()
    })
  }

  test('ArrowRight turns the phone deck; ArrowDown still scrolls the page', async ({ page }) => {
    only('mobile')
    await gotoHome(page)
    await centre(page, DECK)
    await page.keyboard.press('ArrowRight')
    await expectCounter(page, 1)
    await page.keyboard.press('ArrowDown')
    await settle(300)
    await expectCounter(page, 1)
  })

  test('the front card pans vertically, a vertical swipe scrolls past the deck, a sideways one turns it', async ({ page, context }) => {
    only('mobile')
    await gotoHome(page)
    await centre(page, DECK)

    const front = page.locator('#symphony li[data-front="true"]').first()
    expect(await front.evaluate((el) => getComputedStyle(el).touchAction)).toBe('pan-y')

    const cdp = await context.newCDPSession(page)
    const box = (await page.locator(`${DECK} > ul`).boundingBox())!
    const cx = Math.round(box.x + box.width / 2)
    const cy = Math.round(box.y + box.height / 2)

    // Sideways: the deck turns.
    await expectCounter(page, 0)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx + 100, y: cy }] })
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 100 - i * 22, y: cy }] })
      await settle(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expectCounter(page, 1)

    // Vertical, starting on the card: the page scrolls on past it. Real touch
    // events, which the compositor scrolls with (a synthesized scroll gesture
    // does not move this page at all in headless Chromium, on or off the deck).
    await settle(600)
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('li[data-front="true"]'), [cx, cy])).toBe(true)
    const y0 = await page.evaluate(() => window.scrollY)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] })
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - i * 20 }] })
      await settle(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await settle(1200)
    const y1 = await page.evaluate(() => window.scrollY)
    expect(y1 - y0, `scrollY ${y0} -> ${y1}`).toBeGreaterThan(200)
  })
})

test.describe('desktop deck keys', () => {
  test('Ctrl+K, modified arrows and focusing links leave the deck where it is', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await centre(page, DECK)
    await expectCounter(page, 0)
    // Each with the deck on screen, so it is the modifier guard being tested,
    // not the on-screen one. (A modified arrow is the browser's own and may
    // scroll the page, so the deck is brought back before the next.)
    for (const combo of ['Control+k', 'Control+ArrowDown', 'Alt+ArrowDown', 'Meta+ArrowDown']) {
      await centre(page, DECK)
      await page.keyboard.press(combo)
      await settle(200)
      await expectCounter(page, 0)
    }
    await centre(page, DECK)
    await page.locator('#symphony a[href="/works"]').focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await settle(300)
    await expectCounter(page, 0)
    // And a plain arrow still turns it. (Ctrl/Alt+ArrowDown are the browser's
    // own and may have scrolled the page; bring the deck back first.)
    await centre(page, DECK)
    await page.keyboard.press('ArrowDown')
    await expectCounter(page, 1)
  })
})

// ── copy, products and the notes link ─────────────────────────────────────

test.describe('copy and products', () => {
  test('no "hear its story", and the setlist link counts the pieces with an ArrowRight', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await wheelThrough(page)
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/hear its story/i)
    const link = page.locator('#symphony a[href="/works"]')
    await expect(link).toHaveText(`see all ${TOTAL} in the setlist`)
    await expect(link.locator('svg')).toHaveClass(/lucide-arrow-right/)
  })

  test('product status dots are still, and Sembly names its domain once', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await centre(page, '#compositions')
    await expect(page.locator('#compositions article')).toHaveCount(PRODUCTS.length)
    expect(await page.locator('#compositions .animate-pulse').count()).toBe(0)
    const sembly = page.locator('#compositions article', { has: page.getByRole('heading', { name: 'Sembly' }) })
    const text = (await sembly.innerText()).toLowerCase()
    expect(text.split('sembly.app').length - 1).toBe(1)
  })

  test('with every study unpublished, no surface links to program notes', async ({ page }) => {
    await gotoHome(page)
    await wheelThrough(page)
    await expect(page.getByRole('link', { name: /program notes/i })).toHaveCount(0)
    if (test.info().project.name === 'desktop') {
      await centre(page, DECK)
      await page.getByRole('button', { name: `Open ${CLIENT_WORK[0].title}` }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('link', { name: /program notes/i })).toHaveCount(0)
      await page.keyboard.press('Escape')
    }
    await page.goto('/works')
    await expect(page.locator('main#main')).toBeAttached()
    await expect(page.getByRole('link', { name: /program notes/i })).toHaveCount(0)
  })
})

// ── Expandable Text ─────────────────────────────────────────────────────────

/** Per product card: does it have a toggle, does its text overflow four lines,
 *  does the toggle's aria-controls name an element that exists, and how many
 *  of the text's own lines the visible box holds. */
async function expandables(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#compositions [data-expandable]')].map((root) => {
      const box = root.firstElementChild as HTMLElement
      const content = box.firstElementChild as HTMLElement
      // The paragraph's line, not the wrappers' (they would inherit the body's).
      const text = root.querySelector<HTMLElement>('[data-card-description]')!
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight)
      const toggle = root.querySelector<HTMLButtonElement>('button[aria-controls]')
      return {
        overflows: content.scrollHeight > lineHeight * 4 + 1,
        toggle: toggle?.textContent ?? null,
        controlsExists: toggle ? document.getElementById(toggle.getAttribute('aria-controls')!) !== null : null,
        visibleLines: box.getBoundingClientRect().height / lineHeight,
      }
    }),
  )
}

test.describe('product descriptions', () => {
  test('390: the $ cat --more toggle exists exactly where the text overflows four lines', async ({ page }) => {
    only('mobile')
    await gotoHome(page)
    await centre(page, '#compositions')
    const cards = await expandables(page)
    expect(cards).toHaveLength(PRODUCTS.length)
    expect(cards.some((c) => c.toggle), 'at least one description is clamped at 390').toBe(true)
    for (const card of cards) {
      expect(card.toggle !== null).toBe(card.overflows)
      if (card.toggle) {
        expect(card.toggle).toBe('$ cat --more')
        expect(card.controlsExists).toBe(true)
        // Exactly four whole lines: no slice of a fifth under the fade.
        expect(card.visibleLines).toBeCloseTo(4, 1)
      }
    }
    const toggle = page.locator('#compositions button[aria-controls]').first()
    await toggle.click()
    await expect(toggle).toHaveText('$ cat --less')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('700: a description that fits renders no toggle', async ({ page }) => {
    only('desktop')
    await page.setViewportSize({ width: 700, height: 900 })
    await gotoHome(page)
    await centre(page, '#compositions')
    const cards = await expandables(page)
    expect(cards.some((c) => !c.overflows), 'some description fits in four lines at 700').toBe(true)
    for (const card of cards) expect(card.toggle !== null).toBe(card.overflows)
  })

  test('>= 768: there is no toggle at all', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await centre(page, '#compositions')
    await expect(page.locator('#compositions [data-expandable]')).toHaveCount(PRODUCTS.length)
    await expect(page.locator('#compositions button[aria-controls]')).toHaveCount(0)
  })
})

// ── WorkLink hit slop ───────────────────────────────────────────────────────

test.describe('link pills', () => {
  test('390: 2px outside a WorkLink pill still hits the link', async ({ page }) => {
    only('mobile')
    await page.goto('/works')
    // The wheel's cards are in the DOM too, display:none below md.
    const links = page.locator('main article a[target="_blank"]').filter({ visible: true })
    await expect(links).toHaveCount(CLIENT_WORK.filter((w) => w.url).length)
    for (let i = 0; i < (await links.count()); i++) {
      const link = links.nth(i)
      await link.scrollIntoViewIfNeeded()
      await settle(100)
      const hits = await link.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left + r.width / 2
        const hit = (y: number) => document.elementFromPoint(x, y)?.closest('a') === el
        return { above: hit(r.top - 2), below: hit(r.bottom + 2) }
      })
      expect(hits, `pill ${i}`).toEqual({ above: true, below: true })
    }
  })

  // The phone slop is a ::after; from md up there must be none, or it is one
  // more flex item and one more gap on the pill's right.
  for (const { label, project, viewport } of [
    { label: '390', project: 'mobile' as const, viewport: null },
    { label: '1440', project: 'desktop' as const, viewport: { width: 1440, height: 900 } },
  ]) {
    test(`${label}: every WorkLink pill has as much room after its text as before its icon`, async ({ page }) => {
      only(project)
      if (viewport) await page.setViewportSize(viewport)
      // Only the live card's pill: the deck's back cards and the wheel's turned
      // cards are inert, and scaled or turned in 3D, so their boxes are skewed.
      const check = async (where: string, scope: string) => {
        const links = page
          .locator(`${scope} a[target="_blank"][aria-label$="(opens in a new tab)"]:not([inert] *)`)
          .filter({ visible: true })
        await expect(links.first()).toBeVisible()
        const pills = await links.evaluateAll((els) =>
          els.map((el) => {
            const box = el.getBoundingClientRect()
            const icon = el.querySelector('svg')!.getBoundingClientRect()
            const range = document.createRange()
            range.selectNodeContents([...el.childNodes].find((n) => n.nodeType === 3 && n.textContent?.trim())!)
            const text = range.getBoundingClientRect()
            return { label: el.textContent?.trim(), before: icon.left - box.left, after: box.right - text.right }
          }),
        )
        for (const pill of pills) {
          expect(Math.abs(pill.after - pill.before), `${where} ${pill.label}: ${pill.before} vs ${pill.after}`).toBeLessThan(1.5)
        }
      }
      await gotoHome(page)
      await centre(page, DECK)
      await check('deck', '#symphony')
      await centre(page, '#compositions')
      await check('products', '#compositions')
      await page.goto('/works')
      await check('/works', 'main')
    })
  }
})

// ── the desktop deck's scrim ────────────────────────────────────────────────

test.describe('deck scrim', () => {
  test('behind the first description line, every front card is at most rgb(40,40,40)', async ({ page }) => {
    only('desktop')
    // Nine cards, one of them a Spline scene under software WebGL.
    test.setTimeout(240_000)
    await gotoHome(page)
    await centre(page, DECK)
    await page.mouse.move(5, 5)
    // Turned from the keyboard, so the pointer (and the custom cursor's trail)
    // stays parked in the corner, off the line being probed.
    const readings: string[] = []
    for (let i = 0; i < TOTAL; i++) {
      await expectCounter(page, i)
      await settle(900)
      const card = page.locator(`#symphony li[data-work="${CLIENT_WORK[i].id}"]`)
      const description = card.locator('[data-card-description]')
      const line = await description.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const lh = parseFloat(getComputedStyle(el).lineHeight)
        // Hide the details so the probe reads what is behind them.
        ;(el.parentElement as HTMLElement).style.visibility = 'hidden'
        return { x: r.left, y: r.top, width: r.width, height: lh }
      })
      await settle(150)
      const png = await page.screenshot({ clip: line })
      await description.evaluate((el) => { (el.parentElement as HTMLElement).style.visibility = '' })
      const brightest = await page.evaluate(async (b64: string) => {
        const img = new Image()
        img.src = `data:image/png;base64,${b64}`
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const { data } = ctx.getImageData(0, 0, img.width, img.height)
        let max = 0
        for (let p = 0; p < data.length; p += 4) max = Math.max(max, data[p], data[p + 1], data[p + 2])
        return max
      }, png.toString('base64'))
      readings.push(`${CLIENT_WORK[i].id}: ${brightest}`)
      console.log(`[scrim] ${CLIENT_WORK[i].id}: max channel ${brightest}`)
      expect(brightest, CLIENT_WORK[i].id).toBeLessThanOrEqual(40)
      await page.keyboard.press('ArrowDown')
    }
    test.info().annotations.push({ type: 'scrim', description: readings.join(', ') })
  })
})

// ── /works ─────────────────────────────────────────────────────────────────

const RAIL = 'section ol button'

test.describe('/works', () => {
  test('one h1, a side panel that follows the wheel, aria-current, Home and End', async ({ page }) => {
    only('desktop')
    const log = collectConsole(page)
    await page.goto('/works')
    await expect(page.locator('[data-stage] [role="group"]')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)

    const panel = page.locator('[data-stage] [data-description]')
    const current = page.locator(`${RAIL}[aria-current="true"]`)
    await expect(panel).toHaveText(CLIENT_WORK[0].description)
    await expect(current).toHaveCount(1)
    await expect(current).toHaveText(CLIENT_WORK[0].title)

    const stage = page.locator('[data-stage] [role="group"]')
    await stage.focus()
    await page.keyboard.press('ArrowDown') // ring -> drum, first piece in front
    await page.keyboard.press('ArrowDown') // the second piece
    await expect(panel).toHaveText(CLIENT_WORK[1].description)
    await expect(current).toHaveCount(1)
    await expect(current).toHaveText(CLIENT_WORK[1].title)

    await page.keyboard.press('End')
    await expect(current).toHaveText(CLIENT_WORK[TOTAL - 1].title)
    await expect(current).toHaveText('FUBC Coffee iOS')
    await expect(panel).toHaveText(CLIENT_WORK[TOTAL - 1].description)
    await page.keyboard.press('PageUp')
    await expect(current).toHaveText(CLIENT_WORK[TOTAL - 2].title)
    await page.keyboard.press('Home')
    await expect(current).toHaveText(CLIENT_WORK[0].title)
    await page.keyboard.press('PageDown')
    await expect(current).toHaveText(CLIENT_WORK[1].title)

    // The page's own pill. The site nav's Products item links there too.
    await expect(page.locator('main a[href="/#compositions"]')).toBeVisible()
    log.expectClean()
  })

  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }]) {
    test(`${viewport.width}x${viewport.height}: the rail clears the site nav`, async ({ page }) => {
      only('desktop')
      await page.setViewportSize(viewport)
      // The nav is the same fixed bar on every route. Where /works does not
      // mount it yet, measure it on the home page instead.
      await page.goto('/works')
      await expect(page.locator(RAIL).first()).toBeVisible()
      const rail = (await page.locator('section ol').boundingBox())!
      const navHere = (await page.locator('nav').count()) > 0 && (await page.locator('nav').first().isVisible())
      let nav = navHere ? await page.locator('nav').first().boundingBox() : null
      if (!nav) {
        await gotoHome(page)
        await expect(page.locator('nav').first()).toBeVisible()
        await settle(1200)
        nav = await page.locator('nav').first().boundingBox()
      }
      expect(nav).not.toBeNull()
      const overlap =
        rail.x < nav!.x + nav!.width && nav!.x < rail.x + rail.width && rail.y < nav!.y + nav!.height && nav!.y < rail.y + rail.height
      expect(overlap, `rail ${JSON.stringify(rail)} vs nav ${JSON.stringify(nav)}`).toBe(false)
    })
  }

  test('390: the phone list has the page h1, the counts and the products link', async ({ page }) => {
    only('mobile')
    await page.goto('/works')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toBeVisible()
    const live = CLIENT_WORK.filter((w) => w.url).length
    await expect(page.getByText(`${TOTAL} pieces · ${live} live, ${TOTAL - live} launching soon`)).toBeVisible()
    await expect(page.locator('main article').filter({ visible: true })).toHaveCount(TOTAL)
    // The page's own pill. The site nav's Products item links there too.
    await expect(page.locator('main a[href="/#compositions"]')).toBeVisible()
  })

  test('server HTML: its own canonical, matching titles, and an ItemList that parses', async ({ request }) => {
    only('desktop')
    const html = await (await request.get('/works')).text()
    const decode = (s: string) =>
      s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/romankucheryavyy\.com\/works"\/>/)
    const title = decode(html.match(/<title>([^<]*)<\/title>/)![1])
    const twitter = decode(html.match(/<meta name="twitter:title" content="([^"]*)"/)![1])
    expect(title).toBe('The setlist — Roman Kucheryavyy')
    expect(twitter).toBe(title)
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
    const list = blocks.find((b) => b['@type'] === 'ItemList')
    expect(list, 'an ItemList block').toBeTruthy()
    expect(list.itemListElement).toHaveLength(TOTAL)
    expect(JSON.stringify(list)).not.toMatch(/aggregateRating|ratingValue/)
    const app = list.itemListElement.find((e: { item: { name: string } }) => e.item.name === 'FUBC Coffee iOS').item
    expect(app['@type']).toBe('MobileApplication')
    expect(app.operatingSystem).toBe('iOS')
    for (const { item } of list.itemListElement as { item: Record<string, string> }[]) {
      expect(item.url || item.creativeWorkStatus, item.name).toBeTruthy()
    }
  })
})

// ── the source itself ──────────────────────────────────────────────────────

test.describe('source', () => {
  const root = process.cwd()
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })
  const hasBase = () => {
    try {
      git('cat-file', '-e', 'abb0023^{commit}')
      return true
    } catch {
      return false
    }
  }

  test('no deck-physics line and no wheel-geometry line changed since abb0023', () => {
    only('desktop')
    test.skip(!hasBase(), 'needs the history back to abb0023 (CI checks out with fetch-depth 0)')
    const deck = git('diff', 'abb0023', '-U0', '--', 'src/components/sections/Projects.tsx')
      .split('\n')
      .filter((l) => /^[-+](?![-+])/.test(l) && /(drag=|dragConstraints|dragElastic|SPRING|STACK_DEPTH|touchAction)/.test(l))
    expect(deck).toEqual([])
    const wheel = git('diff', 'abb0023', '-U0', '--', 'src/components/ui/works-wheel.tsx')
      .split('\n')
      .filter((l) => /^[-+](?![-+])/.test(l) && /\b(STEP|DRUM|LENS|BOW|RING_R|CULL|EASE|CARD_[A-Z_]+)\b\s*=/.test(l))
    expect(wheel).toEqual([])
  })

  test('the unused device frames are gone', () => {
    only('desktop')
    expect(existsSync(path.join(root, 'public', 'images', 'devices'))).toBe(false)
  })
})
