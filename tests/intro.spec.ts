import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { PALETTE } from '@/components/stage/imperial'
import { CERTIFICATIONS, PERSON, PROJECTS, ROLES } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { collectConsole, collectCspReports, project, sleep } from './helpers'

/**
 * The Roman intro (src/components/stage/intro.tsx): when it shows, what it
 * says, the ways out, and that it is a proper modal while it is up. Every
 * other spec starts as a browser that saw it a moment ago
 * (playwright.config.ts); this one starts from nothing, or loads `/?intro`.
 */

test.use({ storageState: { cookies: [], origins: [] } })

const LAYER = '[data-intro-layer]'
const year = toRoman(new Date().getFullYear())

/** Opens `path` and waits for the intro to be up. */
async function openIntro(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator(`${LAYER} .om-root[data-up="true"]`)).toBeAttached({ timeout: 20_000 })
  await expect(page.locator('html')).toHaveAttribute('data-intro', 'up')
}

const phase = (page: Page) => page.locator(`${LAYER} .om-root`).getAttribute('data-phase')

/** Waits for the intro to have lifted and checks the page is the page again. */
async function expectGone(page: Page) {
  await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  const inert = await page.evaluate(() => Array.from(document.body.children).filter((el) => el.hasAttribute('inert')).length)
  expect(inert, 'children of <body> left inert').toBe(0)
  await expect(page.locator('#hero-title')).toBeVisible()
  // The hero's words and its two ways in, held while the intro was up, have
  // set in (stage.tsx SET_IN), and the name never waited for them.
  await expect
    .poll(() => page.locator('[data-hero-copy] > *').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity))), { timeout: 5000 })
    .toEqual([1, 1])
  expect(await page.locator('#hero-title').evaluate((h1) => Number(getComputedStyle(h1).opacity))).toBe(1)
}

/**
 * The page scrolls again: the document is no longer held still (the check
 * that counts: a script's scrollBy moves it even while it is), and there is
 * a page to scroll.
 */
async function expectScrolls(page: Page) {
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden')
  const before = await page.evaluate(() => window.scrollY)
  await page.evaluate(() => window.scrollBy(0, 300))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before)
}

/** Swipes up from the middle of the screen with real touch events. */
async function swipeUp(context: BrowserContext, page: Page) {
  const { width, height } = page.viewportSize()!
  const x = Math.round(width / 2)
  const y = Math.round(height * 0.7)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 20 }] })
    await sleep(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

/** The stage's script chunks (not the stylesheet, which names the layer too). */
const STAGE_SCRIPTS = /\/_next\/static\/chunks\/.*\.js(\?|$)/

/**
 * Every shaft of the stage's light drawn at its peak: old-masters-preloader
 * draws each shaft as a gradient of its glow from an alpha that swings
 * between 0.7 and 1 of 0.055 (and half that at 0.55 of its length), so
 * pinning those stops at their maximum is the light at its brightest. Only
 * the glow's own gradients are touched.
 */
async function lightAtPeak(page: Page) {
  const glow = PALETTE.glow.match(/[0-9a-f]{2}/gi)!.map((h) => parseInt(h, 16)).join(', ')
  await page.addInitScript((glow) => {
    const add = CanvasGradient.prototype.addColorStop
    CanvasGradient.prototype.addColorStop = function (offset: number, color: string) {
      const m = new RegExp(`^rgba\\(${glow}, ([\\d.]+)\\)$`).exec(color)
      if (m && Number(m[1]) < 0.06) color = `rgba(${glow}, ${offset === 0 ? 0.055 : offset < 0.6 ? 0.0275 : 0})`
      return add.call(this, offset, color)
    }
  }, glow)
}

/**
 * Moves the pointer so the stage's spotlight (old-masters-preloader: a glow
 * at 50% + 24% of the pointer's x and 40% + 22% of its y, across a box 20%
 * larger than the stage on every side) stands as near the middle of `el` as
 * it can reach, and waits for it to arrive (it eases after the pointer).
 */
async function spotlightOn(page: Page, el: Locator) {
  const box = (await el.boundingBox())!
  const stage = (await page.locator(`${LAYER} .om-stage`).boundingBox())!
  const sx = (((box.x + box.width / 2 - stage.x) / stage.width + 0.2) / 1.4) * 100
  const sy = (((box.y + box.height / 2 - stage.y) / stage.height + 0.2) / 1.4) * 100
  const tx = Math.max(-1, Math.min(1, (sx - 50) / 24))
  const ty = Math.max(-1, Math.min(1, (sy - 40) / 22))
  await page.mouse.move(stage.x + (tx / 2 + 0.5) * stage.width, stage.y + (ty / 2 + 0.5) * stage.height, { steps: 4 })
  await sleep(1500)
}

/** Where an element's glyphs are (drawn in magenta, no halo), and its ink, for inkContrast. */
async function glyphsOf(page: Page, el: Locator) {
  const box = (await el.boundingBox())!
  const vp = page.viewportSize()!
  const x = Math.max(0, Math.floor(box.x) - 2)
  const y = Math.max(0, Math.floor(box.y) - 2)
  const clip = { x, y, width: Math.min(vp.width - x, Math.ceil(box.width) + 4), height: Math.min(vp.height - y, Math.ceil(box.height) + 4) }
  const { ink, alpha } = await el.evaluate((e) => {
    let alpha = 1
    for (let n: Element | null = e; n; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity)
    return { ink: getComputedStyle(e).color, alpha }
  })
  // (Its ink may ease from one colour to the next, as ENTER's does: not while it is read.)
  await el.evaluate((e) => {
    ;(e as HTMLElement).style.setProperty('transition', 'none', 'important')
    ;(e as HTMLElement).style.setProperty('color', '#ff00ff', 'important')
    ;(e as HTMLElement).style.setProperty('text-shadow', 'none', 'important')
  })
  const glyphs = (await page.screenshot({ clip, animations: 'allow' })).toString('base64')
  await el.evaluate((e) => {
    for (const prop of ['color', 'text-shadow', 'transition']) (e as HTMLElement).style.removeProperty(prop)
  })
  return { clip, glyphs, ink, alpha }
}

/**
 * The contrast of an element's ink against what stands behind its glyphs,
 * read off the screen with its ink made transparent (its own halo left in
 * place: that is what the eye sees round each letter). The 5th percentile
 * over the glyphs' pixels (a speck of dust passing behind one letter does
 * not decide it).
 */
async function inkContrast(page: Page, el: Locator, found?: Awaited<ReturnType<typeof glyphsOf>>) {
  const { clip, glyphs, ink, alpha } = found ?? (await glyphsOf(page, el))
  await el.evaluate((e) => {
    ;(e as HTMLElement).style.setProperty('transition', 'none', 'important')
    ;(e as HTMLElement).style.setProperty('color', 'transparent', 'important')
  })
  const behind = (await page.screenshot({ clip, animations: 'allow' })).toString('base64')
  await el.evaluate((e) => {
    for (const prop of ['color', 'transition']) (e as HTMLElement).style.removeProperty(prop)
  })
  return page.evaluate(
    async ({ behind, glyphs, ink, alpha }) => {
      const read = async (b64: string) => {
        const img = new Image()
        img.src = `data:image/png;base64,${b64}`
        await img.decode()
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, c.width, c.height).data
      }
      const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
      const [bg, mg] = await Promise.all([read(behind), read(glyphs)])
      const [tr, tg, tb] = ink.match(/[\d.]+/g)!.map(Number)
      const ratios: number[] = []
      for (let i = 0; i < mg.length; i += 4) {
        if (!(mg[i] > 200 && mg[i + 1] < 90 && mg[i + 2] > 200)) continue
        const text = lum(alpha * tr + (1 - alpha) * bg[i], alpha * tg + (1 - alpha) * bg[i + 1], alpha * tb + (1 - alpha) * bg[i + 2])
        const back = lum(bg[i], bg[i + 1], bg[i + 2])
        ratios.push((Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05))
      }
      ratios.sort((a, b) => a - b)
      return { ratio: ratios[Math.floor(ratios.length * 0.05)] ?? 0, count: ratios.length }
    },
    { behind, glyphs, ink, alpha },
  )
}

/** The names of the CSS animations the stage is running (or holding at their end) right now. */
const runningAnimations = (page: Page) =>
  page.evaluate((sel) => {
    const layer = document.querySelector(sel)
    return layer ? layer.getAnimations({ subtree: true }).map((a) => (a as CSSAnimation).animationName ?? '').filter(Boolean) : []
  }, LAYER)

/** A short fingerprint of what the light canvas holds (its pixels, as an image). */
const lightPrint = (page: Page) =>
  page.locator(`${LAYER} canvas.om-light`).evaluate((c: HTMLCanvasElement) => {
    const url = c.toDataURL()
    let h = 0
    for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0
    const blank = document.createElement('canvas')
    blank.width = c.width
    blank.height = c.height
    return { hash: h, drawn: url !== blank.toDataURL(), size: [c.width, c.height] }
  })

const fromRoman = (s: string) => {
  if (s === '·') return 0
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let n = 0
  for (let i = 0; i < s.length; i++) n += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]]
  return n
}

test.describe('when the intro shows', () => {
  test('a fresh visit opens on it, a modal over a hidden, inert page, and it is remembered', async ({ page }) => {
    await openIntro(page)
    const dialog = page.getByRole('dialog', { name: 'Intro' })
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    // The page beneath is laid out but not drawn, and out of reach.
    await expect(page.locator('#hero-title')).toBeHidden()
    expect(await page.evaluate(() => document.querySelector('main')!.closest('[inert]') !== null)).toBe(true)
    const seen = await page.evaluate(() => Number(localStorage.getItem('rk:intro')))
    expect(Date.now() - seen).toBeLessThan(60_000)

    // Within the next 12 hours the page opens straight on the Stage.
    await page.reload()
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('after 12 hours it shows again', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rk:intro', String(Date.now() - 12 * 60 * 60 * 1000 - 60_000)))
    await openIntro(page)
  })

  test('?intro shows it again inside the 12 hours', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rk:intro', String(Date.now())))
    await openIntro(page, '/?intro')
  })

  test('a deep link goes straight to its section', async ({ page }) => {
    await page.goto('/#contact')
    await expect(page.locator('#contact')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('never under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?intro')
    await expect(page.locator('#hero-title')).toBeVisible({ timeout: 20_000 })
    await sleep(1500)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})

test.describe('without scripts', () => {
  test.use({ javaScriptEnabled: false })
  test('there is no intro, only the page', async ({ page }) => {
    await page.goto('/?intro')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(page.locator('#hero-title')).toBeVisible()
  })
})

test.describe('what it says', () => {
  test('the count climbs in Roman numerals to C', async ({ page }) => {
    await openIntro(page)
    const seen: string[] = []
    const num = page.locator(`${LAYER} .om-num`)
    for (let i = 0; i < 60 && (await phase(page)) === 'load'; i++) {
      seen.push((await num.textContent())!.trim())
      await sleep(100)
    }
    await expect(num).toHaveText('C', { timeout: 15_000 })
    for (const s of seen) expect(s, s).toMatch(/^(·|[IVXLC]+)$/)
    const values = seen.map(fromRoman)
    for (let i = 1; i < values.length; i++) expect(values[i], seen.join(' ')).toBeGreaterThanOrEqual(values[i - 1])
    expect(new Set(seen).size, seen.join(' ')).toBeGreaterThan(3)
  })

  test('the landing says his tagline, the prologue and its year, his counts and, on wide screens, his day and his calling', async ({ page }) => {
    await openIntro(page)
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    const layer = page.locator(LAYER)
    await expect(layer).toContainText(PERSON.tagline)
    await expect(layer).toContainText(`Prologue · ${year}`)
    await expect(layer.locator('.om-pill').first()).toContainText(`${toRoman(PROJECTS.length)}`)
    if (project() !== 'mobile') {
      await expect(layer.locator('.om-pill')).toHaveText([
        `${toRoman(PROJECTS.length)} client projects`,
        `${toRoman(CERTIFICATIONS.length)} Salesforce certifications`,
      ])
      await expect(layer).toContainText(`${ROLES[0].title}, ${ROLES[0].company}`)
      await expect(layer).toContainText(PERSON.music)
    }
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible()
  })

  test('the published animation plays: the word fills, the rule draws in, the stars twinkle, the counts in their pills; nothing under 12px', async ({ page }) => {
    await openIntro(page)
    const root = page.locator(`${LAYER} .om-root`)
    // The word fills from the floor as the load climbs.
    const fills: number[] = []
    for (let i = 0; i < 60 && (await phase(page)) === 'load'; i++) {
      fills.push(parseFloat(await root.locator('.om-word').evaluate((w) => (w as HTMLElement).style.getPropertyValue('--om-fill') || '0')))
      await sleep(100)
    }
    expect(new Set(fills).size, `the fill as it climbed: ${fills.join(' ')}`).toBeGreaterThan(3)
    for (let i = 1; i < fills.length; i++) expect(fills[i], fills.join(' ')).toBeGreaterThanOrEqual(fills[i - 1])
    // The rule beside the eyebrow is drawn in (its scale run out to 1), a line on each side of it.
    await expect.poll(() => root.locator('.om-rule').evaluate((el) => getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)')
    await expect(root.locator('.om-rule')).toBeVisible()
    // The stars are out, and twinkle.
    await expect.poll(() => root.locator('.om-star').evaluateAll((all) => all.filter((s) => Number(getComputedStyle(s).opacity) > 0.9).length)).toBeGreaterThanOrEqual(4)
    expect(await runningAnimations(page)).toContain('om-twinkle')
    // The counts stand in their pills: outlined in the rule's ink.
    for (const pill of await root.locator('.om-pill').all()) {
      const edge = await pill.evaluate((el) => ({ width: getComputedStyle(el).borderTopWidth, style: getComputedStyle(el).borderTopStyle, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) }))
      expect(edge.width).toBe('1px')
      expect(edge.style).toBe('solid')
      expect(edge.radius).toBeGreaterThan(10)
    }
    await expect(root).toHaveAttribute('data-phase', 'landing', { timeout: 20_000 })
    // Nothing shown under the page's 12px floor.
    const small = await root.evaluate((el) =>
      [...el.querySelectorAll<HTMLElement>('.om-chrome *')]
        .filter((n) => n.childNodes.length && [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim()))
        .filter((n) => n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden' && Number(getComputedStyle(n).opacity) > 0)
        .filter((n) => parseFloat(getComputedStyle(n).fontSize) < 12)
        .map((n) => `${n.className}: ${getComputedStyle(n).fontSize}`),
    )
    expect(small).toEqual([])
    // ENTER as the component draws it: outlined in the text ink over a veil of the ground.
    const enter = page.getByRole('button', { name: 'Enter' })
    await expect(enter).toBeVisible()
    const look = await enter.evaluate((el) => ({ edge: `${getComputedStyle(el).borderTopWidth} ${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopColor}`, fill: getComputedStyle(el).backgroundColor }))
    expect(look).toEqual({ edge: '1px solid rgb(243, 238, 230)', fill: 'rgba(11, 8, 6, 0.3)' })
    // The scroll hint's line falls, beside the word.
    await expect(root.locator('.om-hint i')).toBeAttached()
    expect(await runningAnimations(page)).toContain('om-hint')
  })

  test('the unveil plays: the flood opens as its circle, under the flash and the sheen; then the figures rise', async ({ page }) => {
    await openIntro(page)
    const root = page.locator(`${LAYER} .om-root`)
    // Closed while it loads.
    expect(await root.locator('.om-flood').evaluate((el) => getComputedStyle(el).clipPath)).toBe('circle(0% at 50% 56%)')
    // From the moment of the unveil, the flood's clip read on every frame for 2.5 s.
    await page.evaluate((sel) => {
      const w = window as unknown as { flood: string[]; floodDone: boolean; unveiled: string[] }
      const root = document.querySelector(`${sel} .om-root`)!
      const flood = root.querySelector('.om-flood')!
      w.flood = []
      w.unveiled = []
      const watch = new MutationObserver(() => {
        if (root.getAttribute('data-phase') !== 'unveil') return
        watch.disconnect()
        // The flash and the sheen, as the unveil starts.
        w.unveiled = root.getAnimations({ subtree: true }).map((a) => (a as CSSAnimation).animationName ?? '')
        const start = performance.now()
        const read = () => {
          w.flood.push(`${getComputedStyle(flood).clipPath} ${getComputedStyle(flood).transitionProperty} ${getComputedStyle(flood).transitionDuration}`)
          if (performance.now() - start < 2500) requestAnimationFrame(read)
          else w.floodDone = true
        }
        read()
      })
      watch.observe(root, { attributes: true, attributeFilter: ['data-phase'] })
    }, LAYER)
    await expect.poll(() => page.evaluate(() => !!(window as unknown as { floodDone?: boolean }).floodDone), { timeout: 30_000 }).toBe(true)
    const { flood, unveiled } = await page.evaluate(() => {
      const w = window as unknown as { flood: string[]; unveiled: string[] }
      return { flood: w.flood, unveiled: w.unveiled }
    })
    expect(unveiled).toContain('om-flash')
    expect(unveiled).toContain('om-sheen')
    // A circle from the middle of the stage, eased open (a transition, not a cut), never closing, to the whole stage.
    const radii = flood.map((f) => {
      expect(f).toMatch(/^circle\([\d.]+% at 50% 56%\) clip-path 1\.7s$/)
      return parseFloat(f.slice('circle('.length))
    })
    for (let i = 1; i < radii.length; i++) expect(radii[i], radii.join(' ')).toBeGreaterThanOrEqual(radii[i - 1])
    expect(radii[0], radii.join(' ')).toBeLessThan(60)
    expect(radii.at(-1)!, radii.join(' ')).toBeGreaterThan(110)
    // The figures rise into the light.
    await expect.poll(() => root.locator('.om-fig').first().evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 5000 }).toBeGreaterThan(0.9)
  })

  test('the landing lives: the light and its dust, the spotlight, the figures breathing, the grain moving', async ({ page }) => {
    await openIntro(page)
    const root = page.locator(`${LAYER} .om-root`)
    await expect(root).toHaveAttribute('data-phase', 'landing', { timeout: 20_000 })
    // The light: its canvas shown, drawn, and moving (the dust drifts).
    const light = root.locator('canvas.om-light')
    await expect(light).toBeVisible()
    await expect.poll(() => light.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 6000 }).toBe(1)
    const first = await lightPrint(page)
    expect(first.drawn, 'the light canvas has drawn its shafts and dust').toBe(true)
    await sleep(400)
    expect((await lightPrint(page)).hash, 'the light canvas moves').not.toBe(first.hash)
    // The spotlight is up, and follows the pointer.
    await expect(root.locator('.om-spot')).toBeVisible()
    await expect.poll(() => root.locator('.om-spot').evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 6000 }).toBe(1)
    await page.mouse.move(100, 100)
    await page.mouse.move(page.viewportSize()!.width - 100, page.viewportSize()!.height - 100, { steps: 6 })
    await expect.poll(() => root.evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--om-sx')))).toBeGreaterThan(55)
    // The figures breathe; the grain moves.
    const names = await runningAnimations(page)
    expect(names).toContain('om-bob')
    expect(names).toContain('om-grain')
  })

  test('its words clear AA over the light at its brightest: every shaft at its peak, the spotlight under each', async ({ page }) => {
    test.setTimeout(150_000)
    await lightAtPeak(page)
    await openIntro(page)
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    // The copy, the asides and the scroll hint have faded in.
    await sleep(4500)
    const labels = ['.om-brand', '.om-eyebrow', '.om-pill', '.om-tagline', '.om-cta', '.om-plate', '.om-hint span']
    if (project() !== 'mobile') labels.push('.om-top a', '.om-aside b', '.om-aside p')
    const seen: string[] = []
    for (const sel of labels) {
      for (const [k, el] of (await page.locator(`${LAYER} ${sel}`).all()).entries()) {
        if (!(await el.isVisible())) continue
        await spotlightOn(page, el)
        const { ratio, count } = await inkContrast(page, el)
        seen.push(`${sel}[${k}] ${ratio.toFixed(2)}`)
        expect(count, `${sel}[${k}]: glyph pixels found`).toBeGreaterThan(10)
        expect(ratio, `${sel}[${k}] against the light behind it (5th percentile)`).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(seen.length, seen.join(', ')).toBeGreaterThanOrEqual(project() === 'mobile' ? 7 : 12)
  })

  test('at the unveil the sheen and the flash pass beneath its words without taking them under AA', async ({ page }) => {
    test.setTimeout(150_000)
    await openIntro(page)
    await expect.poll(() => phase(page), { timeout: 20_000, intervals: [50] }).toBe('unveil')
    // The sheen and the flash held at each moment of their run in turn (Web
    // Animations), and the stage held at its unveil while they are read (its
    // timer would set the landing, and take them away, before the last).
    const held = await page.evaluate((sel) => {
      const w = window as unknown as { held: Animation[]; pin: MutationObserver }
      const root = document.querySelector(`${sel} .om-root`)!
      w.pin = new MutationObserver(() => {
        if (root.getAttribute('data-phase') === 'landing') root.setAttribute('data-phase', 'unveil')
      })
      w.pin.observe(root, { attributes: true, attributeFilter: ['data-phase'] })
      w.held = root.getAnimations({ subtree: true }).filter((a) => ['om-sheen', 'om-flash'].includes((a as CSSAnimation).animationName))
      w.held.forEach((a) => a.pause())
      return w.held.length
    }, LAYER)
    expect(held).toBe(2)
    // The labels along the top of the stage, read together: their glyphs once
    // (magenta, no halo), then what stands behind them (their ink made
    // transparent, their halos kept) at each moment.
    const labels = ['.om-brand', '.om-eyebrow', '.om-pill', '.om-top a'].map((sel) => `${LAYER} ${sel}`).join(', ')
    const band = { x: 0, y: 0, width: page.viewportSize()!.width, height: 140 }
    const ink = (css: string) =>
      page.evaluate(
        ({ labels, css }) => {
          let tag = document.getElementById('ink-under-test')
          if (!tag) document.head.append((tag = Object.assign(document.createElement('style'), { id: 'ink-under-test' })))
          tag.textContent = css ? `:is(${labels}) { transition: none !important; ${css} }` : ''
        },
        { labels, css },
      )
    await ink('color: #ff00ff !important; text-shadow: none !important;')
    const glyphs = (await page.screenshot({ clip: band, animations: 'allow' })).toString('base64')
    const boxes = await page.evaluate(
      (labels) =>
        [...document.querySelectorAll<HTMLElement>(labels)]
          .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
          .map((el, k) => {
            const r = el.getBoundingClientRect()
            let alpha = 1
            for (let n: Element | null = el; n; n = n.parentElement) alpha *= Number(getComputedStyle(n).opacity)
            return { key: `${el.className.toString().split(' ')[0] || el.textContent}[${k}]`, x: r.left, y: r.top, w: r.width, h: r.height, alpha }
          }),
      labels,
    )
    await ink('')
    const inks = await page.evaluate((labels) => [...document.querySelectorAll<HTMLElement>(labels)].filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden').map((el) => getComputedStyle(el).color), labels)
    expect(boxes.length).toBeGreaterThanOrEqual(project() === 'mobile' ? 4 : 8)
    const worst = new Map<string, number>()
    for (let t = 0; t <= 1200; t += 50) {
      await page.evaluate((t) => (window as unknown as { held: Animation[] }).held.forEach((a) => (a.currentTime = t)), t)
      await ink('color: transparent !important;')
      const behind = (await page.screenshot({ clip: band, animations: 'allow' })).toString('base64')
      await ink('')
      const ratios = await page.evaluate(
        async ({ behind, glyphs, boxes, inks, scale }) => {
          const read = async (b64: string) => {
            const img = new Image()
            img.src = `data:image/png;base64,${b64}`
            await img.decode()
            const c = document.createElement('canvas')
            c.width = img.width
            c.height = img.height
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            return { d: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }
          }
          const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
          const [bg, mg] = await Promise.all([read(behind), read(glyphs)])
          return boxes.map((b, k) => {
            const [tr, tg, tb] = inks[k].match(/[\d.]+/g)!.map(Number)
            const a = b.alpha
            const rs: number[] = []
            for (let y = Math.max(0, Math.floor(b.y * scale)); y < Math.min(mg.h, (b.y + b.h) * scale); y++)
              for (let x = Math.max(0, Math.floor(b.x * scale)); x < Math.min(mg.w, (b.x + b.w) * scale); x++) {
                const i = (y * mg.w + x) * 4
                if (!(mg.d[i] > 200 && mg.d[i + 1] < 90 && mg.d[i + 2] > 200)) continue
                const text = lum(a * tr + (1 - a) * bg.d[i], a * tg + (1 - a) * bg.d[i + 1], a * tb + (1 - a) * bg.d[i + 2])
                const back = lum(bg.d[i], bg.d[i + 1], bg.d[i + 2])
                rs.push((Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05))
              }
            rs.sort((p, q) => p - q)
            return rs[Math.floor(rs.length * 0.05)] ?? 99
          })
        },
        { behind, glyphs, boxes, inks, scale: await page.evaluate(() => devicePixelRatio) },
      )
      boxes.forEach((b, k) => worst.set(b.key, Math.min(worst.get(b.key) ?? 99, ratios[k])))
    }
    await page.evaluate(() => (window as unknown as { pin: MutationObserver }).pin.disconnect())
    for (const [key, ratio] of worst) expect(ratio, `${key}: its worst moment under the sheen and the flash`).toBeGreaterThanOrEqual(4.5)
  })

  test('at the unveil the sheen crosses the word behind its letters, never taking it under 3:1', async ({ page }) => {
    test.setTimeout(150_000)
    await openIntro(page)
    await expect.poll(() => phase(page), { timeout: 20_000, intervals: [50] }).toBe('unveil')
    // Everything on the stage held where it is (so the word stays put), the
    // stage held at its unveil, and the sheen and the flash stepped through
    // their run.
    const held = await page.evaluate((sel) => {
      const w = window as unknown as { held: Animation[]; pin: MutationObserver }
      const root = document.querySelector(`${sel} .om-root`)!
      w.pin = new MutationObserver(() => {
        if (root.getAttribute('data-phase') === 'landing') root.setAttribute('data-phase', 'unveil')
      })
      w.pin.observe(root, { attributes: true, attributeFilter: ['data-phase'] })
      const all = root.getAnimations({ subtree: true })
      all.forEach((a) => a.pause())
      w.held = all.filter((a) => ['om-sheen', 'om-flash'].includes((a as CSSAnimation).animationName))
      return w.held.length
    }, LAYER)
    expect(held).toBe(2)
    const box = await page.locator(`${LAYER} .om-word`).evaluate((el) => {
      const r = [...el.querySelectorAll('.om-l, .om-init')].map((s) => s.getBoundingClientRect())
      const x = Math.min(...r.map((q) => q.left)) - 8
      const y = Math.min(...r.map((q) => q.top)) - 8
      return { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(innerWidth - Math.max(0, x), Math.max(...r.map((q) => q.right)) + 8 - x), height: Math.max(...r.map((q) => q.bottom)) + 8 - y }
    })
    const green = `${LAYER} :is(.om-l, .om-init) { background-image: linear-gradient(#00ff00, #00ff00) !important; -webkit-text-stroke-color: transparent !important; }`
    let worst = { ratio: 99, t: 0 }
    for (let t = 0; t <= 1200; t += 50) {
      await page.evaluate((t) => (window as unknown as { held: Animation[] }).held.forEach((a) => (a.currentTime = t)), t)
      const real = (await page.screenshot({ clip: box, animations: 'allow' })).toString('base64')
      const tag = await page.addStyleTag({ content: green })
      const mask = (await page.screenshot({ clip: box, animations: 'allow' })).toString('base64')
      await tag.evaluate((el) => el.remove())
      // The glyphs (the letters drawn solid green, their halo kept), then
      // on the real shot: the darkest of their own pixels (5th percentile,
      // a CSS pixel in from their edge) against the brightest of the ring
      // 1 to 4 CSS pixels round them (95th percentile).
      const ratio = await page.evaluate(
        async ({ real, mask, dpr }) => {
          const read = async (b64: string) => {
            const img = new Image()
            img.src = `data:image/png;base64,${b64}`
            await img.decode()
            const c = document.createElement('canvas')
            c.width = img.width
            c.height = img.height
            const ctx = c.getContext('2d')!
            ctx.drawImage(img, 0, 0)
            return { d: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height }
          }
          const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
          const lum = (d: Uint8ClampedArray, i: number) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2])
          const [a, m] = await Promise.all([read(real), read(mask)])
          const { w, h } = m
          const glyph = new Uint8Array(w * h)
          for (let p = 0; p < w * h; p++) glyph[p] = m.d[p * 4 + 1] > 120 && m.d[p * 4 + 1] > 1.6 * Math.max(m.d[p * 4], m.d[p * 4 + 2]) ? 1 : 0
          // A square max (dilate) or min (erode) filter of radius r, separable.
          const morph = (src: Uint8Array, r: number, grow: boolean) => {
            const pass = (s: Uint8Array, dx: number, dy: number) => {
              const out = new Uint8Array(w * h)
              for (let y = 0; y < h; y++)
                for (let x = 0; x < w; x++) {
                  let v = grow ? 0 : 1
                  for (let k = -r; k <= r; k++) {
                    const xx = x + k * dx
                    const yy = y + k * dy
                    const s1 = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : s[yy * w + xx]
                    v = grow ? v | s1 : v & s1
                  }
                  out[y * w + x] = v
                }
              return out
            }
            return pass(pass(src, 1, 0), 0, 1)
          }
          const core = morph(glyph, Math.round(dpr), false)
          const inner = morph(glyph, Math.round(dpr), true)
          const outer = morph(glyph, Math.round(4 * dpr), true)
          const text: number[] = []
          const ring: number[] = []
          for (let p = 0; p < w * h; p++) {
            if (core[p]) text.push(lum(a.d, p * 4))
            else if (!inner[p] && outer[p]) ring.push(lum(a.d, p * 4))
          }
          text.sort((p, q) => p - q)
          ring.sort((p, q) => p - q)
          if (text.length < 50 || ring.length < 50) return 0
          const L1 = text[Math.floor(0.05 * (text.length - 1))]
          const L2 = ring[Math.floor(0.95 * (ring.length - 1))]
          return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
        },
        { real, mask, dpr: await page.evaluate(() => devicePixelRatio) },
      )
      if (ratio < worst.ratio) worst = { ratio, t }
    }
    await page.evaluate(() => (window as unknown as { pin: MutationObserver }).pin.disconnect())
    expect(worst.ratio, `the word at ${worst.t} ms into the sheen`).toBeGreaterThanOrEqual(3)
  })

  test('Skip rushes the load', async ({ page }) => {
    await openIntro(page)
    await page.getByRole('button', { name: 'Skip' }).click()
    // Left alone the load takes 3.6 s at least (rushed, a few frames) (its count follows the
    // component's surge and stall to the end); rushed, it is over sooner.
    await expect.poll(() => phase(page), { timeout: 3400 }).not.toBe('load')
    // Skip goes with the load; focus must not fall out of the dialog with it.
    await expect.poll(() => page.evaluate((sel) => !!document.activeElement?.closest(sel), LAYER)).toBe(true)
  })
})

test.describe('the ways out', () => {
  test('Enter lifts it onto the page the moment it shows (during the unveil too), focus on main', async ({ page }) => {
    await openIntro(page)
    const enter = page.getByRole('button', { name: 'Enter' })
    await expect(enter).toBeVisible({ timeout: 20_000 })
    // It shows from the unveil on; a click then must not be lost.
    await enter.click()
    await expectGone(page)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main')
    await expectScrolls(page)
  })

  test('on a phone held sideways ENTER takes the tap (the foot, level with it there, lets it through)', async ({ page }) => {
    test.skip(project() !== 'mobile', 'a phone on its side')
    await page.setViewportSize({ width: 844, height: 390 })
    await openIntro(page)
    const enter = page.getByRole('button', { name: 'Enter' })
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    await expect(enter).toBeVisible()
    // What a tap in its middle lands on is ENTER itself.
    const box = (await enter.boundingBox())!
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.om-cta'), { x: box.x + box.width / 2, y: box.y + box.height / 2 })).toBe(true)
    await enter.click()
    await expectGone(page)
  })

  test('Escape during the load lifts it at once, without the unveil', async ({ page }) => {
    await openIntro(page)
    expect(await phase(page)).toBe('load')
    const phases: string[] = []
    await page.exposeFunction('notePhase', (p: string) => phases.push(p))
    await page.evaluate((sel) => {
      const root = document.querySelector(`${sel} .om-root`)!
      new MutationObserver(() => (window as unknown as { notePhase: (p: string) => void }).notePhase(root.getAttribute('data-phase') ?? '')).observe(root, {
        attributes: true,
        attributeFilter: ['data-phase'],
      })
    }, LAYER)
    await page.keyboard.press('Escape')
    await expectGone(page)
    // Straight from the load to the exit: no unveil, no landing on the way.
    expect(phases[0], phases.join(' > ')).toBe('exit')
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main')
    await expectScrolls(page)
  })

  test('scrolling during the load lifts it at once', async ({ page, context, isMobile }) => {
    await openIntro(page)
    expect(await phase(page)).toBe('load')
    if (isMobile) {
      await swipeUp(context, page)
    } else {
      await page.mouse.move(400, 400)
      await page.mouse.wheel(0, 200)
    }
    await expectGone(page)
    await expectScrolls(page)
  })

  test('ArrowDown, PageDown and End lift it too', async ({ page }) => {
    test.skip(project() !== 'desktop', 'Keys are the same everywhere; once is enough.')
    for (const key of ['ArrowDown', 'PageDown', 'End']) {
      await openIntro(page, '/?intro')
      await page.keyboard.press(key)
      await expectGone(page)
    }
  })

  test('a nav link lifts it and lands on its section', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The component shows its nav from 640px wide.')
    await openIntro(page)
    await page.locator(LAYER).getByRole('link', { name: 'Products' }).click()
    await expectGone(page)
    await expect(page).toHaveURL(/#products$/)
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('products')
    const top = await page.locator('#products').evaluate((el) => el.getBoundingClientRect().top)
    expect(Math.abs(top), `#products is ${top}px from the top`).toBeLessThan(120)
  })

  test("the section a nav link lands on stands whole as the stage lifts: its header isn't cut in late behind it", async ({ page, isMobile }) => {
    test.skip(isMobile, 'The component shows its nav from 640px wide.')
    await openIntro(page)
    // From the moment the stage has gone, the Experience header's parts are never drawn below full.
    await page.evaluate(() => {
      const w = window as unknown as { lowest: number; frames: number }
      w.lowest = 1
      w.frames = 0
      const html = document.documentElement
      const parts = [...document.querySelectorAll<HTMLElement>('#experience [data-reveal]')]
      const watch = new MutationObserver(() => {
        if (html.hasAttribute('data-intro')) return
        watch.disconnect()
        // At the moment the stage has gone, then every 50 ms until 2 s have
        // passed and at least six samples are in (timers, not frames: the
        // page is busy for a moment as it comes back, for seconds on a loaded
        // machine, and may draw few frames; each sample is what a frame would
        // draw).
        const start = performance.now()
        const look = () => {
          for (const el of parts) w.lowest = Math.min(w.lowest, Number(getComputedStyle(el).opacity))
          w.frames++
          if (performance.now() - start > 2000 && w.frames >= 6) window.clearInterval(every)
        }
        const every = window.setInterval(look, 50)
        look()
      })
      watch.observe(html, { attributes: true, attributeFilter: ['data-intro'] })
    })
    await page.locator(LAYER).getByRole('link', { name: 'Experience' }).click()
    await expectGone(page)
    await expect(page).toHaveURL(/#experience$/)
    await expect.poll(() => page.evaluate(() => (window as unknown as { frames: number }).frames), { timeout: 30_000 }).toBeGreaterThanOrEqual(6)
    await sleep(2200)
    const seen = await page.evaluate(() => {
      const w = window as unknown as { lowest: number; frames: number }
      return { lowest: w.lowest, frames: w.frames }
    })
    expect(seen.frames, 'samples taken after the lift').toBeGreaterThanOrEqual(6)
    expect(seen.lowest, 'the lowest opacity any part of its header showed').toBeGreaterThanOrEqual(0.99)
  })
})

test.describe('a proper modal', () => {
  test('Tab stays inside it while it is up, and every stop shows, ringed', async ({ page }) => {
    await openIntro(page)
    const check = async (when: string) => {
      const read = () =>
        page.evaluate((sel) => {
          const el = document.activeElement as HTMLElement | null
          if (!el || !el.closest(sel)) return { inside: false, name: el?.tagName ?? 'none', opacity: 0, ring: false }
          let opacity = 1
          for (let n: HTMLElement | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity)
          const style = getComputedStyle(el)
          return { inside: true, name: (el.textContent ?? '').trim().slice(0, 24) || el.className.toString().slice(0, 24), opacity, ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 }
        }, LAYER)
      let wrapped = false
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        // Skip leaves with the load; if it held focus, focus comes back in a moment.
        let where = ''
        await expect
          .poll(
            async () => {
              const now = await read()
              where = now.name
              return now.inside || now.name === 'BODY'
            },
            { message: `${when}: Tab ${i + 1} went outside the intro`, timeout: 1500 },
          )
          .toBe(true)
          .catch((error: Error) => {
            throw new Error(`${error.message} (to ${where})`)
          })
        const stop = await read()
        if (!stop.inside) {
          // Past the last stop focus goes to the browser's own controls (as
          // from a native modal dialog); the next Tab must come back in.
          expect(wrapped, `${when}: Tab ${i + 1} left the intro twice in a row`).toBe(false)
          wrapped = true
          continue
        }
        wrapped = false
        expect(stop.ring, `${when}: "${stop.name}" has no focus ring`).toBe(true)
        // Shown the moment it has focus (a frame or two to paint it).
        await expect.poll(async () => (await read()).opacity, { message: `${when}: "${stop.name}" is focused but not shown`, timeout: 1500 }).toBeGreaterThan(0.6)
      }
    }
    await check('load')
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    await check('landing')
  })

  test('if the stage fails to load, the page comes back at once', async ({ page }) => {
    // When the page came back, noted in the page as it happens (Date.now(),
    // the test's clock too): once shown the page works hard for a while, so
    // a check from outside would see it late.
    await page.addInitScript(() => {
      const w = window as unknown as { __gone?: number }
      new MutationObserver(() => {
        if (w.__gone === undefined && document.documentElement && !document.documentElement.hasAttribute('data-intro') && document.documentElement.dataset.seen) w.__gone = Date.now()
        if (document.documentElement?.getAttribute('data-intro') === '') document.documentElement.dataset.seen = '1'
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-intro'] })
    })
    let abortedAt = 0
    await page.route(STAGE_SCRIPTS, async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-intro-layer')) {
        abortedAt = Date.now()
        return route.abort()
      }
      return route.fulfill({ response, body })
    })
    await page.goto('/?intro', { waitUntil: 'commit' })
    const gone = () => page.evaluate(() => (window as unknown as { __gone?: number }).__gone ?? 0)
    await expect.poll(gone, { message: 'the page was given back', timeout: 45_000 }).toBeGreaterThan(0)
    expect(abortedAt, 'the stage was asked for').toBeGreaterThan(0)
    // Given back by the failed load itself, not seconds later by the fail-safe.
    expect((await gone()) - abortedAt, 'ms from the failed load to the page').toBeLessThan(3000)
    await expect(page.locator(LAYER)).toHaveCount(0)
  })

  test('if the stage never arrives, the fail-safe gives the page back and it never shows late', async ({ page }) => {
    // A held clock, moved on by hand.
    await page.clock.install()
    await page.clock.pauseAt(Date.now() + 1000)
    // The stage's script is held unanswered, then let through once the
    // fail-safe has acted.
    let held: (() => Promise<void>) | null = null
    await page.route(STAGE_SCRIPTS, async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (body.includes('data-intro-layer') && !held) {
        held = () => route.fulfill({ response, body })
        return
      }
      return route.fulfill({ response, body })
    })
    await page.goto('/?intro', { waitUntil: 'commit' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', '')
    await expect.poll(() => held !== null, { message: 'the stage was asked for', timeout: 30_000 }).toBe(true)
    // Not before its time...
    await page.clock.fastForward(7000)
    await expect(page.locator('html')).toHaveAttribute('data-intro', '')
    // ...and at 8 s, the page is given back.
    await page.clock.fastForward(1500)
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', { timeout: 30_000 })
    // Now it arrives, late: it stays away.
    await held!()
    await sleep(3000)
    await expect(page.locator(LAYER)).toHaveCount(0, { timeout: 30_000 })
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  })

  test('axe finds nothing during the load or at the landing', async ({ page }) => {
    await openIntro(page)
    const audit = async (when: string) => {
      const results = await new AxeBuilder({ page }).include(LAYER).options({ rules: { 'target-size': { enabled: true } } }).analyze()
      expect(results.violations.map((v) => `${when}: ${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    }
    await audit('load')
    await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
    // Let the landing's copy finish fading in, and the scroll hint too (it
    // waits 3 s, then fades in over 1 s: caught halfway, its ink is halfway
    // to the ground, and axe reads that contrast).
    await sleep(3000)
    await expect
      .poll(() => page.locator(`${LAYER} .om-hint`).evaluate((el) => (getComputedStyle(el).display === 'none' ? '1' : getComputedStyle(el).opacity)), { timeout: 15_000 })
      .toBe('1')
    await audit('landing')
  })

  test('the whole intro: a clean console, no CSP report, nothing off-origin', async ({ page, baseURL }) => {
    const console = collectConsole(page)
    const csp = await collectCspReports(page)
    const outside: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (!url.startsWith(baseURL!) && !/^(data|blob):/.test(url)) outside.push(url)
    })
    await openIntro(page)
    await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Enter' }).click()
    await expectGone(page)
    await sleep(500)
    console.expectClean()
    expect(await csp.reports()).toEqual([])
    expect(outside).toEqual([])
  })
})

test.describe('layout', () => {
  test('no sideways scroll, and the pills never overlap, 320 to 1920 wide', async ({ page }) => {
    test.skip(project() !== 'desktop', 'One sweep of window sizes is enough.')
    // Six intros, each to its landing.
    test.setTimeout(240_000)
    for (const [width, height] of [
      [320, 640],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height })
      await openIntro(page, '/?intro')
      await expect(page.locator(`${LAYER} .om-root[data-phase="landing"]`)).toBeAttached({ timeout: 20_000 })
      const m = await page.evaluate((sel) => {
        const pills = [...document.querySelectorAll(`${sel} .om-pill`)].map((p) => p.getBoundingClientRect())
        // The layer is fixed, so the document's scrollWidth can't see it:
        // measure what it shows instead (the word may run to the edges).
        const shown = [...document.querySelectorAll(`${sel} .om-top a, ${sel} .om-brand, ${sel} .om-eyebrow, ${sel} .om-tagline, ${sel} .om-cta, ${sel} .om-aside, ${sel} .om-plate`)]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => [el.className.toString().split(' ')[0], Math.round(el.getBoundingClientRect().left), Math.round(el.getBoundingClientRect().right)] as const)
        return { pills: pills.map((r) => [Math.round(r.left), Math.round(r.right)]), shown }
      }, LAYER)
      expect(m.shown.length, `${width}: nothing measured`).toBeGreaterThan(3)
      for (const [what, l, r] of m.shown) {
        expect(l, `${width}: ${what} starts off screen`).toBeGreaterThanOrEqual(0)
        expect(r, `${width}: ${what} ends off screen`).toBeLessThanOrEqual(width)
      }
      for (const [l, r] of m.pills) {
        expect(l, `${width}: a pill starts off screen`).toBeGreaterThanOrEqual(0)
        expect(r, `${width}: a pill ends off screen`).toBeLessThanOrEqual(width)
      }
      if (m.pills.length === 2) expect(m.pills[0][1], `${width}: the pills overlap`).toBeLessThan(m.pills[1][0])
    }
  })
})
