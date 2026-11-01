import type { Locator, Page } from '@playwright/test'
import { PALETTE } from '@/components/stage/imperial'
import { sleep } from './helpers'

/**
 * Contrast read off the real pixels, for the Old Masters stages (the intro,
 * the hero's painting, the title cards), whose light no axe run sees.
 */

/**
 * Every shaft of a stage's light drawn at its peak: old-masters-preloader
 * draws each shaft as a gradient of its glow from an alpha that swings
 * between 0.7 and 1 of 0.055 (and half that at 0.55 of its length), so
 * pinning those stops at their maximum is the light at its brightest. Only
 * the glow's own gradients are touched. Call it before the page loads.
 */
export async function lightAtPeak(page: Page) {
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
 * Moves the pointer so a stage's spotlight (old-masters-preloader: a glow
 * at 50% + 24% of the pointer's x and 40% + 22% of its y, across a box 20%
 * larger than the stage on every side) stands as near the middle of `el` as
 * it can reach, and waits for it to arrive (it eases after the pointer).
 */
export async function spotlightOn(page: Page, stage: Locator, el: Locator) {
  const box = (await el.boundingBox())!
  const s = (await stage.boundingBox())!
  const sx = (((box.x + box.width / 2 - s.x) / s.width + 0.2) / 1.4) * 100
  const sy = (((box.y + box.height / 2 - s.y) / s.height + 0.2) / 1.4) * 100
  const tx = Math.max(-1, Math.min(1, (sx - 50) / 24))
  const ty = Math.max(-1, Math.min(1, (sy - 40) / 22))
  await page.mouse.move(s.x + (tx / 2 + 0.5) * s.width, s.y + (ty / 2 + 0.5) * s.height, { steps: 4 })
  await sleep(1500)
}

/** Where an element's glyphs are (drawn in magenta, no halo), and its ink, for inkContrast. */
export async function glyphsOf(page: Page, el: Locator) {
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
export async function inkContrast(page: Page, el: Locator, found?: Awaited<ReturnType<typeof glyphsOf>>) {
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

/** The box round a stage's word (its letters), 8px out, inside the screen. */
export const wordBox = (word: Locator) =>
  word.evaluate((el) => {
    const r = [...el.querySelectorAll('.om-l, .om-init')].map((s) => s.getBoundingClientRect())
    const x = Math.min(...r.map((q) => q.left)) - 8
    const y = Math.min(...r.map((q) => q.top)) - 8
    return { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(innerWidth - Math.max(0, x), Math.max(...r.map((q) => q.right)) + 8 - x), height: Math.max(...r.map((q) => q.bottom)) + 8 - y }
  })

/**
 * A stage's word against what is round it, on the real shot: its letters
 * found by drawing them solid green (`green`, a style that does that; their
 * halo kept), then the darkest of their own pixels (5th percentile, a CSS
 * pixel in from their edge) against the brightest of the ring 1 to 4 CSS
 * pixels round them (95th percentile).
 */
export async function wordContrast(page: Page, clip: { x: number; y: number; width: number; height: number }, green: string) {
  const real = (await page.screenshot({ clip, animations: 'allow' })).toString('base64')
  const tag = await page.addStyleTag({ content: green })
  const mask = (await page.screenshot({ clip, animations: 'allow' })).toString('base64')
  await tag.evaluate((el) => (el as Element).remove())
  return page.evaluate(
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
}
