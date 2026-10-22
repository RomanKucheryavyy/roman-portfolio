import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** One column for the top bar, the sections and the footer, so all three share a left edge. */
export const COLUMN = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

/**
 * Every stack panel on the page is drawn alike: a comfortable reading width
 * on its own, the full content column beside a side header, its small print
 * at a readable contrast, and a visible ring on the row with keyboard focus.
 */
export const PANEL =
  'w-full max-w-xl xl:max-w-none [&_section>p]:text-zinc-400! [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-inset [&_button:focus-visible]:ring-zinc-400'

/**
 * A paragraph in a stack panel row, through the row's trailing slot: given
 * the whole row (the empty label takes no room) and left-aligned.
 */
export function prose(text: string) {
  return <p className="-ml-2 w-full py-2 text-left text-sm leading-6 text-pretty text-zinc-300">{text}</p>
}

/**
 * One section of the long page: a quiet kicker, the h2 the scroll rail
 * reads (so its text is the rail's label, nothing else), an optional intro,
 * then the section's content. `aside` puts the header in a column of its
 * own beside the content on wide screens (xl), for sections whose content is
 * one compact component.
 */
export function Section({
  id,
  index,
  kicker,
  title,
  intro,
  children,
  aside = false,
  className,
}: {
  id: string
  index: number
  kicker: string
  title: string
  intro?: ReactNode
  children: ReactNode
  aside?: boolean
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn('scroll-mt-6 py-16 sm:py-20', aside && 'xl:grid xl:grid-cols-[17rem_minmax(0,1fr)] xl:gap-x-12', className)}
    >
      <header className={cn('mb-10 sm:mb-12', aside && 'xl:mb-0')}>
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-foreground/70">{String(index).padStart(2, '0')}</span>
          <span aria-hidden="true" className="mx-2 text-foreground/25">/</span>
          {kicker}
        </p>
        <h2 id={`${id}-title`} className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {intro ? <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">{intro}</p> : null}
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

/** External link with the attributes every off-site link needs. */
export function OutLink({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={className}>
      {children}
    </a>
  )
}
