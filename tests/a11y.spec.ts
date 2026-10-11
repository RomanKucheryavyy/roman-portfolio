import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { gotoHome, waitForChrome, wheelThrough } from './helpers'

/**
 * An axe ratchet. tests/a11y-baseline.json records, per project and route, how
 * many nodes may fail each serious or critical rule. A count above its
 * baseline fails; a count below it passes and is reported, so the baseline can
 * be lowered in the same PR that earned it.
 *
 * W12 brought it to its end state: every route at 0, except the two hero
 * links on / (link-name: the GitHub and LinkedIn icon buttons have no name).
 * Naming them is an edit to Hero.tsx, which only Roman can approve (W10 item
 * 4a); when he does, their entries go and the file is empty. Nothing else may
 * be added to it: fix the page instead.
 *
 * Pure decoration is left out of the audit: subtrees marked data-decorative
 * (the DNA helix watermark). WCAG 1.4.3 sets no contrast minimum for it, and
 * axe cannot tell decoration from text. The last test below holds every such
 * subtree to aria-hidden with nothing focusable inside, so the marker can't
 * hide anything a visitor uses.
 *
 * Each route is audited at rest: / after a full scroll (no section caught
 * mid-reveal), the others once the site nav has dropped in (waitForChrome).
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
    // Scroll everything into place first, so no section is caught mid-reveal.
    ready: async (page) => {
      await gotoHome(page)
      await wheelThrough(page)
      await waitForChrome(page)
    },
  },
  ...[
    { name: 'works', path: '/works' },
    { name: 'colophon', path: '/colophon' },
    { name: 'resume', path: '/resume' },
    { name: 'not-found', path: '/does-not-exist' },
  ].map((route) => ({
    ...route,
    ready: async (page: Page) => {
      await page.goto(route.path)
      await expect(page.locator('main#main')).toHaveCount(1)
      await waitForChrome(page)
    },
  })),
]

/** Pure decoration, left out of the audit (see the header). */
const DECORATIVE = '[data-decorative]'

const readBaseline = (): Baseline => JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))

for (const route of ROUTES) {
  test(`axe: ${route.path} has no serious or critical violations above the baseline`, async ({ page }) => {
    const project = test.info().project.name

    await route.ready(page)
    const results = await new AxeBuilder({ page }).exclude(DECORATIVE).analyze()

    const observed: Counts = {}
    for (const v of results.violations) {
      if (v.impact === 'serious' || v.impact === 'critical') observed[v.id] = v.nodes.length
    }

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
        return `${id}: ${n} nodes (baseline ${allowed[id] ?? 0}) e.g. ${where}`
      })
    const improved = Object.entries(allowed).filter(([id, n]) => (observed[id] ?? 0) < n)
    for (const [id, n] of improved) {
      test.info().annotations.push({ type: 'a11y-improved', description: `${id}: ${observed[id] ?? 0} < baseline ${n}` })
    }
    expect(regressions, 'serious/critical axe violations above tests/a11y-baseline.json').toEqual([])
  })
}

test('the phone menu, open, has no serious or critical violation', async ({ page }) => {
  // At phone width in every project: the burger and its sheet exist only below md.
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoHome(page)
  await page.locator('button[aria-haspopup="dialog"]').click()
  const dialog = page.getByRole('dialog', { name: 'Site menu' })
  await expect(dialog).toBeVisible()
  // The rows type themselves in (lineIn / rowIn); audit the sheet at rest.
  await expect(dialog.getByRole('link', { name: /\/contact/ })).toBeVisible()
  await page.waitForTimeout(1200)
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze()
  const serious = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`)
  expect(serious).toEqual([])
})

test('decoration left out of the audit is hidden from assistive tech and holds nothing focusable', async ({ page }) => {
  await gotoHome(page)
  await wheelThrough(page)
  const marked = await page.locator(DECORATIVE).evaluateAll((els) =>
    els.map((el) => ({
      html: el.outerHTML.slice(0, 80),
      hidden: el.closest('[aria-hidden="true"]') !== null,
      focusable: el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
    })),
  )
  for (const m of marked) {
    expect(m.hidden, `${m.html} is aria-hidden`).toBe(true)
    expect(m.focusable, `${m.html} holds nothing focusable`).toBe(0)
  }
})
