import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PageBlock } from '@/app/_components/PageBlock'
import { PageHeader, SectionShell } from '@/components/ui/SectionShell'
import FactList, { type Fact } from '@/components/ui/FactList'
import { BUILD_CONTEXT, BUILD_SHA, BUILD_TIME, commitUrl, commitUrlOf, sha7 } from '@/lib/build-info'
import { MOVEMENTS, keyColor, keyOf, nextKeyOf } from '@/lib/score'
import { pageMetadata } from '@/lib/seo'
import pkg from '../../../package.json'
import budget from '../../../scripts/budget.json'

/**
 * Liner notes: how this site is built, in facts the build reads for itself.
 * Versions come from the lockfile, the score from score.ts, the build stamp
 * from Netlify's environment and the budgets from scripts/budget.json, so
 * nothing here can drift from the code it describes. It takes over the "this
 * site's own source" promise CodePeek made with invented filenames.
 *
 * There is deliberately no performance score here: a lab number measured
 * once on one machine is not a fact about every visit.
 */

export const metadata = pageMetadata({
  path: '/colophon',
  title: 'Liner notes',
  description: 'How romankucheryavyy.com is built: its typefaces, its stack, the score it is laid out on, this build, and the budgets it is held to.',
})

// ── Engineering notes ───────────────────────────────────────────────────────
// needs Roman: whether to publish these, given that the commits they cite carry
// public Co-Authored-By: Claude trailers. Every sentence links to the commit it
// is about; tests/proof.spec.ts checks each SHA resolves (git cat-file -e).
const NOTES_PUBLISHED = false

const NOTES: { shas: readonly string[]; text: string }[] = [
  {
    shas: ['a5ed0a7'],
    text: 'The contact form had never sent anything: it posted to / the Netlify way, Next answered 200 with a page of HTML, and the form celebrated. It now posts to its own API with two independent channels, and says so when neither is set up.',
  },
  {
    shas: ['dafc747', 'df78405'],
    text: 'A note in the history called Netlify Forms a dead end. It was one deploy short. The correction sits next to the mistake rather than replacing it.',
  },
  {
    shas: ['ee4ec79'],
    text: 'The phone deck swipes sideways because a vertical drag with touch-action: none made the whole page impossible to scroll.',
  },
  {
    shas: ['a098c58'],
    text: 'One blocked request to the 3D phone used to white out the home page. It now loads only where WebGL works, inside a boundary that falls back to the screenshot.',
  },
]

// ── Facts read from the repo ────────────────────────────────────────────────

/** The packages a visitor's page actually runs on, in the order the stack is usually told. */
const STACK = ['next', 'react', 'three', 'gsap', 'framer-motion', 'lenis', 'tailwindcss'] as const

const DECLARED: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }

/** The exact version this build installed, from package-lock.json; the declared range if the lockfile can't be read. */
function installedVersions(): Record<string, string | undefined> {
  try {
    const lock = JSON.parse(readFileSync(join(process.cwd(), 'package-lock.json'), 'utf8')) as {
      packages?: Record<string, { version?: string }>
    }
    return Object.fromEntries(STACK.map((name) => [name, lock.packages?.[`node_modules/${name}`]?.version]))
  } catch {
    return {}
  }
}

const bytes = (n: number) => `${n.toLocaleString('en-US')} B`

/** A package name or a route, which an uppercase label would misspell. */
const Name = ({ children }: { children: string }) => <span className="normal-case tracking-normal">{children}</span>

const day = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

function builtAt(iso: string): string {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return 'unknown'
  return `${date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`
}

const TYPEFACES: Fact[] = [
  { term: <Name>Archivo</Name>, value: <span className="font-display text-lead font-bold text-white">Names and numbers</span> },
  { term: <Name>Space Grotesk</Name>, value: <span className="font-body text-lead text-white">Prose, like this page</span> },
  { term: <Name>JetBrains Mono</Name>, value: <span className="font-mono text-lead text-white">{'// labels and code'}</span> },
]

const ROW = 'border-t border-white/10'
const CELL = 'px-4 py-3 align-top'

export default function ColophonPage() {
  const installed = installedVersions()
  const stack: Fact[] = STACK.map((name) => ({
    term: <Name>{name}</Name>,
    value: <span className="font-mono">{installed[name] ?? DECLARED[name] ?? 'not installed'}</span>,
    note: DECLARED[name] ? `${DECLARED[name]} in package.json` : undefined,
  }))

  const build: Fact[] = [
    {
      term: 'Commit',
      value: commitUrl ? (
        <a href={commitUrl} className="font-mono underline decoration-white/25 underline-offset-4 transition-colors hover:text-white">
          {sha7(BUILD_SHA)}
        </a>
      ) : (
        <span className="font-mono">local build</span>
      ),
    },
    { term: 'Built', value: builtAt(BUILD_TIME) },
    { term: 'Context', value: BUILD_CONTEXT },
  ]

  const budgets: Fact[] = [
    ...Object.entries(budget.routes).map(([route, limit]) => ({
      term: <Name>{route}</Name>,
      value: <span className="font-mono">{bytes(limit)}</span>,
      note:
        route in budget.measured.routes
          ? `measured ${bytes(budget.measured.routes[route as keyof typeof budget.measured.routes])} on Next ${budget.measured.next}, ${day(budget.measured.date)}`
          : undefined,
    })),
    { term: 'any other route', value: <span className="font-mono">{bytes(budget.defaultRouteBudget)}</span> },
  ]

  return (
    <main id="main" tabIndex={-1} className="relative min-h-svh w-full bg-black outline-none">
      <SectionShell className="pt-28 md:pt-32">
        <PageHeader
          kicker="// colophon"
          lead="Liner"
          accent="notes"
          keys={[keyOf('compose'), nextKeyOf('compose')]}
          intro="How this site is built. The versions, the score, the build stamp and the budgets below are read from the repository when the site is built, so none of them can drift from the code."
        />

        <PageBlock id="typefaces" heading="Typefaces">
          <FactList items={TYPEFACES} bordered />
          <p className="mt-3 font-mono text-label text-ink-meta">
            SIL Open Font License · self-hosted by next/font, so no request leaves this site for a font.
          </p>
        </PageBlock>

        <PageBlock id="stack" heading="Stack">
          <FactList items={stack} bordered />
          <p className="mt-3 font-mono text-label text-ink-meta">Installed versions, from package-lock.json.</p>
        </PageBlock>

        <PageBlock id="score" heading="The score">
          <p className="mb-4 text-small text-ink-body">
            Every movement of the home page is named once, in src/lib/score.ts. Each section&apos;s kicker and the accent
            on its heading read this table.
          </p>
          <div
            role="region"
            aria-label="The score, as a table"
            tabIndex={0}
            className="overflow-x-auto rounded-xl border border-white/10"
          >
            <table className="w-full min-w-[36rem] text-left text-small text-ink-body">
              <thead className="font-mono text-label uppercase tracking-wider text-ink-meta">
                <tr>
                  <th scope="col" className={CELL}>No.</th>
                  <th scope="col" className={CELL}>Label</th>
                  <th scope="col" className={CELL}>Score</th>
                  <th scope="col" className={CELL}>Key</th>
                  <th scope="col" className={CELL}>Caption</th>
                </tr>
              </thead>
              <tbody>
                {MOVEMENTS.map((m) => (
                  <tr key={m.id} className={ROW}>
                    <td className={`${CELL} font-mono`}>{m.numeral ?? '—'}</td>
                    <th scope="row" className={`${CELL} font-normal text-white`}>
                      {m.label ?? m.id}
                    </th>
                    <td className={CELL}>{m.score ?? '—'}</td>
                    <td className={CELL}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: keyColor(m.key) }}
                        />
                        {m.key}
                      </span>
                    </td>
                    <td className={`${CELL} font-mono text-label text-ink-meta`}>{m.caption ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageBlock>

        <PageBlock id="build" heading="This build">
          <FactList items={build} bordered />
        </PageBlock>

        <PageBlock id="budgets" heading="Budgets">
          <FactList items={budgets} bordered />
          <p className="mt-3 font-mono text-label text-ink-meta">
            First-load JavaScript per route, uncompressed. CI fails any change that takes a route over its line.
          </p>
        </PageBlock>

        {NOTES_PUBLISHED ? (
          <PageBlock id="engineering-notes" heading="Engineering notes">
            <ul className="grid gap-4 text-small text-ink-body">
              {NOTES.map((note) => (
                <li key={note.shas.join()}>
                  {note.text}{' '}
                  {note.shas.map((sha, i) => (
                    <span key={sha} className="font-mono text-label">
                      {i > 0 ? ' → ' : null}
                      <a href={commitUrlOf(sha)} className="text-ink-meta underline decoration-white/25 underline-offset-4 hover:text-white">
                        {sha}
                      </a>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </PageBlock>
        ) : null}
      </SectionShell>
    </main>
  )
}
