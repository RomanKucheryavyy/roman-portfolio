import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { gotoHome, wheelThrough } from './helpers'

/**
 * An axe ratchet. tests/a11y-baseline.json records, per project and route, how
 * many nodes fail each serious or critical rule today. A count above its
 * baseline fails; a count below it passes and is reported, so the baseline can
 * be lowered in the same PR that earned it. The end state (W12) is an empty
 * baseline.
 *
 * Counts on / jitter by a node or two between runs: axe scrolls each element
 * into view to sample its background, and the fixed nav or a scrubbing
 * SectionTransition caption sometimes covers it (axe then files it under
 * "incomplete", not "violations"). So the baseline holds the highest count
 * seen over several runs, not one sample.
 *
 * To re-record: A11Y_RECORD=1 npx playwright test tests/a11y.spec.ts
 * (replaces each entry), then A11Y_RECORD=max with the same command two or
 * three more times (keeps the highest count per rule).
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
    },
  },
  { name: 'works', path: '/works', ready: async (page) => { await page.goto('/works'); await page.waitForTimeout(1500) } },
  { name: 'resume', path: '/resume', ready: async (page) => { await page.goto('/resume'); await page.waitForTimeout(1500) } },
  { name: 'not-found', path: '/does-not-exist', ready: async (page) => { await page.goto('/does-not-exist'); await page.waitForTimeout(500) } },
]

const readBaseline = (): Baseline => JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))

for (const route of ROUTES) {
  test(`axe: ${route.path} has no serious or critical violations above the baseline`, async ({ page }) => {
    const project = test.info().project.name

    await route.ready(page)
    const results = await new AxeBuilder({ page }).analyze()

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
