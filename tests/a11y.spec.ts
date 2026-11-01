import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { gotoHome, scrollThrough } from './helpers'

/**
 * An axe ratchet whose baseline is empty: tests/a11y-baseline.json records,
 * per project and route, how many nodes may fail each rule, and it records
 * none. Any violation, of any impact, fails. Nothing goes into the baseline:
 * fix the page instead. (A count below its baseline would pass and be
 * reported, so a future exception, if Roman ever approves one, could only be
 * lowered from there.)
 *
 * Each route is audited at rest: / after a full scroll, with the badges
 * dropped and every piece that loads after the page in place; the others once
 * their main is there. target-size (WCAG 2.2 AA 2.5.8) ships disabled in
 * axe-core, so it is switched on on top of the defaults.
 *
 * To re-record: A11Y_RECORD=1 npx playwright test tests/a11y.spec.ts
 * (replaces each entry), then A11Y_RECORD=max with the same command two or
 * three more times (keeps the highest count per rule). Only ever to lower it.
 */

type Counts = Record<string, number>
type Baseline = Record<string, Record<string, Counts>>

const BASELINE_FILE = path.join(process.cwd(), 'tests', 'a11y-baseline.json')
const RECORD = process.env.A11Y_RECORD

/** Workers record in parallel; a directory is the cheapest atomic lock. */
function withBaselineLock(fn: () => void) {
  const lock = `${BASELINE_FILE}.lock`
  const deadline = Date.now() + 10_000
  for (;;) {
    try {
      mkdirSync(lock)
      break
    } catch {
      if (Date.now() > deadline) throw new Error(`a11y baseline lock is stuck: remove ${lock}`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20)
    }
  }
  try {
    fn()
  } finally {
    rmSync(lock, { recursive: true, force: true })
  }
}

const ROUTES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  {
    name: 'home',
    path: '/',
    ready: async (page) => {
      await gotoHome(page)
      await scrollThrough(page)
      // The badges have dropped (the About block's physics) and come to rest.
      // They drop as the zone rises into the upper part of the screen; a
      // wheel step of most of a screen can carry it straight past that, so
      // the zone is brought into view before they are waited for.
      await page.locator('#about [aria-label="Keywords"]').scrollIntoViewIfNeeded()
      await expect(page.locator('#about [aria-label="Keywords"] > div').first()).toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(2500)
    },
  },
  ...[
    { name: 'resume', path: '/resume' },
    { name: 'not-found', path: '/does-not-exist' },
  ].map((route) => ({
    ...route,
    ready: async (page: Page) => {
      await page.goto(route.path)
      await expect(page.locator('main#main')).toHaveCount(1)
      await page.waitForTimeout(500)
    },
  })),
]

const readBaseline = (): Baseline => JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))

for (const route of ROUTES) {
  test(`axe: ${route.path} has no violations above the (empty) baseline`, async ({ page }) => {
    const project = test.info().project.name
    await route.ready(page)
    const results = await new AxeBuilder({ page }).options({ rules: { 'target-size': { enabled: true } } }).analyze()

    const observed: Counts = {}
    for (const v of results.violations) observed[v.id] = v.nodes.length

    if (RECORD) {
      withBaselineLock(() => {
        const baseline = readBaseline()
        const entry: Counts = RECORD === 'max' ? { ...baseline[project]?.[route.name] } : {}
        for (const [id, n] of Object.entries(observed)) entry[id] = Math.max(entry[id] ?? 0, n)
        baseline[project] = { ...baseline[project], [route.name]: entry }
        writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2) + '\n')
      })
      return
    }

    const allowed = readBaseline()[project]?.[route.name] ?? {}
    const regressions = Object.entries(observed)
      .filter(([id, n]) => n > (allowed[id] ?? 0))
      .map(([id, n]) => {
        const v = results.violations.find((x) => x.id === id)
        const where = v?.nodes.slice(0, 5).map((node) => node.target.join(' ')).join(' | ')
        return `${id} (${v?.impact}): ${n} nodes (baseline ${allowed[id] ?? 0}) e.g. ${where}`
      })
    expect(regressions, 'axe violations above tests/a11y-baseline.json').toEqual([])
  })
}

/**
 * The message box's two outcomes, which only appear after a send: each
 * panel audited in place (the POSTs faked), any violation of any impact
 * failing, as for the routes above.
 */
for (const [outcome, answer, heading] of [
  ['sent, with a receipt', { status: 200, json: { ok: true, delivered: ['email', 'forms'], receipt: true } }, 'Message sent'],
  ['failed', { status: 502, json: { error: 'delivery_failed' } }, 'Your message didn’t go through'],
] as const) {
  test(`axe: the message box's ${outcome} panel has no violations`, async ({ page }) => {
    await page.route('**/api/contact', (route) => route.fulfill(answer))
    await gotoHome(page, '/#contact')
    const box = page.locator('#contact form')
    await box.getByLabel('Name', { exact: true }).fill('Axe')
    await box.getByLabel('Email', { exact: true }).fill('axe@example.com')
    await box.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello there. I have a question about a project.')
    await page.waitForTimeout(800)
    await page.locator('#contact form button[aria-label="Send"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#contact').getByRole('heading', { name: heading })).toBeFocused({ timeout: 15_000 })
    await page.waitForTimeout(500)
    const results = await new AxeBuilder({ page }).include('#contact').options({ rules: { 'target-size': { enabled: true } } }).analyze()
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  })
}

/**
 * / again, after a reader's scroll, a half screen at a time: everything
 * that enters as it comes into view (the act headers, Act III's years,
 * Act IV's rank and its inscription, the About portrait and badges, the
 * contact globe) has played and let go, and nothing is left held, so axe
 * audits every one of them as it finally stands. Any violation fails.
 */
test('axe: / once every entrance has played, after a reader’s scroll', async ({ page }) => {
  test.setTimeout(150_000)
  await gotoHome(page)
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const step = Math.round((page.viewportSize()?.height ?? 900) / 2)
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(350)
  }
  // Every entrance (a finite animation) has run its course and let go.
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity && a.playState !== 'finished').length), { timeout: 15_000 })
    .toBe(0)
  const held = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal], #experience li *, #credentials li *, #credentials [data-rank] p, #about section img')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 1)
      .map((el) => `${el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 30)}"`),
  )
  expect(held, 'nothing left held after the scroll').toEqual([])
  const results = await new AxeBuilder({ page }).options({ rules: { 'target-size': { enabled: true } } }).analyze()
  expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 5).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
})

test('the baseline is empty', () => {
  const baseline = readBaseline()
  const entries = Object.values(baseline).flatMap((routes) => Object.values(routes).flatMap((counts) => Object.entries(counts)))
  expect(entries).toEqual([])
})
