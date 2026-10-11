import { cn } from '@/lib/utils'

/**
 * The one tag pill. There used to be five, differing in padding, border alpha
 * and text alpha for no reason a visitor could see.
 */
export function TagPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/15 px-2.5 py-1 font-mono text-label text-ink-meta',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A row of pills, as a list, because it is one. */
export function TagList({ tags, className }: { tags: readonly string[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <TagPill>{tag}</TagPill>
        </li>
      ))}
    </ul>
  )
}
