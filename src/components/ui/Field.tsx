'use client'
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * One text field. Adapted from Interfaces Textarea (21st.dev 11882, jshguo)
 * plus the matching Input it implies: `field-sizing-content`, so a textarea
 * grows with what is in it instead of hiding it behind a fixed `rows`; the
 * type step drops to text-small only from md up, because iOS zooms into any
 * field under 16px; and `aria-invalid` paints the edge. The skin is this
 * site's (white/5 on black, a white/10 edge that brightens to white/60 on
 * focus, rounded-lg) instead of shadcn's input/ring/destructive tokens and
 * dark-mode variants, none of which exist here.
 *
 * `Field` wraps one control with a real <label>: it mints an id with useId
 * and hands it to the Input or Textarea inside through context, so a field
 * can never ship without an accessible name again.
 */
const CONTROL =
  'w-full rounded-lg border border-white/10 bg-white/5 p-3 font-body text-body text-white outline-none transition-colors placeholder:text-ink-faint focus-visible:border-white/60 aria-invalid:border-spectrum-red disabled:cursor-not-allowed disabled:opacity-50 md:text-small'

/** The label's look, which the builder's group headings share. */
export const FIELD_LABEL = 'mb-2 block font-mono text-label uppercase tracking-wider text-ink-meta'

const FieldId = createContext<string | undefined>(undefined)

interface FieldProps {
  label: ReactNode
  /** Keeps the label for assistive tech only, where a visible heading already says it. */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, hideLabel = false, className, children }: FieldProps) {
  const id = useId()
  return (
    <FieldId.Provider value={id}>
      <div className={className}>
        <label htmlFor={id} className={hideLabel ? 'sr-only' : FIELD_LABEL}>
          {label}
        </label>
        {children}
      </div>
    </FieldId.Provider>
  )
}

export function Input({ className, id, ...props }: ComponentProps<'input'>) {
  const fieldId = useContext(FieldId)
  return <input data-slot="input" id={id ?? fieldId} className={cn(CONTROL, className)} {...props} />
}

export function Textarea({ className, id, ...props }: ComponentProps<'textarea'>) {
  const fieldId = useContext(FieldId)
  return (
    <textarea
      data-slot="textarea"
      id={id ?? fieldId}
      // resize-none: field-sizing already grows it. Where the browser lacks
      // field-sizing, `rows` sets the height and the box scrolls, as before.
      className={cn(CONTROL, 'field-sizing-content min-h-16 resize-none', className)}
      {...props}
    />
  )
}

export default Field
