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
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close
const DialogTitle = DialogPrimitive.Title
const DialogDescription = DialogPrimitive.Description

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('dialog-overlay fixed inset-0 z-[180] bg-black/80 backdrop-blur-sm', className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    onCloseHover?: (hovering: boolean) => void
  }
>(({ className, children, onCloseHover, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      // Lenis would otherwise swallow the wheel inside a dialog tall enough to scroll.
      data-lenis-prevent
      className={cn(
        'dialog-content fixed left-1/2 top-1/2 z-[180] -translate-x-1/2 -translate-y-1/2 outline-none',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/60 p-2.5 text-white/70 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-white focus-visible:border-white focus-visible:text-white focus-visible:outline-none"
        onMouseEnter={() => onCloseHover?.(true)}
        onMouseLeave={() => onCloseHover?.(false)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle }
