'use client'
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Award, AudioLines, Lock, Mail, Music, User, X } from 'lucide-react'
import { LINKS } from '@/lib/constants'
import { scrollToTarget } from '@/lib/lenis'
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

  const scrollTo = useCallback((href: string) => {
    setMenuOpen(false)
    setTimeout(() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 md:px-4"
      initial={{ y: -80, opacity: 0 }}
      animate={shown ? { y: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.3 }}
      inert={!shown}
    >
      <nav className="px-4 py-2 md:px-4 lg:px-5 md:py-2 lg:py-2.5 flex items-center justify-between rounded-xl border border-white/[0.06] w-full bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)]">
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden relative w-11 h-11 -my-2 -mr-2 flex items-center justify-center cursor-pointer z-[102]"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span
            className="absolute w-4 h-[1.5px] bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: menuOpen ? 'rotate(45deg)' : 'translateY(-3px)' }}
          />
          <span
            className="absolute w-4 h-[1.5px] bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: menuOpen ? 'rotate(-45deg)' : 'translateY(3px)' }}
          />
        </button>
      </nav>
    </motion.div>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      {/* Mobile terminal menu — sibling of the animated bar so its
          fixed positioning is viewport-relative, never transform-trapped */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[99] bg-black flex flex-col justify-between px-6 pt-24 pb-10 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <motion.div
                className="flex items-center mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <span className="font-mono text-[10px] text-white/20 ml-2">rk@portfolio ~ %</span>
              </motion.div>

              <motion.div
                className="font-mono text-[11px] text-green-400/60 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                $ ls ./sections
              </motion.div>

              <div className="flex flex-col gap-1">
                {NUMBERED.map(({ id, key }, i) => {
                  const config = { ...configOf(key), icon: ICONS[id] }
                  const isActive = activeSection === id
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + 0.08 * i }}
                    >
                      <button
                        onClick={() => scrollTo(`#${id}`)}
                        className="relative w-full text-left cursor-pointer group py-2.5 overflow-visible"
                        style={{ perspective: '600px' }}
                      >
                        {isActive && config.activeGlow && (
                          <div
                            className="absolute inset-0 pointer-events-none rounded-lg"
                            style={{ background: `radial-gradient(circle at left, ${config.activeGlow} 0%, transparent 60%)` }}
                          />
                        )}
                        <div className="flex items-center relative z-10">
                          <span className="font-mono text-[11px] text-green-400/40 mr-2">&gt;</span>
                          <span className="font-mono text-[10px] text-white/20 mr-3 w-6">cd</span>
                          <span className={`mr-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/30'} ${config.iconColor}`}>
                            {config.icon}
                          </span>
                          <span
                            className="font-mono text-xl tracking-tight transition-all duration-200"
                            style={{
                              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                              textShadow: isActive ? '0 0 20px rgba(255,255,255,0.3)' : 'none',
                            }}
                          >
                            /{id}
                          </span>
                          {isActive && (
                            <span className="ml-3 font-mono text-[9px] text-green-400/50 animate-pulse">● current</span>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  )
                })}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + 0.08 * NUMBERED.length }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); window.location.href = '/resume' }}
                    className="w-full text-left cursor-pointer group py-2.5 mt-2"
                  >
                    <div className="flex items-center">
                      <span className="font-mono text-[11px] text-yellow-400/40 mr-2">&gt;</span>
                      <span className="font-mono text-[10px] text-white/20 mr-3 w-6">su</span>
                      <Lock className="h-4 w-4 mr-2 text-amber-400/30" />
                      <span className="font-mono text-xl tracking-tight text-white/30 group-active:text-white/50 transition-all duration-200">
                        /resume
                      </span>
                    </div>
                  </button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + 0.08 * (NUMBERED.length + 1) }}
                >
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left cursor-pointer group py-2.5 mt-2"
                    aria-label="Close menu"
                  >
                    <div className="flex items-center">
                      <span className="font-mono text-[11px] text-red-400/40 mr-2">&gt;</span>
                      <span className="font-mono text-[10px] text-white/20 mr-3 w-6">exit</span>
                      <X className="h-4 w-4 mr-2 text-white/30" />
                      <span className="font-mono text-xl tracking-tight text-white/40 group-active:text-white/70 transition-all duration-200">
                        /close
                      </span>
                    </div>
                  </button>
                </motion.div>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <div className="h-px bg-white/5 mb-4" />
              <div className="font-mono text-[10px] text-white/15 mb-4">$ echo $LINKS</div>
              <div className="flex items-center gap-5">
                <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-white/25 active:text-white/60 transition-colors">
                  github
                </a>
                <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-white/25 active:text-white/60 transition-colors">
                  linkedin
                </a>
                <a href={`mailto:${LINKS.email}`} className="font-mono text-[11px] text-white/25 active:text-white/60 transition-colors">
                  email
                </a>
              </div>
              <div className="font-mono text-[9px] text-white/10 mt-3">{LINKS.email}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
