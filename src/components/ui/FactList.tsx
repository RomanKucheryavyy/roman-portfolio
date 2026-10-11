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
  /**
   * `rows`: term beside value from sm up, stacked on phones.
   * `grid`: a record row of cells sharing hairlines, two across on phones and
   * five from md (sized for the five-cell record row).
   */
  layout?: 'rows' | 'grid'
  /** Rows only: a rounded-xl hairline box with a rule between rows. */
  bordered?: boolean
  className?: string
}

/**
 * Label/value facts as one <dl>. Adapted from Key Value List (21st.dev 25162,
 * corr), re-skinned onto the type and ink steps: the term is a mono label in
 * ink-meta, the value text-small in ink-body. Its `truncate` on the value is
 * gone, since a fact cut off mid-word is worse than a fact on two lines.
 *
 * The grid layout takes only the shared-hairline cell trick from Stats Grid
 * (21st.dev 29195, shadcnui-blocks): each cell is pulled out by a pixel and
 * draws only its top and left border, so neighbours share one line and the
 * outer box clips the doubled edge. Every value is the caller's derived data;
 * the demo's figures and its count-up tickers never came across.
 */
export function FactList({ items, layout = 'rows', bordered = false, className }: FactListProps) {
  if (layout === 'grid') {
    return (
      <dl
        className={cn(
          'grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 md:grid-cols-5',
          className,
        )}
      >
        {items.map((item, i) => (
          <div
            key={i}
            // An odd cell left alone on the last phone row spans both columns.
            className="-m-px flex min-w-0 flex-col gap-2 border-t border-l border-white/10 p-5 odd:last:col-span-2 md:p-6 md:odd:last:col-span-1"
          >
            <dt className="font-mono text-label uppercase tracking-wider text-ink-meta">{item.term}</dt>
            <dd className="min-w-0">
              <div className="font-display text-lead font-bold text-white">{item.value}</div>
              {item.note ? <div className="mt-2 font-mono text-label text-ink-meta">{item.note}</div> : null}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

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
