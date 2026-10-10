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
 * approval can only live in a commit message.
 *
 * Merge commits are checked for what the merge itself introduced: the diff
 * from git's own re-merge of the parents to the commit (`git show
 * --remerge-diff`). A clean merge has none. An edit slipped into a merge, or
 * into a conflict resolution, needs the tag in the merge's message, like any
 * other commit. One allowance: in a file that conflicted, a resolution whose
 * protected lines are exactly one parent's (the conflict was settled by taking
 * one side's protected lines as they were) passes, because each side's own
 * commits are checked anyway. An octopus merge (3+ parents) cannot be
 * re-merged, so it fails for any watched file whose protected lines match no
 * parent's.
 *
 * Needs full history (CI checks out with fetch-depth: 0) and git 2.38+
 * (remerge-diff and merge-tree --write-tree).
 * Env: PROTECTED_SINCE=<rev> moves the floor; PROTECTED_BASE=<rev> narrows the
 * range to <base>..HEAD (both floors apply).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const SINCE = process.env.PROTECTED_SINCE ?? 'abb0023e9e6634e783bbb39cd4a9f784f8e16973'
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
/** Multi-line blocks of works-wheel.tsx where every line is protected. The end
 *  pattern is matched from the start line on. */
const WHEEL_BLOCKS = [
  { name: 'draw-loop', start: /const draw = \(\) => \{/, end: /cancelAnimationFrame\(frame\)/ },
]

const WATCHED = [...WHOLE_FILES, ...WHOLE_DIRS, DECK, WHEEL]

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
const lines = (out) => out.split('\n').filter(Boolean)

const isWhole = (file) => WHOLE_FILES.includes(file) || WHOLE_DIRS.some((dir) => file.startsWith(dir))

/** {name, first, last} (1-based, inclusive) for each wheel block found in `source`. */
function wheelBlocks(source) {
  if (source === null) return []
  const src = source.split('\n')
  const found = []
  for (const { name, start, end } of WHEEL_BLOCKS) {
    const first = src.findIndex((l) => start.test(l))
    if (first < 0) continue
    const last = src.findIndex((l, i) => i >= first && end.test(l))
    if (last >= 0) found.push({ name, first: first + 1, last: last + 1 })
  }
  return found
}

/** A file's protected content and nothing else: equal signatures mean no
 *  protected difference between two versions of the file. */
function signature(file, source) {
  if (source === null) return '\0absent'
  if (isWhole(file)) return source
  const src = source.split('\n')
  if (file === DECK) return src.filter((l) => DECK_LINE.test(l)).join('\n')
  if (file === WHEEL) {
    const consts = src.filter((l) => WHEEL_CONST.test(l))
    const blocks = wheelBlocks(source).map((b) => `${b.name}\n${src.slice(b.first - 1, b.last).join('\n')}`)
    return [...consts, ...blocks].join('\n')
  }
  return ''
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
 * Returns the protected things a change set touches, as {file, text}.
 * `oldSource(path)` / `newSource(path)` give the file before and after; the
 * patch's line numbers must refer to those two.
 */
function violationsIn(patch, oldSource, newSource) {
  const found = []
  const add = (file, text) => found.push({ file, text: `${file}${text}` })
  for (const { from, to, changes } of parsePatch(patch).values()) {
    for (const name of new Set([from, to].filter(Boolean))) {
      if (isWhole(name)) add(name, ': protected file changed')
    }
    if (from === DECK || to === DECK) {
      for (const c of changes) {
        if (DECK_LINE.test(c.text)) add(DECK, `:${c.line} deck-physics line ${c.sign === '-' ? 'removed' : 'added'}: ${c.text.trim()}`)
      }
    }
    if (from === WHEEL || to === WHEEL) {
      const before = wheelBlocks(oldSource(WHEEL))
      const now = newSource(WHEEL)
      const after = wheelBlocks(now)
      if (now !== null) {
        for (const { name } of WHEEL_BLOCKS) {
          if (!after.some((b) => b.name === name)) add(WHEEL, `: ${name} can no longer be found; review it by hand`)
        }
      }
      for (const c of changes) {
        const verb = c.sign === '-' ? 'removed' : 'added'
        if (WHEEL_CONST.test(c.text)) add(WHEEL, `:${c.line} wheel geometry constant ${verb}: ${c.text.trim()}`)
        const block = (c.sign === '-' ? before : after).find((b) => c.line >= b.first && c.line <= b.last)
        if (block) add(WHEEL, `:${c.line} ${block.name} line ${verb}: ${c.text.trim()}`)
      }
    }
  }
  return found
}

/** The tree git's own merge of p1 and p2 produces (conflict markers and all),
 *  and the files that conflicted. Its line numbers are the ones remerge-diff's
 *  old side uses, so both run with the same conflict style. merge-tree exits 1
 *  when the merge conflicts; that is still an answer. */
function remerge(p1, p2) {
  try {
    return run(['-c', 'merge.conflictStyle=merge', 'merge-tree', '--write-tree', '--name-only', '--no-messages', p1, p2], true)
  } catch (err) {
    if (err.status === 1 && typeof err.stdout === 'string' && err.stdout) return err.stdout
    return null
  }
}

/** What a merge commit introduced in the watched files, beyond git's own merge. */
function mergeViolations(sha, parents) {
  const show = (rev) => (p) => tryGit('show', `${rev}:${p}`)
  if (parents.length > 2) {
    const changed = lines(git('diff', '--name-only', '--no-renames', parents[0], sha, '--', ...WATCHED))
    return changed
      .filter((f) => !parents.some((p) => signature(f, show(p)(f)) === signature(f, show(sha)(f))))
      .map((f) => ({ file: f, text: `${f}: octopus merge leaves protected lines that match no parent's; review by hand` }))
  }
  let patch
  try {
    patch = run(['-c', 'merge.conflictStyle=merge', 'show', '--remerge-diff', '--format=', '-U0', '--no-color', '--no-ext-diff', sha, '--', ...WATCHED], true)
  } catch {
    console.error(`check-protected: \`git show --remerge-diff ${sha.slice(0, 7)}\` failed. This check needs git 2.38 or newer.`)
    process.exit(2)
  }
  if (!patch.trim()) return []
  const out = remerge(parents[0], parents[1])
  if (out === null) {
    console.error(`check-protected: \`git merge-tree --write-tree\` failed for ${sha.slice(0, 7)}. This check needs git 2.38 or newer.`)
    process.exit(2)
  }
  const [tree, ...conflicted] = lines(out)
  const found = violationsIn(patch, show(tree), show(sha))
  return found.filter(({ file }) => {
    if (!conflicted.includes(file)) return true
    const merged = signature(file, show(sha)(file))
    return !parents.some((p) => signature(file, show(p)(file)) === merged)
  })
}

if (tryGit('cat-file', '-e', `${SINCE}^{commit}`) === null) {
  console.error(`check-protected: ${SINCE} is not in this clone's history. Fetch the full history (fetch-depth: 0) or set PROTECTED_SINCE.`)
  process.exit(2)
}

const range = ['HEAD', `^${SINCE}`, ...(BASE ? [`^${BASE}`] : [])]
// Every commit in range, oldest first, with its parents; every merge is
// re-merged. The non-merge commits that touch a watched file come from a
// path-limited walk, --full-history so that a side branch whose changes a
// merge threw away is still walked.
const all = lines(git('rev-list', '--reverse', '--parents', ...range)).map((l) => l.split(' '))
const touching = new Set(lines(git('rev-list', '--no-merges', '--full-history', ...range, '--', ...WATCHED)))
const failures = []
let checked = 0
let merges = 0
let approved = 0

for (const [sha, ...parents] of all) {
  const isMerge = parents.length > 1
  let found
  if (isMerge) {
    merges++
    found = mergeViolations(sha, parents)
  } else {
    if (!touching.has(sha)) continue
    checked++
    const patch = git('show', '--format=', '-U0', '--no-color', '--no-ext-diff', '-M', sha, '--', ...WATCHED)
    found = violationsIn(
      patch,
      (p) => tryGit('show', `${sha}^:${p}`),
      (p) => tryGit('show', `${sha}:${p}`),
    )
  }
  if (!found.length) continue
  const message = git('log', '-1', '--format=%B', sha)
  const subject = message.split('\n')[0]
  if (APPROVED.test(message)) {
    approved++
    console.log(`approved  ${sha.slice(0, 7)} ${subject} (${message.match(APPROVED)[0]})`)
    continue
  }
  failures.push({ where: `${sha.slice(0, 7)} ${subject}${isMerge ? ' (merge: changes beyond what git merged on its own)' : ''}`, found: found.map((f) => f.text) })
}

// Uncommitted edits (staged or not), plus new untracked files under a protected directory.
const working = git('diff', 'HEAD', '-U0', '--no-color', '--no-ext-diff', '--', ...WATCHED)
const untracked = lines(git('ls-files', '--others', '--exclude-standard', '--', ...WATCHED))
const workingFound = [
  ...violationsIn(
    working,
    (p) => tryGit('show', `HEAD:${p}`),
    (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null),
  ).map((f) => f.text),
  ...untracked.filter(isWhole).map((f) => `${f}: new file in a protected place`),
]
if (workingFound.length) failures.push({ where: 'uncommitted changes (an approval can only be given in a commit message)', found: workingFound })

console.log(`check-protected: since ${SINCE.slice(0, 7)}, ${checked} commit(s) touch a watched file and ${merges} merge(s) were re-merged; ${approved} carry [owner-approved:…]`)
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
