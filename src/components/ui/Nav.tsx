'use client'
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Award, AudioLines, Lock, Mail, Music, User, X } from 'lucide-react'
import { CopyButton } from '@/components/ui/CopyButton'
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TerminalDots } from '@/components/ui/TerminalBar'
import { LINKS } from '@/lib/constants'
import { getLenis, scrollToTarget } from '@/lib/lenis'
import { RESUME_HREF, ROUTES, sectionHref } from '@/lib/routes'
import { NUMBERED, keyColor, movementOf, type MovementId, type SpectrumKey } from '@/lib/score'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { useStore } from '@/stores/useStore'

const labelOf = (id: MovementId) => movementOf(id).label ?? movementOf(id).id

const ICON = 'h-4 w-4'
const ICONS: Record<string, ReactNode> = {
  measures: <Award className={ICON} />,
  symphony: <Music className={ICON} />,
  compositions: <AudioLines className={ICON} />,
  conductor: <User className={ICON} />,
  compose: <Mail className={ICON} />,
}

/** Literal, so Tailwind sees every class: a key's hover tint for an icon. */
const HOVER_TEXT: Record<SpectrumKey, string> = {
  red: 'group-hover:text-spectrum-red',
  orange: 'group-hover:text-spectrum-orange',
  amber: 'group-hover:text-spectrum-amber',
  green: 'group-hover:text-spectrum-green',
  teal: 'group-hover:text-spectrum-teal',
  blue: 'group-hover:text-spectrum-blue',
  purple: 'group-hover:text-spectrum-purple',
}

interface ItemConfig {
  gradient: string
  iconColor: string
  activeGlow: string
}

/**
 * An item's hues, from its movement's key. They used to be five hand-picked
 * Tailwind colours (blue, purple, green, teal, orange) that matched nothing
 * else on the page; now the Credentials item glows the orange its heading is
 * drawn in.
 */
function configOf(key: SpectrumKey): ItemConfig {
  const c = keyColor(key)
  return {
    gradient: `radial-gradient(circle, color-mix(in srgb, ${c} 15%, transparent) 0%, color-mix(in srgb, ${c} 6%, transparent) 50%, transparent 100%)`,
    iconColor: HOVER_TEXT[key],
    activeGlow: `color-mix(in srgb, ${c} 12%, transparent)`,
  }
}

const frontVariants = { initial: { rotateX: 0, opacity: 1 }, hover: { rotateX: -90, opacity: 0 } }
const backVariants = { initial: { rotateX: 90, opacity: 0 }, hover: { rotateX: 0, opacity: 1 } }
const gradientVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 1.4, // stay inside the pill's footprint — 2x bled into neighbors
    transition: {
      opacity: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
      scale: { duration: 0.35, type: 'spring' as const, stiffness: 300, damping: 25 },
    },
  },
}
const flipSpring = { type: 'spring', stiffness: 320, damping: 26 } as const

const FACE =
  'flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl font-mono text-label uppercase tracking-wider whitespace-nowrap transition-colors'

/** An unmodified primary click (or Enter): the kind a page may take over. */
const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

interface NavItemProps {
  href: string
  label: string
  /** The musical name, on the face that flips in on hover. Route items have none. */
  back?: string
  icon: ReactNode
  /** After the label: the arrow on a route item. */
  trailing?: ReactNode
  config: ItemConfig
  current?: 'location' | 'page'
  /** A next/link to another route, rather than a plain link to a section. */
  route?: boolean
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

/**
 * One nav link. The link itself is the outer box and both faces sit inside
 * it, so a click lands on the link whichever face is showing: the faces used
 * to be two buttons, and mid-flip the pointer could fall between them. The
 * back face is decoration (aria-hidden, no pointer events); the link's name is
 * always the front label. The front reserves the back face's width, so a
 * longer musical name never spills onto its neighbours.
 */
function NavItem({ href, label, back, icon, trailing, config, current, route = false, onClick }: NavItemProps) {
  const active = current !== undefined
  const tint = (
    <span className={`hidden lg:inline-flex items-center transition-colors duration-300 ${config.iconColor}`} aria-hidden="true">
      {icon}
    </span>
  )
  const ink = active ? 'text-white' : 'text-ink-meta'
  const faces = (
    <>
      <motion.span
        className={`${FACE} relative ${ink}`}
        variants={back ? frontVariants : undefined}
        transition={flipSpring}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom', backfaceVisibility: 'hidden' }}
      >
        {tint}
        <span className="inline-grid justify-items-center">
          <span className="col-start-1 row-start-1">{label}</span>
          {back && (
            <span className="invisible col-start-1 row-start-1" aria-hidden="true">
              {back}
            </span>
          )}
        </span>
        {trailing}
      </motion.span>
      {back && (
        <motion.span
          data-face="back"
          aria-hidden="true"
          className={`${FACE} pointer-events-none absolute inset-0 justify-center ${ink}`}
          variants={backVariants}
          transition={flipSpring}
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'center top', backfaceVisibility: 'hidden' }}
        >
          {tint}
          {back}
        </motion.span>
      )}
    </>
  )
  const linkClass = 'relative z-10 block rounded-xl'
  return (
    <motion.div
      className="relative overflow-visible group"
      style={{ perspective: '600px' }}
      whileHover="hover"
      initial="initial"
    >
      <motion.span
        className="absolute inset-0 z-0 pointer-events-none rounded-xl"
        variants={gradientVariants}
        style={{ background: config.gradient, opacity: 0 }}
        aria-hidden="true"
      />
      {active && (
        <span
          className="absolute inset-0 z-0 pointer-events-none rounded-xl"
          style={{ background: `radial-gradient(circle, ${config.activeGlow} 0%, transparent 70%)`, transform: 'scale(1.5)' }}
          aria-hidden="true"
        />
      )}
      {route ? (
        <Link href={href} className={linkClass} aria-current={current} onClick={onClick}>
          {faces}
        </Link>
      ) : (
        <a href={href} className={linkClass} aria-current={current} onClick={onClick}>
          {faces}
        </a>
      )}
    </motion.div>
  )
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}
const rectOf = (el: Element | null): Rect | null => {
  if (!el) return null
  const { left, top, width, height } = el.getBoundingClientRect()
  return { left, top, width, height }
}

/** The burger's two bars, or the X they turn into. */
function Bars({ open }: { open: boolean }) {
  const bar = 'absolute w-4 h-[1.5px] bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
  return (
    <>
      <span className={bar} style={{ transform: open ? 'rotate(45deg)' : 'translateY(-3px)' }} aria-hidden="true" />
      <span className={bar} style={{ transform: open ? 'rotate(-45deg)' : 'translateY(3px)' }} aria-hidden="true" />
    </>
  )
}

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

export default function Nav() {
  const pathname = usePathname()
  const onHome = pathname === ROUTES.home
  const isLoaded = useStore((s) => s.isLoaded)
  // Only the home page has a boot to wait for; every other route shows the
  // nav at once.
  const shown = isLoaded || !onHome
  const activeSection = useStore((s) => s.activeSection)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const { jumpTo, announce } = useScrollSpy({ enabled: onHome, onChange: setActiveSection, labelOf })

  const [menuOpen, setMenuOpen] = useState(false)
  const barRef = useRef<HTMLElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const [rects, setRects] = useState<{ bar: Rect; burger: Rect } | null>(null)
  /** A row picked in the phone menu: jumped to once the menu has closed. */
  const pendingJump = useRef<MovementId | null>(null)

  /** On the home page a section link scrolls (through Lenis) instead of reloading. */
  const jump = useCallback(
    (id: MovementId) => (e: MouseEvent<HTMLAnchorElement>) => {
      if (!onHome || !isPlainClick(e)) return
      e.preventDefault()
      jumpTo(id)
      window.history.replaceState(null, '', `#${id}`)
    },
    [onHome, jumpTo],
  )

  // The menu's close button sits exactly where the burger is, drawn as the X
  // the burger would have turned into: Radix makes everything outside the
  // dialog inert, the burger included, so the menu brings its own.
  const measure = useCallback(() => {
    const bar = rectOf(barRef.current)
    const burger = rectOf(burgerRef.current)
    if (bar && burger) setRects({ bar, burger })
  }, [])

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) measure()
      setMenuOpen(open)
    },
    [measure],
  )

  // Lenis drives the scroll from its own wheel listener, so the page would
  // keep moving behind the menu unless Lenis itself stops.
  useEffect(() => {
    if (!menuOpen) return
    const lenis = getLenis()
    lenis?.stop()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      lenis?.start()
    }
  }, [menuOpen, measure])

  // The menu is phone-only; widening the window past md closes it.
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mql.matches) setMenuOpen(false)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  /** A section row: close the menu, then jump once it has gone. */
  const row = (id: MovementId) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onHome || !isPlainClick(e)) return
    e.preventDefault()
    pendingJump.current = id
    setMenuOpen(false)
  }

  const onCloseAutoFocus = (e: Event) => {
    const id = pendingJump.current
    if (!id) return // Escape, the X or /close: focus goes back to the burger.
    e.preventDefault()
    pendingJump.current = null
    // Two frames: Lenis has restarted and the page is scrollable again.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        jumpTo(id)
        window.history.replaceState(null, '', `#${id}`)
      }),
    )
  }

  return (
    <Dialog open={menuOpen} onOpenChange={onOpenChange}>
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 md:px-4"
        initial={{ y: -80, opacity: 0 }}
        animate={shown ? { y: 0, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.3 }}
        inert={!shown}
      >
        <nav
          ref={barRef}
          className="px-4 py-2 md:px-4 lg:px-5 md:py-2 lg:py-2.5 flex items-center justify-between rounded-xl border border-white/[0.06] w-full bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <Link
            href={ROUTES.home}
            className="font-display font-bold text-sm md:text-base tracking-tight text-white cursor-pointer relative z-20"
            onClick={(e) => {
              if (!onHome || !isPlainClick(e)) return
              e.preventDefault()
              scrollToTarget(0)
              window.history.replaceState(null, '', ROUTES.home)
            }}
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            RK<span className="text-gradient">.</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
            {NUMBERED.map(({ id, score, key }) => (
              <NavItem
                key={id}
                href={sectionHref(id, pathname)}
                label={score}
                back={score}
                icon={ICONS[id]}
                config={configOf(key)}
                current={onHome && activeSection === id ? 'location' : undefined}
                onClick={jump(id)}
              />
            ))}
            <NavItem
              href={ROUTES.works}
              label="All work"
              icon={<Music className={ICON} />}
              trailing={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
              config={configOf(movementOf('symphony').key)}
              current={pathname === ROUTES.works ? 'page' : undefined}
              route
            />
            {RESUME_HREF && (
              <NavItem
                href={RESUME_HREF}
                label="Résumé"
                icon={<Lock className={ICON} />}
                config={configOf(movementOf('conductor').key)}
                current={pathname === RESUME_HREF ? 'page' : undefined}
                route
              />
            )}
          </div>

          {/* Phone: the burger opens the menu sheet (Radix sets aria-expanded,
              aria-controls and aria-haspopup, and returns focus here). */}
          <DialogTrigger asChild>
            <button
              ref={burgerRef}
              type="button"
              className="md:hidden relative w-11 h-11 -my-2 -mr-2 flex items-center justify-center cursor-pointer z-[102]"
              aria-label="Open menu"
            >
              <Bars open={menuOpen} />
            </button>
          </DialogTrigger>
        </nav>
      </motion.div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* The phone menu: a terminal session over the whole screen. */}
      <DialogContent
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

        {/* The bar as it looked when the menu opened, so the top of the screen
            doesn't jump; the X takes the burger's exact box. */}
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
            {NUMBERED.map(({ id, key }, i) => {
              const config = configOf(key)
              const isActive = onHome && activeSection === id
              return (
                <motion.li key={id} {...rowIn(i)}>
                  <a
                    href={sectionHref(id, pathname)}
                    onClick={row(id)}
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
                      <span
                        className={`${PATH} ${isActive ? 'text-white' : 'text-ink-meta'}`}
                        style={{ textShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none' }}
                      >
                        /{id}
                      </span>
                      {isActive && (
                        <span className="ml-3 font-mono text-label text-spectrum-green/50 animate-pulse motion-reduce:animate-none" aria-hidden="true">
                          ● current
                        </span>
                      )}
                    </span>
                  </a>
                </motion.li>
              )
            })}
            <motion.li {...rowIn(NUMBERED.length)} className="mt-2">
              <Link
                href={ROUTES.works}
                onClick={() => setMenuOpen(false)}
                aria-current={pathname === ROUTES.works ? 'page' : undefined}
                className="flex w-full items-center text-left cursor-pointer group py-2.5"
              >
                <span className={`${PROMPT} text-spectrum-amber/40`} aria-hidden="true">&gt;</span>
                <span className={VERB} aria-hidden="true">ls</span>
                <Music className={`h-4 w-4 mr-2 text-ink-faint ${configOf(movementOf('symphony').key).iconColor}`} aria-hidden="true" />
                <span className={`${PATH} ${pathname === ROUTES.works ? 'text-white' : 'text-ink-meta'}`}>/works</span>
              </Link>
            </motion.li>
            {RESUME_HREF && (
              <motion.li {...rowIn(NUMBERED.length + 1)}>
                <Link
                  href={RESUME_HREF}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center text-left cursor-pointer group py-2.5"
                >
                  <span className={`${PROMPT} text-spectrum-amber/40`} aria-hidden="true">&gt;</span>
                  <span className={VERB} aria-hidden="true">su</span>
                  <Lock className="h-4 w-4 mr-2 text-spectrum-amber/30" aria-hidden="true" />
                  <span className={`${PATH} text-ink-meta`}>/resume</span>
                </Link>
              </motion.li>
            )}
            <motion.li {...rowIn(NUMBERED.length + 2)} className="mt-2">
              <DialogClose className="flex w-full items-center text-left cursor-pointer group py-2.5" aria-label="Close menu">
                <span className={`${PROMPT} text-spectrum-red/40`} aria-hidden="true">&gt;</span>
                <span className={VERB} aria-hidden="true">exit</span>
                <X className="h-4 w-4 mr-2 text-ink-faint" aria-hidden="true" />
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
  )
}
