import { cn } from '@/lib/utils'
import { DISPLAY, HAIRLINE, INTRO, KICKER, NUMERAL } from './look'

/**
 * The one section header, so every act reads as a chapter of one book: the
 * act's numeral in gold Cinzel with a short gold hairline, the kicker in
 * Geist capitals, the title (an h2) in Cinzel, and an optional intro in
 * Cormorant italic.
 *
 * `act` is the act as words ("Act II"): its numeral is drawn, and "Act"
 * stays for screen readers, so the line still reads "Act II, Client work".
 */
export function SectionHeader({
  id,
  act,
  kicker,
  title,
  intro,
  className,
}: {
  id: string
  act: string
  kicker: string
  title: React.ReactNode
  intro?: React.ReactNode
  className?: string
}) {
  const [, word, numeral] = act.match(/^(\S+)\s+(\S+)$/) ?? [act, '', act]
  return (
    <div className={cn('max-w-4xl', className)}>
      <p className="flex items-center gap-4 md:gap-5">
        <span className={NUMERAL}>
          {word ? <span className="sr-only">{word} </span> : null}
          {numeral}
        </span>
        <span aria-hidden="true" className={HAIRLINE} />
        <span className="sr-only">, </span>
        <span className={KICKER}>{kicker}</span>
      </p>
      <h2 id={id} className={`mt-6 ${DISPLAY}`}>
        {title}
      </h2>
      {intro ? <p className={`mt-5 ${INTRO}`}>{intro}</p> : null}
    </div>
  )
}

/**
 * The Stage's small gold mark, the intro's sparkle between two hairlines:
 * the hero's crest, and a closing mark wherever a page wants one. Decoration
 * only (aria-hidden).
 */
export function Ornament({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex items-center justify-center gap-3 text-[var(--stage-accent-ink)]', className)}>
      <span className="h-px w-12 bg-linear-to-r from-transparent to-[color-mix(in_oklab,var(--stage-accent-ink)_75%,transparent)] md:w-20" />
      <svg viewBox="0 0 12 12" className="size-3 shrink-0" fill="currentColor">
        <path d="M6 0c.35 3.1 2.9 5.65 6 6-3.1.35-5.65 2.9-6 6-.35-3.1-2.9-5.65-6-6 3.1-.35 5.65-2.9 6-6Z" />
      </svg>
      <span className="h-px w-12 bg-linear-to-l from-transparent to-[color-mix(in_oklab,var(--stage-accent-ink)_75%,transparent)] md:w-20" />
    </span>
  )
}

/** The page column, aligned with the About block's own 1280px container. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-12', className)}>{children}</div>
}
