import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Fact {
  /** The label: "Now", "Stack", "Shipped". */
  term: ReactNode
  value: ReactNode
  /** A smaller line under the value: a date, a source, an as-of note. */
  note?: ReactNode
}

interface FactListProps {
  items: readonly Fact[]
  /** `rows`: term beside value from sm up, stacked on phones. */
  layout?: 'rows'
  /** Rows only: a rounded-xl hairline box with a rule between rows. */
  bordered?: boolean
  className?: string
}

/**
 * Label/value facts as one <dl>. Adapted from Key Value List (21st.dev 25162,
 * corr), re-skinned onto the type and ink steps: the term is a mono label in
 * ink-meta, the value text-small in ink-body. Its `truncate` on the value is
 * gone, since a fact cut off mid-word is worse than a fact on two lines.
 */
export function FactList({ items, bordered = false, className }: FactListProps) {
  return (
    <dl className={cn('grid', bordered && 'overflow-hidden rounded-xl border border-white/10', className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            'grid gap-1 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4',
            bordered && 'px-4 py-3',
            bordered && i > 0 && 'border-t border-white/10',
          )}
        >
          <dt className="font-mono text-label uppercase tracking-wider text-ink-meta">{item.term}</dt>
          <dd className="min-w-0 text-small text-ink-body">
            {item.value}
            {item.note ? <div className="mt-1 font-mono text-label text-ink-meta">{item.note}</div> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default FactList
