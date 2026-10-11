import type { CSSProperties, ReactNode } from 'react'
import { keyColor, type SpectrumKey } from '@/lib/score'

/** The two keys a heading's accent runs between, as SectionHeader sets them. */
export function keyStyle(from: SpectrumKey, to: SpectrumKey): CSSProperties {
  return { '--key-from': keyColor(from), '--key-to': keyColor(to) } as CSSProperties
}

/**
 * The top of a page that is not the home page: the kicker, an h1 and the
 * intro, in exactly SectionHeader's type, ink and gaps, so a route reads as
 * the same score as the home page's movements.
 *
 * SectionHeader itself can't be used: it renders an h2 that assembles from
 * scattered letters on the client, and these pages have to say their heading
 * in the server HTML (crawlers, link unfurls, a visitor with JS off).
 */
export function PageHeader({
  kicker,
  lead,
  accent,
  keys,
  intro,
  children,
}: {
  /** The line above the heading: `// program notes`. */
  kicker: string
  /** Words before the accent, in white. */
  lead?: string
  /** The accent, drawn in `keys[0]` running into `keys[1]`. */
  accent: string
  keys: readonly [SpectrumKey, SpectrumKey]
  intro?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="mb-10 md:mb-16">
      <p className="section-label mb-3 font-mono text-label uppercase tracking-[0.3em] text-ink-meta">{kicker}</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
        {lead ? `${lead} ` : null}
        <span className="text-key" style={keyStyle(keys[0], keys[1])}>
          {accent}
        </span>
      </h1>
      {intro ? <p className="mt-4 max-w-lg text-body text-ink-meta">{intro}</p> : null}
      {children}
    </header>
  )
}
