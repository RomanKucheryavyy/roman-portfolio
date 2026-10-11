import type { ReactNode } from 'react'

/**
 * One titled block of a long-form page (program notes, liner notes): the
 * heading on the left from md up, the content beside it, a hairline above.
 * `mark` is a rehearsal letter, boxed as in a score.
 */
export function PageBlock({
  id,
  heading,
  mark,
  children,
}: {
  /** Labels the section; the heading gets it as its id. */
  id: string
  heading: ReactNode
  mark?: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-white/10 py-8 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-8"
    >
      <h2 id={id} className="flex items-center gap-3 self-start font-display text-2xl font-bold text-white">
        {mark ? (
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/25 font-mono text-small font-bold text-white"
          >
            {mark}
          </span>
        ) : null}
        {heading}
      </h2>
      <div className="min-w-0 max-w-2xl">{children}</div>
    </section>
  )
}
