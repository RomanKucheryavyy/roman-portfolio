import { cn } from '@/lib/utils'
import { DISPLAY, INTRO, KICKER } from './look'

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
      <p className={KICKER}>
        <span className="text-[var(--stage-accent-ink)]">{act}</span>
        <span aria-hidden="true" className="mx-2">
          ·
        </span>
        {kicker}
      </p>
      <h2 id={id} className={`mt-5 ${DISPLAY}`}>
        {title}
      </h2>
      {intro ? <p className={`mt-6 ${INTRO}`}>{intro}</p> : null}
    </div>
  )
}

/** The page column, aligned with the About block's own 1280px container. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-12', className)}>{children}</div>
}
