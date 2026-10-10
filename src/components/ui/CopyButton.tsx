'use client'
import { Check, Copy, X } from 'lucide-react'
import { PILL_OUTLINE } from '@/components/ui/pill'
import { useCopyToClipboard, type CopyState } from '@/hooks/useCopyToClipboard'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  /** What lands on the clipboard. */
  text: string
  label?: string
  copiedLabel?: string
  errorLabel?: string
  className?: string
}

const ICONS = { idle: Copy, copied: Check, error: X } as const

/**
 * A copy-to-clipboard pill. Adapted from Copy Button (21st.dev 23529,
 * ddoemonn): the same three states, every icon and every label stacked in one
 * grid cell so the pill never changes width, and an sr-only status line. The
 * skin is PILL_OUTLINE with lucide icons instead of its stone palette, inset
 * shadows and dark-mode variants, and the faces swap without its spring
 * crossfade.
 *
 * The button's name stays `label` whatever the state; the status line beside
 * it says "Copied" or "Copy failed" to a screen reader.
 */
export function CopyButton({
  text,
  label = 'Copy email',
  copiedLabel = 'Copied',
  errorLabel = 'Copy failed',
  className,
}: CopyButtonProps) {
  const { copy, state } = useCopyToClipboard()
  const labels: Record<CopyState, string> = { idle: label, copied: copiedLabel, error: errorLabel }
  const states = Object.keys(labels) as CopyState[]

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          void copy(text)
        }}
        className={cn(PILL_OUTLINE, 'cursor-pointer select-none [touch-action:manipulation]', className)}
      >
        <span className="inline-grid" aria-hidden="true">
          {states.map((s) => {
            const Icon = ICONS[s]
            return <Icon key={s} size={14} className={cn('col-start-1 row-start-1', s !== state && 'invisible')} />
          })}
        </span>
        <span className="inline-grid" aria-hidden="true">
          {states.map((s) => (
            <span key={s} className={cn('col-start-1 row-start-1 whitespace-nowrap', s !== state && 'invisible')}>
              {labels[s]}
            </span>
          ))}
        </span>
      </button>
      {/* Outside the button: a button's children are presentational, so a
          live region inside it may never be exposed. */}
      <span role="status" className="sr-only">
        {state === 'copied' ? copiedLabel : state === 'error' ? errorLabel : ''}
      </span>
    </>
  )
}

export default CopyButton
