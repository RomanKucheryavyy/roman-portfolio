import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

/**
 * Shared harness helpers. Two rules the whole suite leans on:
 *
 * - Never wait for `networkidle`. The ocean's rAF loop, Lenis and the deck
 *   keep the page busy forever; wait for a known element plus a short settle.
 * - Console noise is allow-listed, not ignored. Anything new fails the test.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Opens the home page. The boot animation runs once per session and takes
 * about three seconds, so by default the session is marked as already booted
 * (the Loader's own fast path). Pass `{ boot: true }` to watch the boot.
 */
export async function gotoHome(page: Page, { boot = false }: { boot?: boolean } = {}) {
  if (!boot) {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('booted', '1')
      } catch {
        // Storage blocked: the Loader will just run its full boot.
      }
    })
  }
  const response = await page.goto('/')
  await expect(page.locator('#hero h1')).toBeVisible({ timeout: 30_000 })
  await sleep(800)
  return response
}

/** Software WebGL in headless Chromium: noise from the GPU stack, not the site. */
const ALWAYS_ALLOWED: RegExp[] = [/Automatic fallback to software WebGL/, /GL Driver Message/]

/** Only on the project with WebGL switched off: three.js says it has no context,
 *  and the ocean falls back to its static frame. */
const NO_WEBGL_ALLOWED: RegExp[] = [/THREE\.WebGLRenderer.*context/]

export interface ConsoleLog {
  /** console.error and console.warning lines and page errors that no allow rule matched. */
  readonly unexpected: string[]
  /** Fails the test with the unexpected lines listed. */
  expectClean(): void
}

/**
 * Starts recording console errors, warnings and uncaught page errors. Call it
 * before navigating. `allow` adds patterns for this test only, on top of the
 * default allowlist.
 */
export function collectConsole(page: Page, allow: RegExp[] = []): ConsoleLog {
  const projectName = test.info().project.name
  const rules = [...ALWAYS_ALLOWED, ...(projectName === 'no-webgl' ? NO_WEBGL_ALLOWED : []), ...allow]
  const unexpected: string[] = []
  const allowed = (text: string) => rules.some((rule) => rule.test(text))

  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type()
    if (type !== 'error' && type !== 'warning') return
    const text = msg.text()
    if (!allowed(text)) unexpected.push(`console.${type}: ${text}`)
  })
  page.on('pageerror', (err) => {
    const text = `${err.name}: ${err.message}`
    if (!allowed(text)) unexpected.push(`pageerror: ${text}`)
  })

  return {
    unexpected,
    expectClean() {
      expect(unexpected, 'unexpected console output').toEqual([])
    },
  }
}

/** Scrolls the whole page with wheel events so every lazy section mounts,
 *  then waits for Lenis's smoothing to come to rest. */
export async function wheelThrough(page: Page, step = 700, pause = 250) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += step) {
    await page.mouse.wheel(0, step)
    await sleep(pause)
  }
  await waitForScrollIdle(page)
}

/** Resolves once scrollY has not moved for half a second (or after `timeout`). */
export async function waitForScrollIdle(page: Page, timeout = 5000) {
  const start = Date.now()
  let last = await page.evaluate(() => window.scrollY)
  let still = 0
  while (still < 5 && Date.now() - start < timeout) {
    await sleep(100)
    const now = await page.evaluate(() => window.scrollY)
    still = now === last ? still + 1 : 0
    last = now
  }
  // ScrollTrigger scrubs trail the scroll by up to half a second.
  await sleep(600)
}

type RGBA = [number, number, number, number]

/** Parses `rgb()`, `rgba()` (comma or space syntax) and `#rgb`/`#rrggbb`/`#rrggbbaa`. */
export function parseColor(input: string): RGBA {
  const value = input.trim().toLowerCase()
  if (value.startsWith('#')) {
    let hex = value.slice(1)
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('')
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), hex.length === 8 ? n(6) / 255 : 1]
  }
  const match = value.match(/^rgba?\(([^)]+)\)$/)
  if (!match) throw new Error(`parseColor: unsupported colour "${input}"`)
  const parts = match[1].split(/[\s,/]+/).filter(Boolean)
  const channel = (s: string) => (s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s))
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
  return [channel(parts[0]), channel(parts[1]), channel(parts[2]), alpha]
}

const luminance = ([r, g, b]: RGBA) => {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * WCAG 2 contrast ratio of `fg` drawn over an opaque `bg`. A translucent
 * foreground (white/50 and friends) is composited onto the background first,
 * which is how the browser paints it.
 */
export function contrast(fg: string, bg: string): number {
  const back = parseColor(bg)
  const front = parseColor(fg)
  const a = front[3]
  const painted: RGBA = [
    front[0] * a + back[0] * (1 - a),
    front[1] * a + back[1] * (1 - a),
    front[2] * a + back[2] * (1 - a),
    1,
  ]
  const [hi, lo] = [luminance(painted), luminance(back)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Saves a screenshot as `<CAPTURE_DIR>/<name>-<project>.png` (default
 * `test-results/captures`). This is how the 1440x900 / 390x844 before-and-after
 * sets are taken.
 */
export async function capture(page: Page, name: string, { fullPage = false }: { fullPage?: boolean } = {}) {
  const dir = process.env.CAPTURE_DIR ?? path.join('test-results', 'captures')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${name}-${test.info().project.name}.png`)
  await page.screenshot({ path: file, fullPage })
  return file
}
