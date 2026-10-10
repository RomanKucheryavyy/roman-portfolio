import type { CSSProperties, HTMLAttributes, Ref } from 'react'
import { cn } from '@/lib/utils'

/**
 * The card surface every non-work card sits on: the cert cards, the terminal
 * and music cards, the contact window. They used to pick their own border
 * (white/5 against white/10) and their own near-black. The class string is
 * exported for surfaces that can't be a Panel element (a motion.div, a
 * flip-card face).
 */
export const PANEL = 'rounded-xl border border-white/10 bg-[#0a0a0a]'

type PanelTag = 'div' | 'section' | 'article' | 'aside' | 'li' | 'figure'

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: PanelTag
  /** Any CSS colour, usually a key: `var(--color-spectrum-blue)`. Draws a 2px left edge in it. */
  accent?: string
  /** The HUD corner brackets (.hud-corners). */
  hud?: boolean
  ref?: Ref<HTMLElement>
}

export function Panel({ as = 'div', accent, hud = false, className, style, ref, ...props }: PanelProps) {
  // One element type for the checker; every PanelTag takes the same attributes.
  const Tag = as as 'div'
  const merged: CSSProperties | undefined = accent ? { ...style, borderLeftColor: accent } : style
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={cn(PANEL, hud && 'hud-corners', accent && 'border-l-2', className)}
      style={merged}
      {...props}
    />
  )
}

export default Panel
