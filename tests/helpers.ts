import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

/**
 * Shared harness helpers. Two rules the whole suite leans on:
 *
 * - Never wait for `networkidle`. The curtain, the marquee and the globe
 *   animate for as long as the page is open; wait for a known element plus a
 *   short settle.
 * - Console noise is allow-listed, not ignored. Anything new fails the test.
 */

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** The Stage's sections, in page order (src/components/stage/top-bar.tsx SECTIONS). */
export const SECTION_IDS = ['work', 'products', 'experience', 'credentials', 'about', 'contact'] as const

/**
 * Opens the home page and waits for it to be up: the hero's name drawn, and
 * the pieces that load after the page (the products' previews, the
 * Experience timeline, the About block, the contact card and the footer) in
 * place.
 */
export async function gotoHome(page: Page, path = '/') {
  const response = await page.goto(path)
  await expect(page.locator('#hero-title')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('footer')).toBeAttached({ timeout: 30_000 })
  await expect(page.locator('#contact form')).toBeAttached()
  await expect(page.locator('#about [aria-label="Keywords"]')).toBeAttached()
  await expect(page.locator('#products [data-preview]')).toHaveCount(4)
  await sleep(500)
  return response
}

export interface CspLog {
  /** Every report so far: the browser's console lines and the page's securitypolicyviolation events. */
  reports(): Promise<string[]>
}

/**
 * Records what the Content-Security-Policy-Report-Only header (next.config.ts)
 * would have blocked. Two channels, because neither alone covers everything:
 * the browser's own "[Report Only] Refused to …" console line, and the
 * securitypolicyviolation event, which report-only policies fire too. Call it
 * before navigating.
 */
export async function collectCspReports(page: Page): Promise<CspLog> {
  const lines: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (/Content Security Policy|\[Report Only\]/i.test(text)) lines.push(`console.${msg.type()}: ${text}`)
  })
  await page.addInitScript(() => {
    const seen: string[] = []
    ;(window as unknown as { __cspReports: string[] }).__cspReports = seen
    document.addEventListener('securitypolicyviolation', (e) => {
      seen.push(`${e.disposition} ${e.effectiveDirective}: ${e.blockedURI || '(inline)'} at ${e.sourceFile || '?'}:${e.lineNumber}`)
    })
  })
  return {
    async reports() {
      const events = await page
        .evaluate(() => (window as unknown as { __cspReports?: string[] }).__cspReports ?? [])
        .catch(() => [] as string[])
      return [...lines, ...events]
    },
  }
}

/** Software WebGL in headless Chromium: noise from the GPU stack, not the site. */
const ALWAYS_ALLOWED: RegExp[] = [/Automatic fallback to software WebGL/, /GL Driver Message/]

/**
 * Only on the project with WebGL switched off: the paper shaders behind the
 * footer's glass say they have no WebGL (an unhandled rejection from their
 * own mount, @paper-design/shaders-react), and the panel shows its plain
 * colour instead. smoke.spec checks the page still reads in full there.
 */
const NO_WEBGL_ALLOWED: RegExp[] = [/^Error: Paper Shaders: WebGL is not supported in this browser$/]

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
  const rules = [...ALWAYS_ALLOWED, ...(test.info().project.name === 'no-webgl' ? NO_WEBGL_ALLOWED : []), ...allow]
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

/** Scrolls the whole page with wheel events, a screen at a time, then waits for it to rest. */
export async function scrollThrough(page: Page, pause = 250) {
  const step = Math.round((page.viewportSize()?.height ?? 900) * 0.8)
  let height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += step) {
    await page.mouse.wheel(0, step)
    await sleep(pause)
    height = await page.evaluate(() => document.documentElement.scrollHeight)
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
}

/** The project this test runs in: desktop (1440x900), mobile (390x844) or no-webgl (1440x900). */
export const project = () => test.info().project.name

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
