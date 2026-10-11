'use client'
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ExpandableTextProps {
  /** Lines shown while collapsed. */
  lines?: number
  /** Off: the text shows whole, with no clamp and no toggle (the wider layouts). */
  enabled?: boolean
  moreLabel?: string
  lessLabel?: string
  /** Give it the text's own type classes, so the CSS clamp (`Nlh`) counts the
   *  text's lines and not the body's. */
  className?: string
  children: ReactNode
}

/**
 * Text clamped to a few lines, with a toggle that unfolds the rest. The toggle
 * exists only when the text really overflows its lines, so a description that
 * fits gets no dead "more" button. Before the first measurement the text is
 * already clamped in CSS (`max-height: Nlh`), so nothing jumps; after it, the
 * box is sized in pixels so the height can transition, and a ResizeObserver
 * keeps that honest when the column changes width.
 *
 * From 21st.dev "Expandable Text" (balick, 34925), re-skinned: the site's
 * mono label for the toggle, ink tokens, hit slop, and an `enabled` switch so
 * the caller's own breakpoint decides when it clamps.
 */
export default function ExpandableText({
  lines = 3,
  enabled = true,
  moreLabel = 'Show more',
  lessLabel = 'Show less',
  className,
  children,
}: ExpandableTextProps) {
  const id = useId()
  const content = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [heights, setHeights] = useState<{ collapsed: number; full: number } | null>(null)

  useLayoutEffect(() => {
    const node = content.current
    if (!enabled || !node) return
    const measure = () => {
      // The text's own line, not this wrapper's (which may inherit the body's).
      const style = getComputedStyle(node.firstElementChild ?? node)
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5
      setHeights({ collapsed: Math.round(lineHeight * lines), full: node.scrollHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      observer.disconnect()
      setHeights(null)
    }
  }, [enabled, lines])

  const overflows = enabled && heights !== null && heights.full > heights.collapsed + 1
  const open = !enabled || expanded || (heights !== null && !overflows)

  return (
    <div data-expandable className={className}>
      <div
        id={id}
        className={cn(
          'overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none',
          // Collapsed, the last line fades out towards its end, the way an
          // ellipsis would trail off: the lines above it stay whole.
          !open &&
            '[mask-image:linear-gradient(black,black),linear-gradient(to_right,black_60%,transparent)] [mask-position:top,bottom] [mask-repeat:no-repeat] [mask-size:100%_calc(100%_-_1lh),100%_1lh]',
        )}
        style={
          !enabled
            ? undefined
            : heights
              ? { height: open ? heights.full : heights.collapsed }
              : { maxHeight: `${lines}lh` }
        }
      >
        <div ref={content}>{children}</div>
      </div>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          // A 24px line with 10px of slop either side: a 44px target that
          // doesn't push the tags any further down.
          className="relative mt-2 cursor-pointer py-1 font-mono text-label text-ink-meta transition-colors hover:text-white after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-['']"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  )
}
