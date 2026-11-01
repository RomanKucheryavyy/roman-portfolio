import { expect, test, type Page } from '@playwright/test'
import { CERTIFICATIONS, RANK } from '@/lib/content'
import { gotoHome, project, sleep } from './helpers'

/**
 * Act IV, Credentials: his Trailhead rank leads it as its crowning honour
 * (src/components/stage/rank-honour.tsx, on designali-in/award), then the
 * frieze of the eight certifications (frieze.tsx): one slow row with no
 * rules, band or discs from md, a still inscription of all eight on a
 * phone. Runs in all three projects; the width sweeps only on desktop,
 * where the window can be resized.
 */

const honourOf = (page: Page) => page.locator('section#credentials [data-rank]')

/** The honour's three lines of words, in reading order: the platform (the page's), then the award's title and subtitle. */
const WORDS = ['[data-platform]', '.rk-award > div > :nth-child(2)', '.rk-award > div > :nth-child(4)']

/** The honour's own animations: all of them, the entrance's (finite), and how many are running. */
function motion(page: Page) {
  return honourOf(page).evaluate((box) => {
    const mine = document.getAnimations().filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target
      return !!target && box.contains(target)
    })
    return {
      total: mine.length,
      entrance: mine.filter((a) => a.effect?.getTiming().iterations !== Infinity).length,
      running: mine.filter((a) => a.playState === 'running').length,
    }
  })
}

/** The opacity each of the honour's words is drawn at. */
const wordOpacities = (page: Page) =>
  honourOf(page).evaluate((box, words) => words.map((w) => Number(getComputedStyle(box.querySelector(w)!).opacity)), WORDS)

async function bringIn(page: Page) {
  await honourOf(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(300)
}

test.describe('Act IV, the rank', () => {
  test('leads the act: its words from the record, in reading order, none of them a heading, before the seals', async ({ page }) => {
    await gotoHome(page)
    await bringIn(page)
    const section = page.locator('section#credentials')
    const honour = honourOf(page)
    for (const words of [RANK.platform, RANK.name, RANK.standing]) await expect(honour.getByText(words, { exact: true })).toBeVisible()
    // The platform, the name, the standing: in that order, one element each.
    const order = await honour.evaluate((box, words) => words.map((w) => box.querySelector(w)?.textContent?.trim()), WORDS)
    expect(order).toEqual([RANK.platform, RANK.name, RANK.standing])

    // The act's one heading is its h2, the eight certifications: the rank is
    // not filed under it as a heading of its own (nor is anything an h1).
    const headings = await section
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((el) => `${el.tagName} ${el.textContent?.replace(/\s+/g, ' ').trim()}`))
    expect(headings).toHaveLength(1)
    expect(headings[0]).toMatch(/^H2 \d+ Salesforce certifications$/)
    await expect(section.getByRole('heading', { name: new RegExp(RANK.name) })).toHaveCount(0)
    // No level pill: the component's own word is not shown or read.
    await expect(honour.getByText('GOLD', { exact: true })).toBeHidden()

    // Before the frieze in the document, and drawn above it.
    const place = await section.evaluate((s) => {
      const honour = s.querySelector('[data-rank]')!
      const frieze = s.querySelector('[aria-label="Salesforce certifications"]')!
      return {
        before: !!(honour.compareDocumentPosition(frieze) & Node.DOCUMENT_POSITION_FOLLOWING),
        above: honour.getBoundingClientRect().bottom <= frieze.getBoundingClientRect().top,
      }
    })
    expect(place).toEqual({ before: true, above: true })

    // The drawing and the glory are decoration: every drawing is hidden from
    // screen readers or has nothing to read (no role, name or title), nothing
    // in the honour takes focus, and it links nowhere (no profile address was
    // given).
    const drawn = await honour.evaluate((box) => ({
      svgSilent: [...box.querySelectorAll('svg')].every(
        (svg) => !!svg.closest('[aria-hidden="true"]') || (!svg.getAttribute('role') && !svg.getAttribute('aria-label') && !svg.querySelector('title')),
      ),
      gloryHidden: box.querySelector('[data-glory]')?.getAttribute('aria-hidden'),
      links: box.querySelectorAll('a').length,
      focusable: [...box.querySelectorAll<HTMLElement>('*')].filter((el) => {
        el.focus({ preventScroll: true })
        return document.activeElement === el
      }).length,
    }))
    expect(drawn).toEqual({ svgSilent: true, gloryHidden: 'true', links: 0, focusable: 0 })
    // The laurel is gold (the page's gradient), not the component's own ink.
    const fill = await honour.locator('.rk-award > svg').evaluate((svg) => getComputedStyle(svg).fill)
    expect(fill).toContain('rk-laurel')
    // No rule between the name and the standing: the component's is not drawn.
    expect(await honour.locator('.rk-award > div > :nth-child(3)').evaluate((rule) => getComputedStyle(rule).display)).toBe('none')
  })

  test('arrives once in view, comes to rest, and its sheen comes round only while on screen; the rays hold still', async ({ page }) => {
    await gotoHome(page)
    // Off screen as the page opens: the entrance is ready, its words held back.
    await expect.poll(() => motion(page).then((m) => m.entrance)).toBeGreaterThan(0)
    expect((await motion(page)).running, 'nothing moves before it is seen').toBe(0)
    expect(await wordOpacities(page)).toEqual(expect.arrayContaining([0]))

    await bringIn(page)
    // The entrance plays and lets go of every element once done.
    await expect.poll(() => motion(page).then((m) => m.entrance), { timeout: 20_000 }).toBe(0)
    expect((await wordOpacities(page)).every((o) => o === 1), 'every word drawn in full').toBe(true)
    // What keeps going while it is on screen: the sheen across the name, and nothing else.
    await expect.poll(() => motion(page)).toEqual({ total: 1, entrance: 0, running: 1 })
    // The glory is a still sunburst: its rays never turn.
    const rays = await honourOf(page).locator('[data-rays]').evaluate((el) => ({ animations: el.getAnimations().length, transform: getComputedStyle(el).transform }))
    expect(rays).toEqual({ animations: 0, transform: 'none' })

    // Off screen, all of it holds still.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(0)
    await bringIn(page)
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(1)
  })

  test('opens finished when the page lands on it: nothing seen is hidden to be brought in again', async ({ page }) => {
    // Every frame from the first paint: the lowest opacity each word is drawn
    // at while the honour is on screen.
    await page.addInitScript((words) => {
      const low = words.map(() => 1)
      ;(window as unknown as { __low: number[] }).__low = low
      const start = performance.now()
      const look = () => {
        const box = document.querySelector('[data-rank]')
        if (box) {
          const r = box.getBoundingClientRect()
          if (r.top < innerHeight && r.bottom > 0)
            words.forEach((w, i) => {
              const el = box.querySelector(w)
              if (el) low[i] = Math.min(low[i], Number(getComputedStyle(el).opacity))
            })
        }
        if (performance.now() - start < 6000) requestAnimationFrame(look)
      }
      requestAnimationFrame(look)
    }, WORDS)
    await gotoHome(page, '/#credentials')
    await expect.poll(() => honourOf(page).evaluate((box) => box.getBoundingClientRect().top < innerHeight)).toBe(true)
    await sleep(2500)
    expect(await page.evaluate(() => (window as unknown as { __low: number[] }).__low), 'the lowest opacity of each word while on screen').toEqual([1, 1, 1])
    expect((await motion(page)).entrance, 'no entrance').toBe(0)
    // Its sheen still comes round.
    await expect.poll(() => motion(page).then((m) => m.running)).toBe(1)
  })

  test('stands still and whole under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await bringIn(page)
    await sleep(1000)
    expect(await motion(page)).toEqual({ total: 0, entrance: 0, running: 0 })
    expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
    await expect(honourOf(page).getByText(RANK.name, { exact: true })).toBeVisible()
  })

  test.describe('without scripts', () => {
    test.use({ javaScriptEnabled: false })

    test('the server\'s HTML is the finished honour', async ({ page }) => {
      await page.goto('/')
      await expect(honourOf(page).getByText(RANK.name, { exact: true })).toBeVisible()
      expect((await wordOpacities(page)).every((o) => o === 1)).toBe(true)
      // The laurel, in its gold.
      await expect(honourOf(page).locator('.rk-award > svg')).toBeVisible()
      expect(await honourOf(page).locator('.rk-award > svg').evaluate((svg) => getComputedStyle(svg).fill)).toContain('rk-laurel')
    })
  })

  test('fits from 320 to 1920: no sideways scroll, its words on screen, clear of the header and above the seals', async ({ page }) => {
    test.skip(project() !== 'desktop', 'resizes the window')
    await gotoHome(page)
    for (const width of [320, 360, 390, 414, 600, 768, 1024, 1279, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(200)
      const fit = await page.evaluate(() => {
        const rect = (el: Element) => el.getBoundingClientRect()
        const title = document.querySelector('#credentials-title')!
        const header = rect(title.parentElement!)
        const honour = document.querySelector('#credentials [data-rank]')!
        const parts = [honour.querySelector('.rk-award > svg')!, ...honour.querySelectorAll('p')].map(rect)
        const frieze = rect(document.querySelector('[aria-label="Salesforce certifications"]')!)
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
        return {
          sideways: document.documentElement.scrollWidth - window.innerWidth,
          titleOverflow: title.scrollWidth - title.clientWidth,
          onScreen: parts.every((b) => b.left >= 0 && b.right <= window.innerWidth),
          clearOfHeader: parts.every((b) => !overlaps(b, header)),
          aboveSeals: parts.every((b) => b.bottom <= frieze.top),
        }
      })
      expect(fit, `${width}px`).toEqual({ sideways: 0, titleOverflow: 0, onScreen: true, clearOfHeader: true, aboveSeals: true })
    }
  })
})

/** The frieze: whatever is labelled as the eight certifications. */
const friezeOf = (page: Page) => page.locator('section#credentials [aria-label="Salesforce certifications"]')

/** Brings the frieze to the middle of the screen and lets any entrance play out. */
async function bringFriezeIn(page: Page) {
  await friezeOf(page).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await sleep(1500)
}

/** The animations on anything inside the frieze: all, and those that loop. */
const friezeMotion = (page: Page) =>
  friezeOf(page).evaluate((box) => {
    const mine = document.getAnimations().filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target
      return !!target && box.contains(target)
    })
    return { total: mine.length, looping: mine.filter((a) => a.effect?.getTiming().iterations === Infinity).length }
  })

test.describe('Act IV, the frieze', () => {
  test('on a phone: a still inscription of all eight, no marquee and no pause, each line on the screen', async ({ page }) => {
    test.skip(project() !== 'mobile', 'the phone layout')
    await gotoHome(page)
    // Held below the screen as the page opens: its lines wait to be set.
    const held = await friezeOf(page).evaluate((box) => [...box.querySelectorAll('li > span')].some((el) => Number(getComputedStyle(el).opacity) < 1))
    expect(held, 'the lines are held until the frieze is in view').toBe(true)
    await bringFriezeIn(page)
    const frieze = friezeOf(page)
    // Set one after another, then let go: every line whole and in place.
    await expect
      .poll(() => frieze.evaluate((box) => [...box.querySelectorAll('li, li > *')].every((el) => Number(getComputedStyle(el).opacity) === 1 && getComputedStyle(el).transform === 'none')), { timeout: 8000 })
      .toBe(true)
    await expect(frieze).toHaveAttribute('role', 'group')
    await expect(page.locator('section#credentials [data-slot="toolchain-marquee"]')).toHaveCount(0)
    await expect(page.locator('section#credentials button')).toHaveCount(0)

    const lines = await frieze.evaluate((box) =>
      [...box.querySelectorAll('li')].map((li) => {
        const [name, date] = [...li.querySelectorAll(':scope > span')] as HTMLElement[]
        const r = li.getBoundingClientRect()
        const font = (el: Element) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '')
        return {
          text: `${name.textContent} ${date.textContent?.replace(/^,\s*/, '')}`,
          nameFont: font(name),
          nameSize: parseFloat(getComputedStyle(name).fontSize),
          dateSize: parseFloat(getComputedStyle(date).fontSize),
          onScreen: r.left >= 0 && r.right <= innerWidth,
          whole: [li, name, date, li.querySelector('svg')!].every((el) => Number(getComputedStyle(el).opacity) === 1 && getComputedStyle(el).transform === 'none'),
          laurelHidden: !!li.querySelector('svg')?.closest('[aria-hidden="true"]') || li.querySelector('svg')?.getAttribute('aria-hidden') === 'true',
        }
      }),
    )
    expect(lines.map((l) => l.text)).toEqual(CERTIFICATIONS.map((c) => `${c.name} ${c.date}`))
    for (const line of lines) {
      expect(line, line.text).toMatchObject({ onScreen: true, whole: true, laurelHidden: true })
      expect(line.nameFont, line.text).toMatch(/cinzel/i)
      expect(line.nameSize, line.text).toBeGreaterThanOrEqual(14)
      expect(line.dateSize, line.text).toBeGreaterThanOrEqual(12)
    }
    // Once set, nothing in it moves, and nothing loops.
    expect(await friezeMotion(page)).toEqual({ total: 0, looping: 0 })
    // A screen reader hears each as one line: the name, then the date.
    await expect(frieze.locator('li').first()).toHaveText(`${CERTIFICATIONS[0].name}, ${CERTIFICATIONS[0].date}`)
  })

  test('on a phone under reduced motion: the same inscription, whole from the start', async ({ page }) => {
    test.skip(project() !== 'mobile', 'the phone layout')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    const whole = await friezeOf(page).evaluate((box) => [...box.querySelectorAll('li, li *')].every((el) => Number(getComputedStyle(el).opacity) === 1))
    expect(whole).toBe(true)
    expect(await friezeMotion(page)).toEqual({ total: 0, looping: 0 })
    await expect(friezeOf(page).locator('li')).toHaveCount(CERTIFICATIONS.length)
  })

  test('from md: one slow row with no rules, no band and no discs, the laurel alone in gold, and an unboxed pause', async ({ page }) => {
    test.skip(project() === 'mobile', 'the wide layout')
    await gotoHome(page)
    await bringFriezeIn(page)
    const frieze = friezeOf(page)
    const look = await frieze.evaluate((root) => {
      const css = (el: Element) => getComputedStyle(el)
      const rowsBox = root.querySelector(':scope > div')!
      const rows = [...rowsBox.children]
      const edges = (el: Element) => ['Top', 'Right', 'Bottom', 'Left'].map((side) => parseFloat(css(el).getPropertyValue(`border-${side.toLowerCase()}-width`)))
      const icons = [...root.querySelectorAll('span[aria-hidden="true"]')]
      const button = root.querySelector(':scope > button')!
      const b = button.getBoundingClientRect()
      return {
        rows: rows.length,
        ruled: [rowsBox, ...rows].some((el) => edges(el).some((w) => w > 0)),
        band: [rowsBox, ...rows].some((el) => css(el).backgroundImage !== 'none' || css(el).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        discs: icons.some((el) => css(el).backgroundColor !== 'rgba(0, 0, 0, 0)' || edges(el).some((w) => w > 0) || css(el).outlineStyle !== 'none'),
        laurelGold: icons.every((el) => css(el).color === css(document.querySelector('#credentials-title')!.parentElement!.querySelector('[data-reveal="numeral"]')!).color),
        button: {
          background: css(button).backgroundColor,
          // Tailwind's shadow-none leaves a list of fully transparent shadows: none of them is drawn.
          shadow: css(button).boxShadow.split(/,(?![^(]*\))/).every((one) => one.trim() === 'none' || /rgba\(\d+, \d+, \d+, 0\)/.test(one)) ? 'none' : css(button).boxShadow,
          width: Math.round(b.width),
          height: Math.round(b.height),
        },
      }
    })
    expect(look).toEqual({
      rows: 1,
      ruled: false,
      band: false,
      discs: false,
      laurelGold: true,
      button: { background: 'rgba(0, 0, 0, 0)', shadow: 'none', width: 44, height: 44 },
    })
    // Every certification is written out once in the row (the copies after it are hidden from screen readers).
    const said = await frieze.evaluate((root) => [...root.querySelectorAll('div:not([aria-hidden]) > span > span + span')].map((el) => el.textContent))
    expect(said).toEqual(CERTIFICATIONS.map((c) => `${c.name} · ${c.date}`))
    // It moves, and the pause holds it.
    expect((await friezeMotion(page)).total).toBe(0) // framer-motion writes transforms, not Web Animations
    const at = () => frieze.evaluate((root) => getComputedStyle(root.querySelector(':scope > div > div > div')!).transform)
    const first = await at()
    await sleep(600)
    expect(await at(), 'the row runs').not.toBe(first)
    await page.getByRole('button', { name: 'Pause tool animation' }).click()
    const paused = await at()
    await sleep(600)
    expect(await at(), 'paused, it holds').toBe(paused)
  })

  test('from md under reduced motion: the eight standing still in the page column, two to a row, no pause', async ({ page }) => {
    test.skip(project() === 'mobile', 'the wide layout')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await bringFriezeIn(page)
    const frieze = friezeOf(page)
    await expect(frieze.locator('button')).toHaveCount(0)
    const fit = await frieze.evaluate((root) => {
      const words = [...root.querySelectorAll('span > span + span')]
      return { count: words.length, onScreen: words.every((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth }) }
    })
    expect(fit).toEqual({ count: CERTIFICATIONS.length, onScreen: true })
  })

  test('holds its place while it loads: nothing below moves when it lands, from 320 to 1920', async ({ page }) => {
    test.skip(project() !== 'desktop', 'resizes the window')
    await gotoHome(page)
    for (const width of [320, 335, 336, 340, 343, 360, 390, 600, 767, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await sleep(250)
      const fit = await page.evaluate(() => {
        const box = document.querySelector('#credentials > div:last-child')!
        const frieze = box.firstElementChild!
        return {
          reserve: Math.round(parseFloat(getComputedStyle(box).minHeight)),
          drawn: Math.round(frieze.getBoundingClientRect().height),
          sideways: document.documentElement.scrollWidth - innerWidth,
        }
      })
      expect(fit.sideways, `${width}px`).toBe(0)
      expect(fit.drawn, `${width}px: the reserve holds the frieze's height`).toBe(fit.reserve)
    }
  })
})
