import { cn } from '@/lib/utils'

/** The one section header: a small act line, an h2, an optional intro. */
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
  return (
    <div className={cn('max-w-3xl', className)}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-[var(--stage-accent-ink)]">{act}</span>
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        {kicker}
      </p>
      <h2 id={id} className="mt-5 text-[2.5rem] font-bold leading-[0.95] tracking-[-0.045em] text-balance md:text-7xl">
        {title}
      </h2>
      {intro ? <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{intro}</p> : null}
    </div>
  )
}

/** The page column, aligned with the About block's own 1280px container. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-12', className)}>{children}</div>
}
