'use client'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Award, AudioLines, Lock, Mail, Music, User } from 'lucide-react'
import { useIsHydrated } from '@/hooks/useMediaQuery'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { getLenis, scrollToTarget } from '@/lib/lenis'
import { RESUME_HREF, ROUTES, sectionHref } from '@/lib/routes'
import { NUMBERED, keyColor, movementOf, type MovementId, type SpectrumKey } from '@/lib/score'
import { useStore } from '@/stores/useStore'

/** The phone menu, fetched when it is first wanted (see NavMenu.tsx). */
const loadMenu = () => import('@/components/ui/NavMenu')
const NavMenu = dynamic(loadMenu, { ssr: false })

/** The menu dialog's id, for the burger's aria-controls. */
export const MENU_ID = 'site-menu'

const labelOf = (id: MovementId) => movementOf(id).label ?? movementOf(id).id

export const ICON = 'h-4 w-4'
export const ICONS: Record<string, ReactNode> = {
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

export interface ItemConfig {
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
export function configOf(key: SpectrumKey): ItemConfig {
  const c = keyColor(key)
  return {
    gradient: `radial-gradient(circle, color-mix(in srgb, ${c} 15%, transparent) 0%, color-mix(in srgb, ${c} 6%, transparent) 50%, transparent 100%)`,
    iconColor: HOVER_TEXT[key],
    activeGlow: `color-mix(in srgb, ${c} 12%, transparent)`,
  }
}

/*
 * The nav's motion is CSS, timed to the springs it used to run on
 * framer-motion: each linear() below is that spring (mass 1) sampled from 0
 * to 1, so the flip still overshoots by the same 3.5% and settles as fast.
 * CSS keeps framer-motion (and its 130 KB) out of every route's first load;
 * the home page loads it for its sections anyway. Under reduced motion the
 * global reset in globals.css makes every transition instant.
 */
/** stiffness 320, damping 26: the face flip. Settles in 450ms. */
const SPRING_FLIP =
  'linear(0, 0.02, 0.071, 0.139, 0.223, 0.31, 0.398, 0.488, 0.574, 0.65, 0.718, 0.782, 0.835, 0.882, 0.919, 0.952, 0.977, 0.996, 1.011, 1.021, 1.028, 1.033, 1.035, 1.035, 1.034, 1.032, 1.03, 1.027, 1.024, 1.02, 1.017, 1.014, 1.012, 1.009, 1.007, 1.005, 1.004, 1.002, 1.001, 1.001, 1)'
/** stiffness 300, damping 25: the hover glow's growth. Settles in 463ms. */
const SPRING_GLOW =
  'linear(0, 0.02, 0.069, 0.138, 0.22, 0.308, 0.397, 0.489, 0.573, 0.65, 0.72, 0.782, 0.836, 0.882, 0.922, 0.953, 0.979, 0.998, 1.013, 1.023, 1.03, 1.035, 1.037, 1.037, 1.036, 1.034, 1.031, 1.028, 1.024, 1.021, 1.018, 1.015, 1.012, 1.01, 1.007, 1.005, 1.004, 1.002, 1.001, 1.001, 1)'
/** stiffness 200, damping 30: the bar dropping in. Settles in 693ms. */
const SPRING_ENTER =
  'linear(0, 0.027, 0.089, 0.169, 0.253, 0.34, 0.422, 0.496, 0.565, 0.627, 0.679, 0.727, 0.767, 0.802, 0.832, 0.858, 0.879, 0.898, 0.914, 0.927, 0.939, 0.948, 0.956, 0.963, 0.969, 0.974, 0.978, 0.981, 0.984, 0.987, 0.989, 0.991, 0.992, 0.993, 0.994, 0.995, 0.996, 0.997, 0.997, 0.998, 1)'

const FLIP: CSSProperties = {
  transition: `transform 450ms ${SPRING_FLIP}, opacity 450ms ${SPRING_FLIP}`,
  transformStyle: 'preserve-3d',
  backfaceVisibility: 'hidden',
}
const GLOW: CSSProperties = {
  transition: `opacity 350ms cubic-bezier(0.4, 0, 0.2, 1), scale 463ms ${SPRING_GLOW}`,
}

const FACE =
  'flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl font-mono text-label uppercase tracking-wider whitespace-nowrap'

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
 * always the front label. The flip is on hover only (Tailwind's hover
 * variants apply only where the device can hover).
 *
 * The box is the front face's own size, so every item at rest has the same
 * padding, icon gap and gap to the next item. The back face is centred over
 * it at its own width: a longer musical name ("Symphony" over "Work")
 * overhangs into the padding and the gap on both sides, and stops short of
 * the neighbouring labels (chrome.spec measures both). Reserving the longer
 * name's width instead left short labels floating in wide boxes, 8px from
 * one icon and 23px from the next.
 */
function NavItem({ href, label, back, icon, trailing, config, current, route = false, onClick }: NavItemProps) {
  const active = current !== undefined
  const ink = active ? 'text-white' : 'text-ink-meta'
  const tint = (
    <span className={`hidden lg:inline-flex items-center transition-colors duration-300 ${config.iconColor}`} aria-hidden="true">
      {icon}
    </span>
  )
  const faces = (
    <>
      <span
        data-face="front"
        className={`${FACE} relative ${ink} ${back ? 'group-hover:[transform:rotateX(-90deg)] group-hover:opacity-0' : ''}`}
        style={{ ...FLIP, transformOrigin: 'center bottom' }}
      >
        {tint}
        {label}
        {trailing}
      </span>
      {back && (
        <span
          data-face="back"
          aria-hidden="true"
          className={`${FACE} ${ink} pointer-events-none absolute inset-y-0 left-1/2 w-max -translate-x-1/2 justify-center opacity-0 [transform:rotateX(90deg)] group-hover:opacity-100 group-hover:[transform:rotateX(0deg)]`}
          style={{ ...FLIP, transformOrigin: 'center top' }}
        >
          {tint}
          {back}
        </span>
      )}
    </>
  )
  const linkClass = 'relative z-10 block rounded-xl'
  return (
    <div className="relative overflow-visible group" style={{ perspective: '600px' }}>
      <span
        className="absolute inset-0 z-0 pointer-events-none rounded-xl opacity-0 scale-80 group-hover:opacity-100 group-hover:scale-140"
        style={{ ...GLOW, background: config.gradient }}
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
    </div>
  )
}

export interface Rect {
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
export function Bars({ open }: { open: boolean }) {
  const bar = 'absolute w-4 h-[1.5px] bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
  return (
    <>
      <span className={bar} style={{ transform: open ? 'rotate(45deg)' : 'translateY(-3px)' }} aria-hidden="true" />
      <span className={bar} style={{ transform: open ? 'rotate(-45deg)' : 'translateY(3px)' }} aria-hidden="true" />
    </>
  )
}

interface NavProps {
  /**
   * Sticky rather than fixed, so the bar keeps its own height in the page's
   * flow and the page starts below it. For a page laid out from its very top
   * (the résumé builder's header holds its back link and Lock), which a fixed
   * bar would cover. Every other page leaves room for a fixed bar itself.
   */
  inFlow?: boolean
}

export default function Nav({ inFlow = false }: NavProps) {
  const pathname = usePathname()
  const onHome = pathname === ROUTES.home
  const hydrated = useIsHydrated()
  const isLoaded = useStore((s) => s.isLoaded)
  // Only the home page has a boot to wait for; every other route drops the
  // bar in as soon as it hydrates.
  const shown = hydrated && (isLoaded || !onHome)
  const activeSection = useStore((s) => s.activeSection)
  const setActiveSection = useStore((s) => s.setActiveSection)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const { jumpTo, announce } = useScrollSpy({ enabled: onHome, onChange: setActiveSection, labelOf })
  const current = onHome ? (activeSection as MovementId) : null

  const [menuOpen, setMenuOpen] = useState(false)
  /** Mounted on first open and kept, so its closing fade and later opens are instant. */
  const [menuWanted, setMenuWanted] = useState(false)
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

  // The menu's close button sits exactly where the burger is (see NavMenu).
  const measure = useCallback(() => {
    const bar = rectOf(barRef.current)
    const burger = rectOf(burgerRef.current)
    if (bar && burger) setRects({ bar, burger })
  }, [])

  const openMenu = () => {
    measure()
    setMenuWanted(true)
    setMenuOpen(true)
  }

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

  // On a phone, fetch the menu's code once the page is idle, so the first tap
  // on the burger doesn't wait for it. Wider screens never show the burger.
  useEffect(() => {
    if (!shown || !window.matchMedia('(max-width: 767px)').matches) return
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = idle(() => void loadMenu())
    return () => cancel(id)
  }, [shown])

  /** A section row: close the menu, then jump once it has gone. */
  const onRow = (id: MovementId) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (!onHome || !isPlainClick(e)) return
    e.preventDefault()
    pendingJump.current = id
    setMenuOpen(false)
  }

  const onCloseAutoFocus = (e: Event) => {
    // There is no Radix trigger (the menu's code arrives later than the
    // burger), so focus is handed back here rather than by Radix.
    e.preventDefault()
    const id = pendingJump.current
    if (!id) {
      burgerRef.current?.focus() // Escape, the X or /close
      return
    }
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
    <>
      <div
        className={`${inFlow ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-[100] px-4 pt-4 md:px-4`}
        style={{
          transform: shown ? 'none' : 'translateY(-80px)',
          opacity: shown ? 1 : 0,
          transition: `transform 693ms ${SPRING_ENTER} 300ms, opacity 693ms ${SPRING_ENTER} 300ms`,
        }}
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

          {/* Desktop. The gap is wider below lg, where the items' padding is
              narrower, so the space between two labels is the same 28px at
              every width, and a musical name's overhang clears the labels
              beside it by the same margin. */}
          <div className="hidden md:flex items-center gap-3 lg:gap-1">
            {NUMBERED.map(({ id, score, key }) => (
              <NavItem
                key={id}
                href={sectionHref(id, pathname)}
                label={score}
                back={score}
                icon={ICONS[id]}
                config={configOf(key)}
                current={current === id ? 'location' : undefined}
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

          {/* Phone: the burger opens the menu sheet. */}
          <button
            ref={burgerRef}
            type="button"
            className="md:hidden relative w-11 h-11 -my-2 -mr-2 flex items-center justify-center cursor-pointer z-[102]"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? MENU_ID : undefined}
            onPointerEnter={() => void loadMenu()}
            onPointerDown={() => void loadMenu()}
            onFocus={() => void loadMenu()}
            onClick={openMenu}
          >
            <Bars open={menuOpen} />
          </button>
        </nav>
      </div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {menuWanted && (
        <NavMenu
          open={menuOpen}
          onOpenChange={setMenuOpen}
          pathname={pathname}
          current={current}
          rects={rects}
          onRow={onRow}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      )}
    </>
  )
}
