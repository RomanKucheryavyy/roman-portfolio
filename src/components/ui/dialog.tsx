'use client'

// shadcn's Dialog (via 21st.dev, @shadcn/dialog), re-skinned to this site.
//
// It is here to retire ProjectModal's hand-rolled overlay: a window wheel
// listener that closed the dialog on any `deltaY > 50` (on a trackpad, the
// instant you tried to read it), four manual window listeners, body-overflow
// juggling, and no role="dialog", aria-modal or focus trap. Radix supplies all
// of that. What changed from upstream: the palette is this site's, not
// shadcn's (no ring/accent tokens exist here), the tailwindcss-animate classes
// are replaced by the two keyframe pairs in globals.css, and only the parts
// the site uses are exported.
//
// The `sheet` variant is Sheet (21st.dev 35214, kevingirelli) folded into this
// file rather than added as a second dialog: a full-bleed panel for the phone
// menu. From it: the variant as a plain Record map instead of cva, and
// `hideClose` (its showCloseButton) for content that draws its own close. Its
// slide-in-from-edge animate-in classes are swapped for the dialog-fade
// keyframes already in globals.css, and its overlay is transparent: the sheet
// is opaque and covers the screen. It retires the nav's hand-rolled overlay and
// its body-overflow lock, which never stopped Lenis.
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close
const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

export type DialogVariant = 'center' | 'sheet'

/**
 * The overlay is also what locks the page's scroll (Radix mounts its
 * RemoveScroll there), so the sheet keeps one even though it is opaque and
 * covers the screen: a transparent one, with nothing to animate.
 */
const OVERLAY: Record<DialogVariant, string> = {
  center: 'dialog-overlay fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm',
  sheet: 'fixed inset-0 z-[180]',
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { variant?: DialogVariant }
>(({ className, variant = 'center', ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn(OVERLAY[variant], className)} {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const CONTENT: Record<DialogVariant, string> = {
  center: 'dialog-content fixed left-1/2 top-1/2 z-[180] -translate-x-1/2 -translate-y-1/2 outline-none',
  sheet:
    'fixed inset-0 z-[180] outline-none data-[state=open]:animate-[dialog-fade-in_0.3s_ease-out] data-[state=closed]:animate-[dialog-fade-out_0.25s_ease-in]',
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    onCloseHover?: (hovering: boolean) => void
    /** `center` (the default) is the detail view's card; `sheet` covers the screen. */
    variant?: DialogVariant
    /** Leave out the corner close button, for content that draws its own. */
    hideClose?: boolean
  }
>(({ className, children, onCloseHover, variant = 'center', hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay variant={variant} />
    <DialogPrimitive.Content
      ref={ref}
      // Lenis would otherwise swallow the wheel inside a dialog tall enough to scroll.
      data-lenis-prevent
      className={cn(CONTENT[variant], className)}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/60 p-2.5 text-ink-body backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white focus-visible:border-white focus-visible:text-white focus-visible:outline-hidden"
          onMouseEnter={() => onCloseHover?.(true)}
          onMouseLeave={() => onCloseHover?.(false)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle }
