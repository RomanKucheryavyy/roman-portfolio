'use client'
import { ArrowUpRight, Clock, Lock, Smartphone } from 'lucide-react'
import { useRef } from 'react'
import { useStore } from '@/stores/useStore'
import { actionOf, type Work } from '@/lib/work'
import { cn } from '@/lib/utils'
import { PILL_OUTLINE } from './pill'

const SIZE = {
  sm: 'gap-1.5 px-2.5 py-1 text-label',
  md: 'gap-2 px-4 py-2 text-small',
} as const

const ICON = { sm: 12, md: 14 } as const

/**
 * The card's one action slot. A live piece gets a link out, the only thing on
 * any card that leaves the site. Anything else gets a dashed, inert pill
 * saying why there is no link: an unlaunched client site shows its status, a
 * private product says so.
 */
export default function WorkLink({
  work,
  size = 'md',
  className,
}: {
  work: Work
  size?: keyof typeof SIZE
  className?: string
}) {
  const action = actionOf(work)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  // Restore whatever the card had asked for, rather than assuming 'default'.
  const cursorBefore = useRef<ReturnType<typeof useStore.getState>['cursorVariant']>('default')
  const shape = 'shrink-0 whitespace-nowrap'

  if (action.kind === 'site' || action.kind === 'app') {
    const Icon = action.kind === 'app' ? Smartphone : ArrowUpRight
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${action.label}: ${work.title} (opens in a new tab)`}
        // The site's outline pill. On phones its hit area reaches 8px above
        // and below the visible edge (the ::after), so a thumb that lands just
        // off it still follows the link. The ::after exists only there: from
        // md up an empty static one would be one more flex item, and one more
        // gap, on the pill's right.
        className={cn(
          PILL_OUTLINE,
          shape,
          SIZE[size],
          'pointer-events-auto relative duration-300 focus-visible:outline-hidden',
          "max-md:after:absolute max-md:after:-inset-y-2 max-md:after:inset-x-0 max-md:after:content-['']",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          cursorBefore.current = useStore.getState().cursorVariant
          setCursorVariant('hover')
        }}
        onMouseLeave={() => setCursorVariant(cursorBefore.current)}
      >
        <Icon size={ICON[size]} aria-hidden="true" />
        {action.label}
      </a>
    )
  }

  const Icon = action.kind === 'pending' ? Clock : Lock
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-dashed border-white/20 font-mono text-ink-meta',
        shape,
        SIZE[size],
        className,
      )}
    >
      <Icon size={ICON[size]} aria-hidden="true" />
      {action.label}
    </span>
  )
}
