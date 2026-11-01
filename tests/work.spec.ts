import { expect, test, type Page } from '@playwright/test'
import { PROJECTS } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { project, sleep } from './helpers'

/**
 * Act I, the client work (src/components/stage/work.tsx): nine folios on
 * StackingCards. From lg they stack as they always have; on a phone held
 * upright that is tall enough (globals.css `stack-phone`) they stack too,
 * composed for the phone: a folio of min(33rem, the screen less 90px), 6px
 * steps under the top bar, the first three edges kept. Everywhere else
 * (short or landscape phones, tablets, a phone asking for less motion) they
 * lie flat, and each rises into view once. No frames: no border, rule,
 * rivet, tablet or dashed box; the number is type and the link a text link.
 *
 * Phone cases run in the mobile project (a touch screen at DPR 2), resized
 * per case; desktop cases in the desktop project at 1440x900.
 */

const N = PROJECTS.length
const STEP = 6
const TOP = 64
const CAP = 3

/** Opens the home page at `size` (reduced motion if asked) and waits until Act I is hydrated. */
async function openWork(page: Page, size?: { width: number; height: number }, reduce = false, path = '/') {
  if (size) await page.setViewportSize(size)
  if (reduce) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(path)
  await expect(page.locator('#hero-title')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#work [data-slot="card"]')).toHaveCount(N)
  await page.evaluate(() => document.fonts.ready)
  // React has hydrated the stack once its node carries React's props.
  await expect
    .poll(() => page.evaluate(() => Object.keys(document.querySelector('#work [data-stack-item]')!.parentElement!).some((k) => k.startsWith('__reactProps'))))
    .toBe(true)
  await sleep(300)
}

/** Records every element the page animates with the Web Animations API (data-animated), from before the page's own scripts run. */
async function recordAnimations(page: Page) {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate
    Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>) {
      this.setAttribute('data-animated', '')
      return animate.apply(this, args)
    }
  })
}

/** How many folios have been animated (their own box: the card's parent). */
const animatedFolios = (page: Page) =>
  page.evaluate(() => [...document.querySelectorAll('#work [data-slot="card"]')].filter((c) => c.parentElement!.hasAttribute('data-animated')).map((c) => c.querySelector('h3')!.textContent))

/** Scrolls to where slot `i` has just pinned (the stack's top plus every slot before it), as bringToFront does. */
async function pin(page: Page, i: number) {
  await page.evaluate((i) => {
    const items = [...document.querySelectorAll<HTMLElement>('#work [data-stack-item]')]
    let top = items[0].parentElement!.getBoundingClientRect().top + scrollY
    for (const slot of items.slice(0, i)) top += slot.offsetHeight
    scrollTo({ top, behavior: 'instant' })
  }, i)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
}

/** Each folio's layout (unscaled px, so a folio the stack has shrunk reads at its own size). */
async function folios(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#work [data-stack-item]')].map((item) => {
      const card = item.querySelector<HTMLElement>('[data-slot="card"]')!
      const c = card.getBoundingClientRect()
      const k = c.height / card.offsetHeight || 1
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect()
        return { top: (r.top - c.top) / k, bottom: (r.bottom - c.top) / k, left: (r.left - c.left) / k, right: (r.right - c.left) / k, height: r.height / k }
      }
      const way = card.querySelector('a, p.italic')!
      const plate = card.querySelector('img')!.parentElement!
      const words = way.closest('.flex-col') as HTMLElement
      const description = words.querySelector('h3 + p')!
      return {
        position: getComputedStyle(item).position,
        transform: getComputedStyle(item.firstElementChild!).transform,
        height: card.offsetHeight,
        width: card.offsetWidth,
        top: c.top,
        bottom: c.bottom,
        way: rel(way),
        plate: rel(plate),
        words: rel(words),
        wordsOverflow: words.scrollHeight - words.clientHeight,
        description: description.textContent,
        descriptionBottom: rel(description).bottom,
      }
    }),
  )
}

const stacking: [number, number][] = [
  [340, 640],
  [360, 640],
  [360, 780],
  [375, 548],
  [375, 667],
  [390, 664],
  [390, 844],
  [412, 915],
  [430, 932],
]

test.describe('Act I on a phone', () => {
  test.skip(() => project() !== 'mobile', 'Phone layouts, in the mobile project (touch, DPR 2).')

  for (const [width, height] of stacking) {
    test(`stacks at ${width}x${height}: folios sized to the screen, each whole, the last on screen`, async ({ page }) => {
      await openWork(page, { width, height })
      const start = await folios(page)
      const cardH = Math.min(528, height - 90)
      for (const [i, f] of start.entries()) {
        const what = `folio ${i + 1} (${PROJECTS[i].id})`
        expect(f.position, what).toBe('sticky')
        expect(Math.abs(f.height - cardH), `${what}: height ${f.height}, expected ${cardH}`).toBeLessThanOrEqual(1)
        // Its link (or status) clear of the foot, nothing cut: the words fit, the description whole.
        expect(f.height - f.way.bottom, `${what}: link to foot`).toBeGreaterThanOrEqual(20)
        expect(f.wordsOverflow, `${what}: the words overflow`).toBeLessThanOrEqual(1)
        expect(f.description, what).toBe(PROJECTS[i].description)
        expect(f.descriptionBottom, what).toBeLessThan(f.way.top)
        // The plate, edge to edge at the head: 7rem at least, 16:10 at most.
        expect(f.plate.top, what).toBeCloseTo(0, 0)
        expect(f.plate.left, what).toBeCloseTo(0, 0)
        expect(f.plate.right, what).toBeCloseTo(f.width, 0)
        expect(f.plate.height, what).toBeGreaterThanOrEqual(112)
        expect(f.plate.height, what).toBeLessThanOrEqual(f.width * 0.625 + 1)
      }
      // Each pins 6px below the one before, from 4rem; past the third, on the third's step.
      for (let i = 0; i < N; i++) {
        await pin(page, i)
        const f = (await folios(page))[i]
        expect(Math.round(f.top), `folio ${i + 1} pinned`).toBe(TOP + Math.min(i, CAP) * STEP)
        if (i === N - 1) expect(f.bottom, 'the last folio, the stack complete').toBeLessThanOrEqual(height)
      }
    })
  }

  for (const [width, height, why] of [
    [320, 568, 'a short narrow phone'],
    [667, 375, 'a phone on its side'],
    [844, 390, 'a wide phone on its side: two columns'],
  ] as const) {
    test(`lies flat at ${width}x${height} (${why})`, async ({ page }) => {
      await openWork(page, { width, height })
      const all = await folios(page)
      for (const [i, f] of all.entries()) {
        expect(f.position, `folio ${i + 1}`).toBe('static')
        expect(f.transform, `folio ${i + 1}`).toBe('none')
        expect(f.wordsOverflow, `folio ${i + 1}`).toBeLessThanOrEqual(1)
        expect(f.description).toBe(PROJECTS[i].description)
        expect(f.plate.height / f.width, `folio ${i + 1}: the plate at 16:10`).toBeCloseTo(0.625, 2)
      }
      if (width >= 768) {
        const [a, b] = await page.locator('#work [data-slot="card"]').evaluateAll((cards) => cards.slice(0, 2).map((c) => c.getBoundingClientRect().top))
        expect(Math.round(a), 'two folios to a row').toBe(Math.round(b))
      }
    })
  }

  test('lies flat under reduced motion, and nothing rises', async ({ page }) => {
    await openWork(page, { width: 390, height: 844 }, true)
    const all = await folios(page)
    for (const f of all) {
      expect(f.position).toBe('static')
      expect(f.transform).toBe('none')
    }
    await page.locator('#work [data-stack-item]').nth(4).scrollIntoViewIfNeeded()
    await sleep(300)
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('#work [data-slot="card"]')].filter((c) => c.parentElement!.getAnimations().length || getComputedStyle(c.parentElement!).opacity !== '1').length,
    )
    expect(moving).toBe(0)
  })

  test('flat, each folio below the screen rises into view once; one already on screen never fades', async ({ page }) => {
    await openWork(page, { width: 667, height: 375 })
    const leaf = (i: number) => page.locator('#work [data-slot="card"]').nth(i).locator('..')
    // Below the screen: held at its first frame.
    await expect.poll(() => leaf(2).evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
    await leaf(2).evaluate((el) => el.closest('[data-stack-item]')!.scrollIntoView({ block: 'center', behavior: 'instant' }))
    // In view: it plays, ends whole, and lets go.
    await expect.poll(() => leaf(2).evaluate((el) => [getComputedStyle(el).opacity, el.getAnimations().length].join())).toBe('1,0')
    // Passed unseen (a jump to a later act): let go, whole.
    await page.evaluate(() => document.querySelector('#contact')!.scrollIntoView({ behavior: 'instant' }))
    await sleep(300)
    expect(await leaf(6).evaluate((el) => [getComputedStyle(el).opacity, el.getAnimations().length].join())).toBe('1,0')

  })

  test('flat, a folio on screen as the page starts is never hidden to be brought in again', async ({ page }) => {
    await recordAnimations(page)
    // A tablet's two columns: landing on the act puts the first row on screen.
    await openWork(page, { width: 768, height: 1024 }, false, '/#work')
    const onScreen = await page.evaluate(() =>
      [...document.querySelectorAll('#work [data-slot="card"]')].filter((c) => c.getBoundingClientRect().top < innerHeight).map((c) => c.querySelector('h3')!.textContent),
    )
    expect(onScreen.length).toBeGreaterThan(0)
    const animated = await animatedFolios(page)
    for (const title of onScreen) expect(animated, `${title} was on screen`).not.toContain(title)
    // The ones below were held, to rise.
    expect(animated.length).toBeGreaterThan(0)
  })

  test('stacking, the folios arrive by the stack alone: none fades or rises', async ({ page }) => {
    await recordAnimations(page)
    await openWork(page, { width: 390, height: 844 })
    for (const i of [0, 3, 8]) {
      await pin(page, i)
      await sleep(200)
    }
    expect(await animatedFolios(page)).toEqual([])
  })

  for (const [width, height] of [
    [375, 548],
    [390, 844],
  ] as const) {
    test(`keyboard at ${width}x${height}: each link comes to the front, whole, clear of the top bar`, async ({ page }) => {
      await openWork(page, { width, height })
      const links = page.locator('#work a')
      const count = await links.count()
      expect(count).toBe(PROJECTS.filter((p) => p.url).length)
      // Into keyboard modality just before the first link, then Tab through them.
      await links.first().focus()
      await page.keyboard.press('Shift+Tab')
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('Tab')
        await expect(links.nth(i)).toBeFocused()
        await sleep(150)
        const seen = await links.nth(i).evaluate((a) => {
          const r = a.getBoundingClientRect()
          const bar = document.querySelector('header')!.getBoundingClientRect()
          const hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2)
          return { top: r.top, bottom: r.bottom, barBottom: bar.bottom, hit: !!hit && (a === hit || a.contains(hit)), ring: getComputedStyle(a).outlineStyle }
        })
        expect(seen.top, `link ${i + 1} below the top bar`).toBeGreaterThanOrEqual(seen.barBottom)
        expect(seen.bottom, `link ${i + 1} on screen`).toBeLessThanOrEqual(height)
        expect(seen.hit, `link ${i + 1} not painted over`).toBe(true)
        expect(seen.ring, `link ${i + 1} ringed`).not.toBe('none')
      }
    })
  }
})

test.describe('Act I on desktop', () => {
  test.skip(() => project() !== 'desktop', 'The wide stack, at 1440x900.')

  test('the wide stack as it was: 464px folios pinned at 104 + 12i, the plate beside the words', async ({ page }) => {
    await openWork(page)
    const start = await folios(page)
    for (const [i, f] of start.entries()) {
      expect(f.position).toBe('sticky')
      expect(f.height, `folio ${i + 1}`).toBe(464)
      expect(f.wordsOverflow, `folio ${i + 1}`).toBeLessThanOrEqual(1)
      expect(f.description).toBe(PROJECTS[i].description)
      // The plate fills its half, top to foot, at the right edge; the words to its left.
      expect(f.plate.top).toBeCloseTo(0, 0)
      expect(f.plate.right).toBeCloseTo(f.width, 0)
      expect(f.plate.height).toBeCloseTo(f.height, 0)
      expect(f.words.right).toBeLessThanOrEqual(f.plate.left + 1)
      expect(f.height - f.way.bottom).toBeGreaterThanOrEqual(20)
    }
    for (let i = 0; i < N; i++) {
      await pin(page, i)
      const f = (await folios(page))[i]
      expect(Math.round(f.top), `folio ${i + 1} pinned`).toBe(104 + 12 * i)
      if (i === N - 1) expect(f.bottom).toBeLessThanOrEqual(900)
    }
  })

  test('under reduced motion the wide stack still pins but never scales', async ({ page }) => {
    await openWork(page, undefined, true)
    for (const i of [2, 6, 8]) {
      await pin(page, i)
      const all = await folios(page)
      for (const f of all) {
        expect(f.position).toBe('sticky')
        expect(f.transform).toBe('none')
      }
    }
  })
})

test.describe('Act I, every size', () => {
  test.skip(() => project() === 'no-webgl', 'Same layout as desktop.')

  test('no frames: no border, rule, rivet, tablet or dashed box; the number as type, the link a text link', async ({ page }) => {
    await openWork(page)
    const found = await page.evaluate(() => {
      const out: string[] = []
      for (const card of document.querySelectorAll<HTMLElement>('#work [data-slot="card"]')) {
        for (const el of [card, ...card.querySelectorAll<HTMLElement>('*')]) {
          const s = getComputedStyle(el)
          const edge = ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0)
          if (edge) out.push(`border on ${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 40)}`)
          if (el.tagName === 'svg') out.push('an svg')
          if (s.borderStyle.includes('dashed')) out.push('a dashed edge')
        }
      }
      return out
    })
    expect(found).toEqual([])
    // "II / IX" in Cinzel, the place in gold; screen readers read "02 / 09".
    const number = page.locator('#work [data-slot="card"]').nth(1).locator('p').first()
    await expect(number.locator('[aria-hidden="true"]')).toHaveText(['II', `/ ${toRoman(N)}`])
    await expect(number.locator('.sr-only')).toHaveText(`02 / ${String(N).padStart(2, '0')}`)
    expect(await number.locator('[aria-hidden="true"]').first().evaluate((el) => [getComputedStyle(el).fontFamily.includes('Cinzel'), getComputedStyle(el).color].join())).toBe('true,rgb(214, 178, 94)')
    const link = page.locator('#work a').first()
    const look = await link.evaluate((a) => {
      const s = getComputedStyle(a)
      return { line: s.textDecorationLine, height: a.getBoundingClientRect().height, size: parseFloat(s.fontSize), target: a.getAttribute('target') }
    })
    expect(look.line).toBe('underline')
    expect(look.height).toBeGreaterThanOrEqual(44)
    expect(look.size).toBeGreaterThanOrEqual(13)
    expect(look.target).toBe('_blank')
    // A project with no link yet: its status as a quiet italic line, in his face, 18px.
    const pending = PROJECTS.find((p) => !p.url)
    if (pending) {
      const status = page.locator('#work [data-slot="card"]').nth(PROJECTS.indexOf(pending)).locator('p.italic')
      await expect(status).toHaveText(pending.status!)
      expect(await status.evaluate((p) => [getComputedStyle(p).fontStyle, parseFloat(getComputedStyle(p).fontSize) >= 18].join())).toBe('italic,true')
    }
  })

  test('every visible text in Act I is 12px or more', async ({ page }) => {
    await openWork(page)
    const small = await page.evaluate(() => {
      const out: string[] = []
      for (const el of document.querySelectorAll<HTMLElement>('#work *')) {
        if (el.closest('.sr-only')) continue
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue
        const size = parseFloat(getComputedStyle(el).fontSize)
        if (size < 12) out.push(`${size}px "${el.textContent!.trim().slice(0, 30)}"`)
      }
      return out
    })
    expect(small).toEqual([])
  })

  test('nothing in Act I shifts while the page scrolls through it', async ({ page }) => {
    await openWork(page)
    await page.evaluate(() => {
      const w = window as unknown as { __shifts: string[] }
      w.__shifts = []
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources: { node?: Node }[] }[]) {
          if (e.hadRecentInput) continue
          for (const s of e.sources) if (s.node && document.querySelector('#work')!.contains(s.node)) w.__shifts.push(`${e.value} ${s.node.nodeName}`)
        }
      }).observe({ type: 'layout-shift' })
    })
    const [from, to] = await page.evaluate(() => {
      const w = document.querySelector<HTMLElement>('#work')!
      const top = w.getBoundingClientRect().top + scrollY
      return [top - innerHeight, top + w.offsetHeight]
    })
    for (let y = from; y <= to; y += 160) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y)
      await sleep(40)
    }
    await sleep(500)
    expect(await page.evaluate(() => (window as unknown as { __shifts: string[] }).__shifts)).toEqual([])
  })
})
