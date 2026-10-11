import { expect, test, type Page } from '@playwright/test'

/**
 * The system contract (W2): self-hosted fonts, one-line kickers, ink contrast,
 * static movement keys, the reduced-motion reset, the focus ring, heading
 * names, and the Manifesto's own type size.
 *
 * Written for W1's playwright.config.ts projects (desktop 1440x900, mobile
 * 390x844, no-webgl). Each test names the project it belongs to and skips the
 * others; run without projects, everything runs.
 *
 * Never waits for `networkidle`: the ocean, Lenis and the deck keep the page
 * busy forever. Waits for a known element plus a short settle instead.
 */

/** Spelled out so the callbacks type-check before @playwright/test is installed. */
type Fixtures = { page: Page }

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function only(project: 'desktop' | 'mobile') {
  const name = test.info().project.name
  test.skip(name !== '' && name !== project, `runs in the ${project} project`)
}

/** Home, with the once-per-session boot animation already marked as seen. */
async function gotoHome(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('booted', '1')
    } catch {
      // Storage blocked: the Loader runs its full boot, which only costs time.
    }
  })
  await page.goto('/')
  await expect(page.locator('#hero h1')).toBeVisible({ timeout: 30_000 })
  await settle(800)
}

/** Walks down to an element in steps, so every scroll-triggered reveal on the way fires. */
async function scrollToId(page: Page, id: string) {
  await page.evaluate(async (target: string) => {
    const el = document.getElementById(target)
    if (!el) throw new Error(`#${target} is not on the page`)
    const goal = el.getBoundingClientRect().top + window.scrollY - 90
    let y = window.scrollY
    while (Math.abs(goal - y) > 10) {
      y += Math.sign(goal - y) * Math.min(400, Math.abs(goal - y))
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
  }, id)
  await page.mouse.wheel(0, 1)
  await settle(400)
}

const SECTIONS = ['measures', 'symphony', 'compositions', 'interlude', 'conductor', 'compose']

/** The alpha channel of a computed colour, in any of the forms Chromium serialises. */
function alphaOf(color: string): number {
  const slash = color.match(/\/\s*([\d.]+%?)\s*\)$/)
  if (slash) return slash[1].endsWith('%') ? parseFloat(slash[1]) / 100 : parseFloat(slash[1])
  const rgba = color.match(/^rgba\(([^)]+)\)$/)
  if (rgba) return parseFloat(rgba[1].split(',')[3])
  return 1
}

function hexToRgb(hex: string): string {
  const h = hex.trim().replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

test.describe('fonts', () => {
  for (const route of ['/', '/works', '/resume']) {
    test(`${route} self-hosts all three families`, async ({ page }: Fixtures) => {
      only('desktop')
      const thirdParty: string[] = []
      page.on('request', (req: { url(): string }) => {
        if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) thirdParty.push(req.url())
      })
      await page.addInitScript(() => {
        try {
          sessionStorage.setItem('booted', '1')
        } catch {}
      })
      await page.goto(route)
      await page.waitForLoadState('load')
      await settle(1500)

      expect(thirdParty, 'requests to Google Fonts').toEqual([])

      const preloads = await page.locator('head link[rel="preload"][as="font"]').evaluateAll((links: Element[]) =>
        links.map((l) => l.getAttribute('href') ?? ''),
      )
      expect(preloads).toHaveLength(3)
      for (const href of preloads) expect(href).toMatch(/^\/_next\/static\/media\/[^/]+\.woff2$/)

      const mono = await page.evaluate(async () => {
        const probe = document.createElement('span')
        probe.className = 'font-mono'
        probe.textContent = 'x'
        document.body.append(probe)
        const family = getComputedStyle(probe).fontFamily.split(',')[0].trim()
        probe.remove()
        await document.fonts.load(`700 12px ${family}`)
        const bare = family.replace(/^["']|["']$/g, '')
        // A face whose weight range reaches 700: the variable axis, not a
        // 600 face the browser would fall back to (check() alone passes then).
        const real700 = [...document.fonts].some((f) => {
          if (f.family.replace(/^["']|["']$/g, '') !== bare || f.status !== 'loaded') return false
          const [lo, hi = lo] = f.weight.split(/\s+/).map(Number)
          return lo <= 700 && 700 <= hi
        })
        return { family, check: document.fonts.check(`700 12px ${family}`), real700 }
      })
      expect(mono.check, `document.fonts.check('700 12px ${mono.family}')`).toBe(true)
      expect(mono.real700, `a loaded ${mono.family} face covering weight 700`).toBe(true)
    })
  }
})

test.describe('kickers and intros', () => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 640 },
  ]) {
    test(`every kicker is one line at ${size.width}px`, async ({ page }: Fixtures) => {
      only('mobile')
      await page.setViewportSize(size)
      await gotoHome(page)
      for (const id of SECTIONS) await scrollToId(page, id)
      await settle(1500)

      const labels = await page.locator('.section-label').evaluateAll((els: Element[]) =>
        els.map((el) => {
          const column = el.closest('section')?.firstElementChild ?? el.parentElement!
          return {
            text: el.textContent?.trim() ?? '',
            height: el.getBoundingClientRect().height,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            right: el.getBoundingClientRect().right,
            columnRight: column.getBoundingClientRect().right,
          }
        }),
      )
      expect(labels.length).toBeGreaterThanOrEqual(6)
      for (const l of labels) {
        expect(l.height, `${l.text} height`).toBeLessThanOrEqual(20)
        expect(l.scrollWidth, `${l.text} overflows its own box`).toBeLessThanOrEqual(l.clientWidth)
        expect(l.right, `${l.text} runs past its column`).toBeLessThanOrEqual(l.columnRight + 0.5)
      }
    })
  }

  test('kickers and intros are ink-meta or stronger', async ({ page }: Fixtures) => {
    only('desktop')
    await gotoHome(page)
    const colours = await page
      .locator('.section-label, section header > p:not(.section-label)')
      .evaluateAll((els: Element[]) => els.map((el) => ({ text: el.textContent?.trim().slice(0, 40), color: getComputedStyle(el).color })))
    expect(colours.length).toBeGreaterThanOrEqual(10)
    for (const c of colours) expect(alphaOf(c.color), `${c.text}: ${c.color}`).toBeGreaterThanOrEqual(0.5)
  })
})

test.describe('movement keys', () => {
  test('a heading accent is a static key gradient; the hero keeps its animation', async ({ page }: Fixtures) => {
    only('desktop')
    await gotoHome(page)

    const hero = await page.evaluate(() =>
      [...document.querySelectorAll('#hero .text-gradient')].reduce(
        (n, el) => n + el.getAnimations().filter((a) => a.playState === 'running').length,
        0,
      ),
    )
    expect(hero, 'running animations on #hero .text-gradient').toBeGreaterThanOrEqual(1)

    await scrollToId(page, 'measures')
    const accent = page.locator('#measures h2 .text-key')
    await expect(accent).toBeAttached({ timeout: 15_000 })
    const info = await accent.evaluate((el: Element) => {
      const root = getComputedStyle(document.documentElement)
      return {
        running: el.getAnimations().filter((a) => a.playState === 'running').length,
        image: getComputedStyle(el).backgroundImage,
        orange: root.getPropertyValue('--color-spectrum-orange'),
        amber: root.getPropertyValue('--color-spectrum-amber'),
      }
    })
    expect(info.running).toBe(0)
    expect(info.image).toContain(hexToRgb(info.orange))
    expect(info.image).toContain(hexToRgb(info.amber))
  })
})

test.describe('reduced motion', () => {
  test('no infinite animation keeps running', async ({ page }: Fixtures) => {
    only('desktop')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    for (const id of SECTIONS) await scrollToId(page, id)
    await settle(1000)
    const infinite = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity && a.playState === 'running')
        .map((a) => {
          const target = (a.effect as KeyframeEffect | null)?.target
          const name = (a as CSSAnimation).animationName ?? a.constructor.name
          return `${name} on ${target?.tagName.toLowerCase()}.${String(target?.className).slice(0, 60)}`
        }),
    )
    expect(infinite).toEqual([])
  })
})

test.describe('focus', () => {
  test('a deck chevron shows the ring on Tab and none on click', async ({ page }: Fixtures) => {
    only('desktop')
    await gotoHome(page)
    await scrollToId(page, 'symphony')
    const chevron = page.getByRole('button', { name: 'Previous piece' })
    const outline = () =>
      chevron.evaluate((el: Element) => {
        const cs = getComputedStyle(el)
        return { width: parseFloat(cs.outlineWidth), style: cs.outlineStyle, color: cs.outlineColor }
      })

    // A mouse click first, before any key has been pressed: focus, no ring.
    await chevron.click()
    await expect(chevron).toBeFocused()
    expect((await outline()).style).toBe('none')

    // Then from the link just before it, by keyboard.
    await page.getByRole('link', { name: /setlist/i }).first().focus()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      if (await chevron.evaluate((el: Element) => el === document.activeElement)) break
    }
    await expect(chevron).toBeFocused()
    const ring = await outline()
    expect(ring.style).not.toBe('none')
    expect(ring.width).toBeGreaterThanOrEqual(2)
    expect(alphaOf(ring.color), ring.color).toBeGreaterThanOrEqual(0.8)
  })
})

test.describe('headings', () => {
  test('section headings have their real names before they assemble', async ({ page }: Fixtures) => {
    only('desktop')
    await gotoHome(page)
    await expect(page.getByRole('heading', { name: 'The Measures' })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'The Symphony' })).toBeAttached()
    expect(await page.evaluate(() => document.querySelectorAll('h2 div').length)).toBe(0)
  })

  test('the hero name still breaks the same way', async ({ page }: Fixtures) => {
    // Both viewports: Roman / Kucheryavyy on two lines, as at abb0023.
    await gotoHome(page)
    await page.evaluate(() => document.fonts.ready)
    const lines = await page.locator('#hero h1').evaluate((h1: Element) => {
      const rows: { top: number; text: string }[] = []
      const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? ''
        for (let i = 0; i < text.length; i++) {
          if (!text[i].trim()) continue
          const range = document.createRange()
          range.setStart(node, i)
          range.setEnd(node, i + 1)
          const rect = range.getClientRects()[0]
          if (!rect) continue
          const top = Math.round(rect.top)
          let row = rows.find((r) => Math.abs(r.top - top) < 8)
          if (!row) rows.push((row = { top, text: '' }))
          row.text += text[i]
        }
      }
      return rows.sort((a, b) => a.top - b.top).map((r) => r.text)
    })
    expect(lines).toEqual(['Roman', 'Kucheryavyy'])
  })
})

test.describe('manifesto', () => {
  test('the readout is 16px on a phone and keeps leading-relaxed', async ({ page }: Fixtures) => {
    only('mobile')
    await gotoHome(page)
    const row = page.locator('#interlude div[aria-hidden="true"].flex-wrap')
    const type = await row.evaluate((el: Element) => {
      const cs = getComputedStyle(el)
      return { size: cs.fontSize, lineHeight: parseFloat(cs.lineHeight), cls: el.className }
    })
    expect(type.size).toBe('16px')
    expect(type.cls).toContain('leading-relaxed')
    expect(type.lineHeight).toBeCloseTo(16 * 1.625, 1)
  })
})
