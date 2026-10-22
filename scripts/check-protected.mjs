#!/usr/bin/env node
/**
 * Guards the copy the owner has fixed: two descriptions in
 * src/lib/constants.ts that change only with Roman's written OK.
 *
 *   - FUBC Coffee iOS (`id: 'fubc-coffee-ios'`): it keeps "Apple Pay".
 *   - Nelectric (`id: 'nelectric'`): word for word as it stands.
 *
 * Every commit after PROTECTED_SINCE (default abb0023, where the owner's
 * rules start) whose change alters either description, or removes it from
 * constants.ts, fails unless its message carries `[owner-approved:copy]`.
 * Uncommitted changes fail too, since an approval can only live in a commit
 * message.
 *
 * What is compared is the description's text, read out of the file at both
 * revisions, not lines: reformatting around it, moving the entry or editing
 * any other field passes; a changed word, a changed quote style that changes
 * the text, or a vanished entry does not.
 *
 * A merge passes when each description it leaves matches one of its
 * parents' (the conflict, if any, was settled by taking one side as it was,
 * and each side's own commits are checked anyway). Anything new that a merge
 * writes into either description needs the tag in the merge's own message.
 *
 * Retired here (approved by Roman for the Stage redesign, commit 925af16):
 * the rules for the old hero and FFT ocean, the drag deck's physics and the
 * /works wheel's geometry. Those files are gone.
 *
 * Needs full history (CI checks out with fetch-depth: 0).
 * Env: PROTECTED_SINCE=<rev> moves the floor; PROTECTED_BASE=<rev> narrows the
 * range to <base>..HEAD (both floors apply).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const SINCE = process.env.PROTECTED_SINCE ?? 'abb0023e9e6634e783bbb39cd4a9f784f8e16973'
const BASE = process.env.PROTECTED_BASE
const TAG = '[owner-approved:copy]'

const FILE = 'src/lib/constants.ts'
/** The guarded entries: their id in PROJECTS, and how a failure names them. */
const GUARDED = [
  { id: 'fubc-coffee-ios', name: 'the FUBC Coffee iOS description' },
  { id: 'nelectric', name: 'the Nelectric description' },
]

const run = (args, quiet) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', quiet ? 'ignore' : 'inherit'],
  })
const git = (...args) => run(args, false)
/** Like git(), but null instead of a throw, and silent: for a file that may not exist at a revision. */
const tryGit = (...args) => {
  try {
    return run(args, true)
  } catch {
    return null
  }
}
const lines = (out) => out.split('\n').filter(Boolean)
const show = (rev) => tryGit('show', `${rev}:${FILE}`)

/**
 * The description of entry `id` in a version of constants.ts: the first
 * `description:` string literal after `id: '<id>'`, with its escapes
 * resolved, so `'…'`, `"…"` and a plain template literal holding the same
 * words compare equal. Null when the file or the entry is missing.
 */
function descriptionOf(source, id) {
  if (source === null) return null
  const at = source.search(new RegExp(`\\bid:\\s*(['"\`])${id}\\1`))
  if (at < 0) return null
  const m = source.slice(at).match(/\bdescription:\s*(['"`])((?:\\[\s\S]|(?!\1)[^\\])*)\1/)
  if (!m) return null
  return m[2].replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, e) => {
    if (e[0] === 'u') return String.fromCodePoint(parseInt(e.replace(/[u{}]/g, ''), 16))
    if (e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16))
    return { n: '\n', t: '\t', r: '\r', '\n': '' }[e] ?? e
  })
}

/** What changed between two versions of the file, as failure lines. */
function changes(before, after) {
  const found = []
  for (const { id, name } of GUARDED) {
    const was = descriptionOf(before, id)
    const now = descriptionOf(after, id)
    if (was === now) continue
    if (now === null) found.push(`${name} is gone from ${FILE}`)
    else if (was === null) continue // the entry arrives: nothing was fixed yet
    else found.push(`${name} changed:\n        was: ${JSON.stringify(was)}\n        now: ${JSON.stringify(now)}`)
  }
  return found
}

/** A merge's descriptions that match none of its parents'. */
function mergeChanges(sha, parents) {
  const mine = show(sha)
  const found = []
  for (const { id, name } of GUARDED) {
    const now = descriptionOf(mine, id)
    const theirs = parents.map((p) => descriptionOf(show(p), id))
    if (theirs.includes(now)) continue
    if (theirs.every((t) => t === null)) continue // no parent had it yet
    found.push(`${name} matches neither parent's${now === null ? ' (it is gone)' : `: ${JSON.stringify(now)}`}`)
  }
  return found
}

if (tryGit('cat-file', '-e', `${SINCE}^{commit}`) === null) {
  console.error(`check-protected: ${SINCE} is not in this clone's history. Fetch the full history (fetch-depth: 0) or set PROTECTED_SINCE.`)
  process.exit(2)
}

const range = ['HEAD', `^${SINCE}`, ...(BASE ? [`^${BASE}`] : [])]
const all = lines(git('rev-list', '--reverse', '--parents', ...range)).map((l) => l.split(' '))
// Non-merge commits that touch the file (--full-history, so a side branch
// whose change a merge threw away is still walked).
const touching = new Set(lines(git('rev-list', '--no-merges', '--full-history', ...range, '--', FILE)))
const failures = []
let checked = 0
let merges = 0
let approved = 0

for (const [sha, ...parents] of all) {
  const isMerge = parents.length > 1
  let found
  if (isMerge) {
    merges++
    found = mergeChanges(sha, parents)
  } else {
    if (!touching.has(sha)) continue
    checked++
    found = changes(parents[0] ? show(parents[0]) : null, show(sha))
  }
  if (!found.length) continue
  const message = git('log', '-1', '--format=%B', sha)
  const subject = message.split('\n')[0]
  if (message.includes(TAG)) {
    approved++
    console.log(`approved  ${sha.slice(0, 7)} ${subject} (${TAG})`)
    continue
  }
  failures.push({ where: `${sha.slice(0, 7)} ${subject}${isMerge ? ' (merge)' : ''}`, found })
}

// Uncommitted edits, staged or not: HEAD against the working tree.
const working = changes(show('HEAD'), existsSync(FILE) ? readFileSync(FILE, 'utf8') : null)
if (working.length) failures.push({ where: 'uncommitted changes (an approval can only be given in a commit message)', found: working })

console.log(
  `check-protected: since ${SINCE.slice(0, 7)}, ${checked} commit(s) touch ${FILE} and ${merges} merge(s) were checked; ${approved} carry ${TAG}`,
)
if (failures.length) {
  console.error(`\nOwner-fixed copy changed without ${TAG}:`)
  for (const { where, found } of failures) {
    console.error(`  ${where}`)
    for (const f of found) console.error(`    - ${f}`)
  }
  console.error(
    `\nThe FUBC Coffee iOS description (it keeps "Apple Pay") and the Nelectric description change only with Roman's written OK, in a commit tagged ${TAG}. See CLAUDE.md.`,
  )
  process.exit(1)
}
console.log('check-protected: the owner-fixed copy is unchanged')
