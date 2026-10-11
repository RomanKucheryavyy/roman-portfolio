#!/usr/bin/env node
/**
 * Per-route JavaScript budget, run after `npm run build`.
 *
 * Next writes each route's first-load JS (uncompressed bytes) to
 * .next/diagnostics/route-bundle-stats.json. Every route is held to its entry
 * in scripts/budget.json; a route with no entry (a page added since the last
 * ratchet) is held to `defaultRouteBudget` and named in the output so it gets
 * its own line. A missing stats file is a failure, not a skip: it means the
 * build didn't run, or Next moved the file, and either way nothing was checked.
 *
 * Once `fontsSelfHosted` is true in budget.json, any built stylesheet that
 * still mentions fonts.googleapis.com fails too (the @import coming back).
 *
 * Exit 0 within budget, 1 otherwise.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const STATS = path.join(root, '.next', 'diagnostics', 'route-bundle-stats.json')
const BUDGET = path.join(root, 'scripts', 'budget.json')
const CHUNKS = path.join(root, '.next', 'static')

const fmt = (n) => n.toLocaleString('en-US')
const failures = []

if (!existsSync(STATS)) {
  console.error(`budget: ${path.relative(root, STATS)} not found. Run \`npm run build\` first; if the build did run, Next has moved its route stats and this script needs the new path.`)
  process.exit(1)
}

const budget = JSON.parse(readFileSync(BUDGET, 'utf8'))
const stats = JSON.parse(readFileSync(STATS, 'utf8'))
if (!Array.isArray(stats) || stats.length === 0) {
  console.error('budget: route-bundle-stats.json has no routes; its format may have changed.')
  process.exit(1)
}

const rows = []
for (const { route, firstLoadUncompressedJsBytes: bytes } of stats) {
  if (typeof bytes !== 'number') {
    failures.push(`${route}: no firstLoadUncompressedJsBytes in the stats (format changed?)`)
    continue
  }
  const own = budget.routes?.[route]
  const limit = own ?? budget.defaultRouteBudget
  const over = bytes > limit
  rows.push({ route, bytes, limit, note: own === undefined ? 'no entry: default budget' : '', over })
  if (over) failures.push(`${route}: ${fmt(bytes)} B is over its ${fmt(limit)} B budget by ${fmt(bytes - limit)} B`)
}

for (const route of Object.keys(budget.routes ?? {})) {
  if (!stats.some((s) => s.route === route)) console.warn(`budget: ${route} has a budget but was not built (renamed or removed?)`)
}

const width = Math.max(...rows.map((r) => r.route.length), 5)
console.log(`${'route'.padEnd(width)}  ${'first-load JS'.padStart(13)}  ${'budget'.padStart(11)}  headroom`)
for (const r of rows) {
  const headroom = (((r.limit - r.bytes) / r.limit) * 100).toFixed(1) + '%'
  console.log(`${r.route.padEnd(width)}  ${fmt(r.bytes).padStart(13)}  ${fmt(r.limit).padStart(11)}  ${headroom.padStart(8)}${r.over ? '  OVER' : ''}${r.note ? `  (${r.note})` : ''}`)
}

if (budget.fontsSelfHosted) {
  const css = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name.endsWith('.css')) css.push(file)
    }
  }
  if (existsSync(CHUNKS)) walk(CHUNKS)
  for (const file of css) {
    if (readFileSync(file, 'utf8').includes('fonts.googleapis.com')) {
      failures.push(`${path.relative(root, file)} references fonts.googleapis.com, but budget.json says fonts are self-hosted`)
    }
  }
  console.log(`fonts: self-hosted, ${css.length} built stylesheet(s) checked for fonts.googleapis.com`)
}

if (failures.length) {
  console.error(`\nbudget: ${failures.length} failure(s)`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('\nbudget: every route is within budget')
