import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Glue for direction B. One column system for every section: the same side
 * gutter and the same 84rem measure the experience ledger uses internally
 * (clamp(1.25rem, 5vw, 5rem) and max-width 84rem), so every left edge on the
 * page lines up with the ledger's.
 */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="px-[clamp(1.25rem,5vw,5rem)]">
      <div className={cn('mx-auto w-full max-w-[84rem]', className)}>{children}</div>
    </div>
  )
}

/** Small meta text: Geist Mono, set in capitals with open tracking. */
export const META = 'font-mono text-[11px] uppercase leading-none tracking-[0.14em]'

/** The section heading type, matched to the ledger's own heading size. */
export const H2 = 'font-serif text-[clamp(2.4rem,4.6vw,4rem)] font-normal leading-[0.95] tracking-[-0.02em]'

/** Section padding, matched to the ledger's own. */
export const SECTION_Y = 'py-[clamp(4rem,8vw,7.5rem)]'

export function SectionHead({
  id,
  title,
  intro,
  meta,
  sticky = true,
  introClassName,
}: {
  id: string
  title: string
  intro?: ReactNode
  meta?: ReactNode
  /** Hold the heading in view while a long right column scrolls past (desktop). */
  sticky?: boolean
  introClassName?: string
}) {
  return (
    <header className={cn(sticky && 'lg:sticky lg:top-28 lg:self-start')}>
      {meta ? <p className={cn(META, 'mb-5 text-muted-foreground')}>{meta}</p> : null}
      <h2 id={id} className={H2}>
        {title}
      </h2>
      {intro ? (
        <p className={cn('mt-4 max-w-[40ch] text-base leading-relaxed text-muted-foreground', introClassName)}>{intro}</p>
      ) : null}
    </header>
  )
}
