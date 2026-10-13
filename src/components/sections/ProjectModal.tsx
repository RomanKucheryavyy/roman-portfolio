'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import WorkCard from '@/components/ui/WorkCard'
import { getLenis } from '@/lib/lenis'
import { CLIENT_WORK, type Work } from '@/lib/work'

interface ProjectModalProps {
  /** Index into CLIENT_WORK, or null when closed. */
  index: number | null
  onClose: () => void
  /** Published program notes by work id (page.tsx computes it on the server). */
  notesHrefs: Readonly<Record<string, string>>
}

/**
 * The deck's detail view: the same card, large, with the whole screenshot
 * unblurred. It used to be the weakest of the six ways a project was drawn:
 * no link, no status, no colour, the screenshot blurred to wallpaper, and a
 * "Role: Design & Development" line invented for all nine pieces, the Swift
 * app included. It now shows only what the data actually holds.
 *
 * Desktop only, as before; on a phone the deck card already shows everything.
 */
export default function ProjectModal({ index, onClose, notesHrefs }: ProjectModalProps) {
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const work = index !== null ? CLIENT_WORK[index] : null
  const open = work !== null

  // Keep the last piece on screen while the dialog animates out, instead of
  // unmounting its content the frame `index` goes null.
  const [shown, setShown] = useState<{ work: Work; index: number } | null>(null)
  if (work && index !== null && shown?.work !== work) setShown({ work, index })

  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    return () => lenis?.start()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      {shown && (
        <DialogContent
          aria-describedby={undefined}
          // Radix hands focus back to its <DialogTrigger>, and there is none:
          // the deck opens this itself. Return it to the card that opened it.
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            document
              .querySelector<HTMLElement>(`[data-work="${shown.work.id}"] [data-open]`)
              ?.focus({ preventScroll: true })
          }}
          onCloseHover={(hovering) => setCursorVariant(hovering ? 'hover' : 'default')}
          className="max-h-[90svh] overflow-y-auto rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.7)]"
          // Wide enough for the screenshot, never so tall the details fall off
          // a short laptop screen.
          style={{ width: 'min(92vw, 56rem, calc((90svh - 15rem) * 1.6))' }}
        >
          <WorkCard
            work={shown.work}
            index={shown.index}
            total={CLIENT_WORK.length}
            size="lg"
            layout="stacked"
            titleAs={DialogTitle}
            notesHref={notesHrefs[shown.work.id]}
            imageSizes="(max-width: 1024px) 92vw, 896px"
            imageLoading="eager"
          />
        </DialogContent>
      )}
    </Dialog>
  )
}
