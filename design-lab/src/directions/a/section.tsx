import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * One section of the long page: a quiet kicker, the h2 the scroll rail
 * reads (so its text is the rail's label, nothing else), an optional intro,
 * then the section's content.
 */
export function Section({
  id,
  index,
  kicker,
  title,
  intro,
  children,
  className,
}: {
  id: string
  index: number
  kicker: string
  title: string
  intro?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-6 py-20 sm:py-28', className)}>
      <header className="mb-10 sm:mb-12">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-foreground/70">{String(index).padStart(2, '0')}</span>
          <span aria-hidden="true" className="mx-2 text-foreground/25">/</span>
          {kicker}
        </p>
        <h2 id={`${id}-title`} className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {intro ? <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">{intro}</p> : null}
      </header>
      {children}
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
