'use client'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { MotionConfig, motion } from 'framer-motion'
import { Lock, Music, X } from 'lucide-react'
import { CopyButton } from '@/components/ui/CopyButton'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Bars, ICON, ICONS, MENU_ID, configOf, type Rect } from '@/components/ui/Nav'
import { TerminalDots } from '@/components/ui/TerminalBar'
import { LINKS } from '@/lib/constants'
import { RESUME_HREF, ROUTES, sectionHref } from '@/lib/routes'
import { NUMBERED, movementOf, type MovementId } from '@/lib/score'

/** A line's entrance: the terminal printing itself, one line after another. */
const lineIn = (delay: number) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { delay },
})
const rowIn = (i: number) => lineIn(0.15 + 0.08 * i)

const PROMPT = 'font-mono text-label mr-2'
const VERB = 'font-mono text-label text-ink-faint mr-3 w-6'
const PATH = 'font-mono text-lead tracking-tight transition-all duration-200'
const LINK_OUT = 'inline-flex min-h-11 items-center font-mono text-label text-ink-meta transition-colors active:text-white hover:text-white'

interface NavMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathname: string
  /** The section being read, on the home page; null elsewhere. */
  current: MovementId | null
  /** Where the nav bar and its burger were when the menu opened. */
  rects: { bar: Rect; burger: Rect } | null
  /** A section row was chosen: the nav closes the menu and jumps once it has gone. */
  onRow: (id: MovementId) => (e: MouseEvent<HTMLAnchorElement>) => void
  onCloseAutoFocus: (e: Event) => void
}

/**
 * The phone menu: a terminal session over the whole screen, on the dialog's
 * sheet variant (Radix: role=dialog, a focus trap, Escape, the page's scroll
 * locked). Its own module so neither Radix nor framer-motion is in any
 * route's first load: the nav fetches it when the visitor reaches for the
 * burger, or once the page is idle on a phone.
 */
export default function NavMenu({ open, onOpenChange, pathname, current, rects, onRow, onCloseAutoFocus }: NavMenuProps) {
  const onWorks = pathname === ROUTES.works
  return (
    <MotionConfig reducedMotion="user">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          id={MENU_ID}
          variant="sheet"
          hideClose
          // Radix hides the rest of the page from assistive tech (aria-hidden)
          // but doesn't say so on the dialog itself.
          aria-modal="true"
          aria-describedby={undefined}
          onCloseAutoFocus={onCloseAutoFocus}
          className="bg-black flex flex-col justify-between px-6 pt-24 pb-10 md:hidden"
        >
          <DialogTitle className="sr-only">Site menu</DialogTitle>

          {/* The bar as it looked when the menu opened, so the top of the
              screen doesn't jump; the X takes the burger's exact box. Radix
              makes everything outside the dialog inert, the burger included,
              so the menu brings its own close. */}
          {rects && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute flex items-center rounded-xl border border-white/[0.06] px-4"
              style={rects.bar}
            >
              <span className="font-display font-bold text-sm tracking-tight text-white">
                RK<span className="text-gradient">.</span>
              </span>
            </div>
          )}
          <DialogClose
            className="absolute flex items-center justify-center cursor-pointer rounded-full"
            style={rects?.burger ?? { top: 16, right: 16, width: 44, height: 44 }}
            aria-label="Close menu"
          >
            <Bars open />
          </DialogClose>

          <div>
            <motion.div className="flex items-center mb-6" aria-hidden="true" {...lineIn(0.05)}>
              <TerminalDots />
              <span className="font-mono text-label text-ink-faint ml-2">rk@portfolio ~ %</span>
            </motion.div>

            <motion.div className="font-mono text-label text-spectrum-green/60 mb-8" aria-hidden="true" {...lineIn(0.1)}>
              $ ls ./sections
            </motion.div>

            <ul className="flex flex-col gap-1">
              {NUMBERED.map(({ id, key, label, score }, i) => {
                const config = configOf(key)
                const isActive = current === id
                return (
                  <motion.li key={id} {...rowIn(i)}>
                    <a
                      href={sectionHref(id, pathname)}
                      onClick={onRow(id)}
                      aria-current={isActive ? 'location' : undefined}
                      className="relative flex w-full items-center text-left cursor-pointer group py-2.5 overflow-visible rounded-lg"
                    >
                      {isActive && (
                        <span
                          className="absolute inset-0 pointer-events-none rounded-lg"
                          style={{ background: `radial-gradient(circle at left, ${config.activeGlow} 0%, transparent 60%)` }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex items-center relative z-10">
                        <span className={`${PROMPT} text-spectrum-green/40`} aria-hidden="true">&gt;</span>
                        <span className={VERB} aria-hidden="true">cd</span>
                        <span
                          className={`mr-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-ink-faint'} ${config.iconColor}`}
                          aria-hidden="true"
                        >
                          {ICONS[id]}
                        </span>
                        {/* The path is the plain name, and a real URL: /credentials
                            redirects to /#measures. The musical name follows as a
                            comment, decoration as on the desktop's flip face. */}
                        <span className="flex flex-wrap items-baseline gap-x-3">
                          <span
                            className={`${PATH} ${isActive ? 'text-white' : 'text-ink-meta'}`}
                            style={{ textShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none' }}
                          >
                            /{label.toLowerCase()}
                          </span>
                          <span className="font-mono text-label text-ink-faint" aria-hidden="true">
                            # {score.toLowerCase()}
                          </span>
                          {isActive && (
                            <span className="font-mono text-label text-spectrum-green/50 animate-pulse motion-reduce:animate-none" aria-hidden="true">
                              ● current
                            </span>
                          )}
                        </span>
                      </span>
                    </a>
                  </motion.li>
                )
              })}
              <motion.li {...rowIn(NUMBERED.length)} className="mt-2">
                <Link
                  href={ROUTES.works}
                  onClick={() => onOpenChange(false)}
                  aria-current={onWorks ? 'page' : undefined}
                  className="flex w-full items-center text-left cursor-pointer group py-2.5"
                >
                  <span className={`${PROMPT} text-spectrum-amber/40`} aria-hidden="true">&gt;</span>
                  <span className={VERB} aria-hidden="true">ls</span>
                  <Music className={`${ICON} mr-2 text-ink-faint ${configOf(movementOf('symphony').key).iconColor}`} aria-hidden="true" />
                  <span className={`${PATH} ${onWorks ? 'text-white' : 'text-ink-meta'}`}>/works</span>
                </Link>
              </motion.li>
              {RESUME_HREF && (
                <motion.li {...rowIn(NUMBERED.length + 1)}>
                  <Link
                    href={RESUME_HREF}
                    onClick={() => onOpenChange(false)}
                    className="flex w-full items-center text-left cursor-pointer group py-2.5"
                  >
                    <span className={`${PROMPT} text-spectrum-amber/40`} aria-hidden="true">&gt;</span>
                    <span className={VERB} aria-hidden="true">su</span>
                    <Lock className={`${ICON} mr-2 text-spectrum-amber/30`} aria-hidden="true" />
                    <span className={`${PATH} text-ink-meta`}>/resume</span>
                  </Link>
                </motion.li>
              )}
              <motion.li {...rowIn(NUMBERED.length + 2)} className="mt-2">
                <DialogClose className="flex w-full items-center text-left cursor-pointer group py-2.5" aria-label="Close menu">
                  <span className={`${PROMPT} text-spectrum-red/40`} aria-hidden="true">&gt;</span>
                  <span className={VERB} aria-hidden="true">exit</span>
                  <X className={`${ICON} mr-2 text-ink-faint`} aria-hidden="true" />
                  <span className={`${PATH} text-ink-meta`}>/close</span>
                </DialogClose>
              </motion.li>
            </ul>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="h-px bg-white/5 mb-4" />
            <div className="font-mono text-label text-ink-faint mb-1" aria-hidden="true">$ echo $LINKS</div>
            <div className="flex flex-wrap items-center gap-x-5">
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className={LINK_OUT}>
                github
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={LINK_OUT}>
                linkedin
              </a>
              <a href={`mailto:${LINKS.email}`} className={LINK_OUT}>
                email
              </a>
            </div>
            <CopyButton text={LINKS.email} className="mt-3" />
          </motion.div>
        </DialogContent>
      </Dialog>
    </MotionConfig>
  )
}
