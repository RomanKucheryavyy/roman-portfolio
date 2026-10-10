'use client'
import { ArrowUpRight, Clock, Lock, Smartphone } from 'lucide-react'
import { useRef } from 'react'
import { useStore } from '@/stores/useStore'
import { actionOf, type Work } from '@/lib/work'
import { cn } from '@/lib/utils'

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
  const base = cn(
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-mono',
    SIZE[size],
    className,
  )

  if (action.kind === 'site' || action.kind === 'app') {
    const Icon = action.kind === 'app' ? Smartphone : ArrowUpRight
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${action.label}: ${work.title} (opens in a new tab)`}
        className={cn(
          base,
          'pointer-events-auto border-white/25 text-white transition-colors duration-300 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black focus-visible:outline-none',
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
    <span className={cn(base, 'border-dashed border-white/20 text-white/50')}>
      <Icon size={ICON[size]} aria-hidden="true" />
      {action.label}
    </span>
  )
}
