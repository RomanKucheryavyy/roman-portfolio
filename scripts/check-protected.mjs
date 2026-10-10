#!/usr/bin/env node
/**
 * Guards what the owner has said must not change without him.
 *
 *   - The hero and its motion: Hero.tsx, the FFT ocean (fft-ocean.tsx and
 *     fft-ocean-utils/), Starfield.tsx, useParallax.ts, useMouseVelocity.ts.
 *     Any change at all.
 *   - The deck physics in Projects.tsx: any added or removed line containing
 *     drag=, dragConstraints, dragElastic, SPRING, STACK_DEPTH or touchAction.
 *     (The phone deck's horizontal drag with touchAction 'pan-y' is the fix
 *     for a page that could not be scrolled; it is not to be "unified".)
 *   - The /works wheel in works-wheel.tsx: the STEP, DRUM, LENS, BOW and
 *     CARD_* declarations, and the per-frame draw loop.
 *
 * Every commit after PROTECTED_SINCE (default abb0023, where these rules
 * start) that touches one of them fails unless its message carries
 * `[owner-approved:<item>]`. Uncommitted changes to them fail too, since an
 * approval can only live in a commit message. Merge commits are skipped.
 *
 * Needs full history (CI checks out with fetch-depth: 0).
 * Env: PROTECTED_SINCE=<rev> moves the floor; PROTECTED_BASE=<rev> narrows the
 * range to <base>..HEAD (both floors apply).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const SINCE = process.env.PROTECTED_SINCE ?? 'abb0023'
const BASE = process.env.PROTECTED_BASE
const APPROVED = /\[owner-approved:[^\]\s][^\]]*\]/

const WHOLE_FILES = [
  'src/components/sections/Hero.tsx',
  'src/components/ui/fft-ocean.tsx',
  'src/components/canvas/Starfield.tsx',
  'src/hooks/useParallax.ts',
  'src/hooks/useMouseVelocity.ts',
]
const WHOLE_DIRS = ['src/components/ui/fft-ocean-utils/']

const DECK = 'src/components/sections/Projects.tsx'
const DECK_LINE = /(drag=|dragConstraints|dragElastic|SPRING|STACK_DEPTH|touchAction)/

const WHEEL = 'src/components/ui/works-wheel.tsx'
const WHEEL_CONST = /^\s*(export\s+)?const\s+(STEP|DRUM|LENS|BOW|CARD_[A-Z0-9_]+)\b\s*=/
const LOOP_START = /const draw = \(\) => \{/
const LOOP_END = /cancelAnimationFrame\(frame\)/

const run = (args, quiet) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', quiet ? 'ignore' : 'inherit'],
  })
const git = (...args) => run(args, false)
/** Like git(), but null instead of a throw, and silent: used for files that
 *  may not exist at a revision. */
const tryGit = (...args) => {
  try {
    return run(args, true)
  } catch {
    return null
  }
}

const isWhole = (file) => WHOLE_FILES.includes(file) || WHOLE_DIRS.some((dir) => file.startsWith(dir))

/** [first, last] line numbers (1-based) of the wheel's draw loop, or null. */
function loopRegion(source) {
  if (source === null) return null
  const lines = source.split('\n')
  const start = lines.findIndex((l) => LOOP_START.test(l))
  if (start < 0) return null
  const end = lines.findIndex((l, i) => i > start && LOOP_END.test(l))
  return end < 0 ? null : [start + 1, end + 1]
}

/** Parses a -U0 patch into per-file lists of {sign, line, text}. */
function parsePatch(patch) {
  const files = new Map()
  let current = null
  let oldLine = 0
  let newLine = 0
  for (const raw of patch.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      const m = raw.match(/^diff --git a\/(.+) b\/(.+)$/)
      current = { from: m?.[1], to: m?.[2], changes: [] }
      files.set(current.to ?? current.from, current)
      continue
    }
    if (!current) continue
    if (raw.startsWith('--- ') || raw.startsWith('+++ ')) continue
    const hunk = raw.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      oldLine = Number(hunk[1])
      newLine = Number(hunk[2])
      continue
    }
    if (raw.startsWith('-')) current.changes.push({ sign: '-', line: oldLine++, text: raw.slice(1) })
    else if (raw.startsWith('+')) current.changes.push({ sign: '+', line: newLine++, text: raw.slice(1) })
  }
  return files
}

/**
 * Returns the protected things a change set touches.
 * `oldSource(path)` / `newSource(path)` give the file before and after.
 */
function violationsIn(patch, oldSource, newSource) {
  const found = []
  for (const { from, to, changes } of parsePatch(patch).values()) {
    for (const name of new Set([from, to].filter(Boolean))) {
      if (isWhole(name)) {
        found.push(`${name}: protected file changed`)
      }
    }
    if (from === DECK || to === DECK) {
      for (const c of changes) {
        if (DECK_LINE.test(c.text)) found.push(`${DECK}:${c.line} deck-physics line ${c.sign === '-' ? 'removed' : 'added'}: ${c.text.trim()}`)
      }
    }
    if (from === WHEEL || to === WHEEL) {
      const before = loopRegion(oldSource(WHEEL))
      const after = loopRegion(newSource(WHEEL))
      if (newSource(WHEEL) !== null && after === null) found.push(`${WHEEL}: the draw loop can no longer be found; review it by hand`)
      for (const c of changes) {
        if (WHEEL_CONST.test(c.text)) found.push(`${WHEEL}:${c.line} wheel geometry constant ${c.sign === '-' ? 'removed' : 'added'}: ${c.text.trim()}`)
        const region = c.sign === '-' ? before : after
        if (region && c.line >= region[0] && c.line <= region[1]) {
          found.push(`${WHEEL}:${c.line} draw-loop line ${c.sign === '-' ? 'removed' : 'added'}: ${c.text.trim()}`)
        }
      }
    }
  }
  return found
}

const WATCHED = [...WHOLE_FILES, ...WHOLE_DIRS, DECK, WHEEL]

if (tryGit('cat-file', '-e', `${SINCE}^{commit}`) === null) {
  console.error(`check-protected: ${SINCE} is not in this clone's history. Fetch the full history (fetch-depth: 0) or set PROTECTED_SINCE.`)
  process.exit(2)
}

const range = ['HEAD', `^${SINCE}`, ...(BASE ? [`^${BASE}`] : [])]
const commits = git('rev-list', '--no-merges', '--reverse', ...range, '--', ...WATCHED).split('\n').filter(Boolean)
const failures = []
let approved = 0

for (const sha of commits) {
  const patch = git('show', '--format=', '-U0', '--no-color', '--no-ext-diff', '-M', sha, '--', ...WATCHED)
  const found = violationsIn(
    patch,
    (p) => tryGit('show', `${sha}^:${p}`),
    (p) => tryGit('show', `${sha}:${p}`),
  )
  if (!found.length) continue
  const message = git('log', '-1', '--format=%B', sha)
  const subject = message.split('\n')[0]
  if (APPROVED.test(message)) {
    approved++
    console.log(`approved  ${sha.slice(0, 7)} ${subject} (${message.match(APPROVED)[0]})`)
    continue
  }
  failures.push({ where: `${sha.slice(0, 7)} ${subject}`, found })
}

// Uncommitted edits (staged or not), plus new untracked files under a protected directory.
const working = git('diff', 'HEAD', '-U0', '--no-color', '--no-ext-diff', '--', ...WATCHED)
const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...WATCHED).split('\n').filter(Boolean)
const workingFound = [
  ...violationsIn(
    working,
    (p) => tryGit('show', `HEAD:${p}`),
    (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null),
  ),
  ...untracked.filter(isWhole).map((f) => `${f}: new file in a protected place`),
]
if (workingFound.length) failures.push({ where: 'uncommitted changes (an approval can only be given in a commit message)', found: workingFound })

console.log(`check-protected: ${commits.length} commit(s) since ${SINCE} touch a watched file; ${approved} carry [owner-approved:…]`)
if (failures.length) {
  console.error('\nProtected changes without [owner-approved:<item>]:')
  for (const { where, found } of failures) {
    console.error(`  ${where}`)
    for (const f of found.slice(0, 12)) console.error(`    - ${f}`)
    if (found.length > 12) console.error(`    ... and ${found.length - 12} more`)
  }
  console.error('\nThe hero, the ocean, the deck physics and the wheel geometry change only with Roman\'s written OK, in a commit tagged [owner-approved:<item>]. See CLAUDE.md.')
  process.exit(1)
}
console.log('check-protected: nothing protected changed without approval')
