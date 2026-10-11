import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type Route } from '@playwright/test'
import { LINKS } from '@/lib/constants'
import { RESUME_PDF_HREF, RESUME_REQUEST } from '@/lib/routes'
import { collectConsole, contrast, gotoHome } from './helpers'

/**
 * The contact section's contract (W7): type and ink steps, visible focus,
 * the shared Send button, where focus goes after a send, the error, the
 * attach line, the signature strip's copy control, and the strings that must
 * never change (the heading, the fermata line, `tacet`, dynamicsFor()).
 *
 * /api/contact is always mocked here: nothing in this file reaches the real
 * route, let alone Roman's inbox. contact-api.spec covers the route itself.
 *
 * Each test names the projects it runs in and skips the others; no-webgl
 * adds nothing here (the section has no canvas).
 */

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function only(...projects: Array<'desktop' | 'mobile'>) {
  const name = test.info().project.name
  test.skip(name !== '' && !projects.includes(name as 'desktop' | 'mobile'), `runs in ${projects.join(' and ')}`)
}

const FERMATA = '𝄐 received — roman usually replies the same day.'

/** The network log line Chromium prints for a mocked 502. The page handles it. */
const MOCKED_502 = /Failed to load resource: the server responded with a status of 502/

/**
 * Home, walked down to the contact section in steps (so every scroll reveal
 * on the way fires), then on to the bottom of the page so the signature strip
 * reveals too, then back up to the section.
 */
async function gotoCompose(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('compose:draft')
    } catch {
      // Storage blocked: there is no draft to restore either.
    }
  })
  await gotoHome(page)
  await page.evaluate(async () => {
    const walk = async (goal: number) => {
      let y = window.scrollY
      while (Math.abs(goal - y) > 10) {
        y += Math.sign(goal - y) * Math.min(400, Math.abs(goal - y))
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
    }
    const section = document.getElementById('compose')
    if (!section) throw new Error('#compose is not on the page')
    await walk(section.getBoundingClientRect().top + window.scrollY - 90)
    await walk(document.documentElement.scrollHeight - window.innerHeight)
    await walk(section.getBoundingClientRect().top + window.scrollY - 90)
  })
  await page.mouse.wheel(0, 1)
  // Every reveal in the section has finished, and the heading has assembled.
  await expect
    .poll(() =>
      page.locator('#compose [data-reveal]').evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
    )
    .toBe(true)
  await expect(page.locator('#compose h2 .text-key')).toHaveCount(1, { timeout: 15_000 })
}

/** Mocks /api/contact with `status`, after `delay` ms. */
async function mockContact(page: Page, status: number, delay = 0) {
  await page.route('**/api/contact', async (route: Route) => {
    if (delay) await settle(delay)
    const body = status === 200 ? { ok: true, delivered: ['email'] } : { error: 'delivery_failed' }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
}

async function fillLetter(page: Page) {
  await page.locator('#compose-name').fill('Playwright')
  await page.locator('#compose-email').fill('e2e@example.com')
  await page.locator('#compose-message').fill('A UI test, not a lead. The route is mocked.')
}

/**
 * In-page helpers, installed once per page: `__rgba(css)` turns any colour
 * Chromium serialises (rgb, oklab from Tailwind's color-mix, color()) into
 * `rgba(r, g, b, a)` by painting it on a canvas, and `__paint(el)` gives an
 * element's text colour as painted (its alpha times every ancestor's
 * opacity) and the nearest opaque background inside #compose, falling back to
 * the panel's #0a0a0a.
 */
async function installColorHelpers(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>
    if (w.__rgba) return
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (css: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return { r, g, b, a: a / 255 }
    }
    w.__rgba = (css: string) => {
      const { r, g, b, a } = rgba(css)
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }
    w.__paint = (el: Element) => {
      let opacity = 1
      for (let node: Element | null = el; node; node = node.parentElement) opacity *= parseFloat(getComputedStyle(node).opacity)
      const { r, g, b, a } = rgba(getComputedStyle(el).color)
      let bg = '#0a0a0a'
      const stop = document.getElementById('compose')
      for (let node: Element | null = el; node && node !== stop?.parentElement; node = node.parentElement) {
        const back = rgba(getComputedStyle(node).backgroundColor)
        if (back.a === 1) {
          bg = `rgba(${back.r}, ${back.g}, ${back.b}, 1)`
          break
        }
      }
      return { fg: `rgba(${r}, ${g}, ${b}, ${a * opacity})`, bg }
    }
  })
}

test.describe('type and ink', () => {
  test('every readable text node is at least 12px and 4.5:1', async ({ page }) => {
    only('desktop', 'mobile')
    const log = collectConsole(page)
    await gotoCompose(page)
    await installColorHelpers(page)

    const nodes = await page.evaluate(() => {
      const w = window as unknown as { __paint: (el: Element) => { fg: string; bg: string } }
      const root = document.getElementById('compose')!
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const out: { text: string; size: number; fg: string; bg: string; decoration: boolean }[] = []
      while (walker.nextNode()) {
        const node = walker.currentNode
        const text = node.textContent?.trim() ?? ''
        const el = node.parentElement
        if (!text || !el) continue
        // Hidden from people and from assistive tech: not read, not measured.
        if (el.closest('[aria-hidden="true"], .sr-only, [inert]')) continue
        if (['TEXTAREA', 'INPUT'].includes(el.tagName) || !el.getClientRects().length) continue
        const style = getComputedStyle(el)
        if (style.visibility !== 'visible') continue
        // Gradient-clipped display type (the heading's accent word) has no
        // text colour to measure; it is 36px+ and keyed in score.ts.
        if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') continue
        out.push({
          text,
          size: parseFloat(style.fontSize),
          ...w.__paint(el),
          decoration: el.matches('#compose-message ~ span'),
        })
      }
      return out
    })

    expect(nodes.length).toBeGreaterThan(10)
    for (const n of nodes) {
      expect(n.size, `"${n.text}" font size`).toBeGreaterThanOrEqual(12)
      // The dynamics mark too: it mirrors the message length, but it is text a
      // visitor reads, so since W12 it is held to 4.5:1 like the rest.
      expect(contrast(n.fg, n.bg), `"${n.text}" contrast (${n.fg} on ${n.bg})`).toBeGreaterThanOrEqual(4.5)
    }
    const mark = nodes.find((n) => n.decoration)
    expect(mark?.text, 'the dynamics mark was measured').toBe('tacet')

    const placeholders = await page.evaluate(() => {
      const w = window as unknown as { __rgba: (css: string) => string }
      return ['#compose-name', '#compose-email', '#compose-message'].map((sel) => ({
        sel,
        color: w.__rgba(getComputedStyle(document.querySelector(sel)!, '::placeholder').color),
      }))
    })
    for (const p of placeholders) {
      expect(contrast(p.color, '#0a0a0a'), `${p.sel} placeholder (${p.color})`).toBeGreaterThanOrEqual(3)
    }

    const source = readFileSync(path.join(process.cwd(), 'src', 'components', 'sections', 'Compose.tsx'), 'utf8')
    expect(source.match(/text-\[/g) ?? [], 'arbitrary text sizes in Compose.tsx').toHaveLength(0)
    log.expectClean()
  })

  test('the fields are 16px on a phone, so iOS never zooms into them', async ({ page }) => {
    only('mobile')
    await gotoCompose(page)
    for (const sel of ['#compose-name', '#compose-email', '#compose-message']) {
      await expect(page.locator(sel)).toHaveCSS('font-size', '16px')
    }
  })
})

test.describe('focus', () => {
  test('keyboard focus on each field shows an indicator of at least 3:1', async ({ page }) => {
    only('desktop')
    await gotoCompose(page)
    await installColorHelpers(page)

    const borderOf = (sel: string) =>
      page.locator(sel).evaluate((el) => {
        const w = window as unknown as { __rgba: (css: string) => string }
        const style = getComputedStyle(el)
        return { width: parseFloat(style.borderBottomWidth), color: w.__rgba(style.borderBottomColor) }
      })

    // Reach each field by keyboard: Shift+Tab back to the name, Tab forward from there.
    await page.locator('#compose-email').focus()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('#compose-name')).toBeFocused()
    for (const sel of ['#compose-name', '#compose-email']) {
      if (sel === '#compose-email') {
        await page.keyboard.press('Tab')
        await expect(page.locator(sel)).toBeFocused()
      }
      const border = await borderOf(sel)
      expect(border.width, `${sel} bottom border`).toBeGreaterThanOrEqual(1)
      expect(contrast(border.color, '#0a0a0a'), `${sel} focus border (${border.color})`).toBeGreaterThanOrEqual(3)
    }

    await page.keyboard.press('Tab')
    await expect(page.locator('#compose-message')).toBeFocused()
    const rings = await page.locator('#compose-message').evaluate((el) => {
      const w = window as unknown as { __rgba: (css: string) => string }
      const shadow = getComputedStyle(el.parentElement!).boxShadow
      // Split the shadow list on top-level commas, then read colour and spread.
      const layers: string[] = []
      let depth = 0
      let current = ''
      for (const ch of shadow) {
        if (ch === '(') depth++
        if (ch === ')') depth--
        if (ch === ',' && depth === 0) {
          layers.push(current.trim())
          current = ''
        } else current += ch
      }
      layers.push(current.trim())
      return layers
        .map((layer) => {
          const color = layer.match(/^[a-z-]+\([^)]*\)/i)?.[0] ?? ''
          const lengths = layer.slice(color.length).trim().split(/\s+/).map(parseFloat)
          return { color: color ? w.__rgba(color) : '', spread: lengths[3] ?? 0 }
        })
        .filter((l) => l.color && l.spread > 0)
    })
    const visible = rings.filter((r) => !r.color.endsWith(', 0)'))
    expect(visible.length, 'a visible ring on the message wrapper').toBeGreaterThan(0)
    for (const ring of visible) {
      expect(contrast(ring.color, '#0a0a0a'), `message focus ring (${ring.color})`).toBeGreaterThanOrEqual(3)
    }
  })

  test('clicking into the message keeps the pointer visible', async ({ page }) => {
    only('desktop')
    await gotoCompose(page)
    const box = (await page.locator('#compose-message').boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page.locator('#compose-message')).toBeFocused()
    await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 10)
    await settle(300)
    // The custom cursor's dots: the main one used to paint transparent on focus.
    const backgrounds = await page
      .locator('div.fixed.pointer-events-none.rounded-full.mix-blend-difference')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    expect(backgrounds.length, 'the custom cursor is mounted').toBeGreaterThan(0)
    for (const bg of backgrounds) expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})

/**
 * A Mac or a PC as the page sees it. Headless Chromium on Linux keeps
 * navigator.platform at "Linux x86_64" whatever user agent the context sets,
 * so the platform fields are set to what each machine really reports.
 */
const PLATFORMS = {
  mac: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    platform: 'MacIntel',
    uaDataPlatform: 'macOS',
    glyph: '⌘',
  },
  windows: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    platform: 'Win32',
    uaDataPlatform: 'Windows',
    glyph: 'Ctrl',
  },
} as const

for (const [os, p] of Object.entries(PLATFORMS)) {
  test.describe(`Send on ${os}`, () => {
    test.use({ userAgent: p.userAgent })

    test(`shows ${p.glyph}, is named "Send message", and keeps its width while sending`, async ({ page }) => {
      only('desktop')
      await page.addInitScript(
        ({ platform, uaDataPlatform }) => {
          Object.defineProperty(Navigator.prototype, 'platform', { get: () => platform, configurable: true })
          Object.defineProperty(Navigator.prototype, 'userAgentData', {
            get: () => ({ platform: uaDataPlatform, mobile: false, brands: [] }),
            configurable: true,
          })
        },
        { platform: p.platform, uaDataPlatform: p.uaDataPlatform },
      )
      const log = collectConsole(page)
      await mockContact(page, 200, 1000)
      await gotoCompose(page)

      const send = page.locator('#compose').getByRole('button', { name: 'Send message' })
      await expect(send).toHaveCount(1)
      const face = send.locator('span[aria-hidden="true"]').first()
      await expect(face).toHaveText(`${p.glyph}↩`)
      if (os === 'mac') await expect(send).not.toContainText('Ctrl')
      else await expect(send).not.toContainText('⌘')

      const idle = (await send.boundingBox())!.width
      await fillLetter(page)
      await page.locator('#compose-message').press('Control+Enter')
      await expect(send).toHaveAttribute('aria-busy', 'true')
      await expect(page.locator('#compose').getByRole('status').filter({ hasText: 'Sending…' })).toHaveCount(1)
      const sending = (await send.boundingBox())!.width
      expect(Math.abs(sending - idle), `width idle ${idle} vs sending ${sending}`).toBeLessThanOrEqual(0.5)
      await expect(page.locator('#compose-sent')).toBeVisible()
      log.expectClean()
    })
  })
}

for (const motion of ['animated', 'reduced'] as const) {
  test.describe(`after a send (${motion})`, () => {
    test.use({ contextOptions: { reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference' } })

    test('focus lands on the fermata line and never goes back into the form', async ({ page }) => {
      only('desktop', 'mobile')
      const log = collectConsole(page)
      await mockContact(page, 200)
      await gotoCompose(page)
      await fillLetter(page)
      await page.locator('#compose-message').press('Control+Enter')

      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('compose-sent')
      const sent = page.locator('#compose-sent')
      await expect(sent).toHaveAttribute('role', 'status')
      expect(await sent.evaluate((el) => el.textContent)).toBe(FERMATA)
      await expect(page.locator('#compose').getByText('message sent — 250 OK')).toBeVisible()

      const fields = ['compose-name', 'compose-email', 'compose-message']
      const walkBack = async () => {
        await sent.focus()
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press('Shift+Tab')
          const id = await page.evaluate(() => document.activeElement?.id ?? '')
          expect(fields, `Shift+Tab ${i + 1} landed on #${id}`).not.toContain(id)
        }
      }
      // Straight away, while the window is still collapsing...
      await walkBack()
      // ...and once it has: the form is gone, not just transparent.
      await expect(page.locator('#compose form')).toBeHidden()
      await walkBack()
      log.expectClean()
    })
  })
}

test('a failed delivery reads as an error, offers the mailto, and keeps the draft', async ({ page }) => {
  only('desktop', 'mobile')
  const log = collectConsole(page, [MOCKED_502])
  await mockContact(page, 502)
  await gotoCompose(page)
  await installColorHelpers(page)
  await fillLetter(page)
  await page.locator('#compose-message').press('Control+Enter')

  const alert = page.locator('#compose').getByRole('alert')
  await expect(alert).toBeVisible()
  const paint = await alert.evaluate((el) => {
    const w = window as unknown as { __paint: (el: Element) => { fg: string; bg: string } }
    return { size: parseFloat(getComputedStyle(el).fontSize), ...w.__paint(el) }
  })
  expect(paint.size).toBeGreaterThanOrEqual(14)
  expect(contrast(paint.fg, paint.bg), `alert contrast (${paint.fg} on ${paint.bg})`).toBeGreaterThanOrEqual(7)

  const fallback = alert.getByRole('link', { name: 'Open it in your mail app' })
  const href = (await fallback.getAttribute('href')) ?? ''
  expect(href.startsWith(`mailto:${LINKS.email}?subject=`)).toBe(true)
  expect(decodeURIComponent(href)).toContain('A UI test, not a lead.')

  await expect(page.locator('#compose-name')).toHaveValue('Playwright')
  await expect(page.locator('#compose-email')).toHaveValue('e2e@example.com')
  await expect(page.locator('#compose-message')).toHaveValue('A UI test, not a lead. The route is mocked.')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('compose:draft') ?? ''))
    .toContain('A UI test, not a lead.')
  log.expectClean()
})

test('the attach line follows the résumé decision and never opens the PIN screen', async ({ page, request }) => {
  only('desktop')
  await gotoCompose(page)
  const attach = page.locator('#compose a', { hasText: 'resume.pdf' })
  await expect(attach).toHaveCount(1)
  const href = (await attach.getAttribute('href')) ?? ''
  expect(href).not.toBe('/resume')
  if (RESUME_PDF_HREF) {
    await expect(attach).toHaveText('[ attach: resume.pdf ]')
    expect(href).toBe(RESUME_PDF_HREF)
    await expect(attach).toHaveAttribute('download', '')
    const res = await request.get(RESUME_PDF_HREF)
    expect(res.headers()['content-type']).toContain('application/pdf')
  } else {
    await expect(attach).toHaveText('[ request: resume.pdf ]')
    expect(href).toBe(RESUME_REQUEST)
    const url = new URL(href)
    expect(url.protocol).toBe('mailto:')
    expect(url.pathname).toBe(LINKS.email)
    expect(url.searchParams.get('subject')).toBe('Résumé request')
  }
})

test('the signature strip copies the email and says so', async ({ page, context, baseURL }) => {
  only('desktop', 'mobile')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
  const log = collectConsole(page)
  await gotoCompose(page)
  const copy = page.locator('#compose').getByRole('button', { name: 'Copy email' })
  await expect(copy).toBeVisible()
  await copy.click()
  await expect(page.locator('#compose').getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1)
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LINKS.email)
  log.expectClean()
})

test.describe('the strings that never change', () => {
  test('the heading, tacet and the dynamics marks render as they always have; no © here', async ({ page }) => {
    only('desktop')
    await gotoCompose(page)
    expect(await page.locator('#compose h2').evaluate((el) => el.textContent)).toBe('Let’s Compose')

    const section = (await page.locator('#compose').innerText()) ?? ''
    expect(section).not.toContain('©')
    expect(section).not.toContain('Built with')

    const mark = page.locator('#compose-message ~ span')
    await page.locator('#compose-message').fill('')
    await expect(mark).toHaveText('tacet')
    for (const [length, text, word] of [
      [0, 'tacet', 'silence'],
      [49, 'pp', 'pianissimo'],
      [50, 'mp', 'mezzo-piano'],
      [150, 'f', 'forte'],
      [300, 'ff', 'fortissimo'],
    ] as const) {
      await page.locator('#compose-message').fill('a'.repeat(length))
      await expect(mark).toHaveText(text)
      await expect(mark).toHaveAttribute('title', word)
    }
  })

  test('their source is byte-identical', () => {
    only('desktop')
    const source = readFileSync(path.join(process.cwd(), 'src', 'components', 'sections', 'Compose.tsx'), 'utf8')
    const dynamicsFor = [
      'const dynamicsFor = (length: number): { mark: string; word: string } => {',
      "  if (length === 0) return { mark: 'tacet', word: 'silence' }",
      "  if (length < 50) return { mark: 'pp', word: 'pianissimo' }",
      "  if (length < 150) return { mark: 'mp', word: 'mezzo-piano' }",
      "  if (length < 300) return { mark: 'f', word: 'forte' }",
      "  return { mark: 'ff', word: 'fortissimo' }",
      '}',
    ].join('\n')
    expect(source).toContain(dynamicsFor)
    expect(source).toContain(`{'${FERMATA}'}`)
    expect(source).toContain("title={{ lead: 'Let’s', accent: 'Compose' }}")
  })
})
