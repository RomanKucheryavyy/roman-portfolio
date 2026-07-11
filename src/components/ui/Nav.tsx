'use client'
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Music, User, Mail, Lock, AudioLines, X } from 'lucide-react'
import { NAV_ITEMS, LINKS } from '@/lib/constants'
import { useStore } from '@/stores/useStore'

interface ItemConfig {
  icon: React.ReactNode
  gradient: string
  iconColor: string
  activeGlow?: string
}

const ITEM_CONFIG: Record<string, ItemConfig> = {
  measures: {
    icon: <Award className="h-4 w-4" />,
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-blue-400',
    activeGlow: 'rgba(59,130,246,0.12)',
  },
  symphony: {
    icon: <Music className="h-4 w-4" />,
    gradient: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-purple-400',
    activeGlow: 'rgba(147,51,234,0.12)',
  },
  compositions: {
    icon: <AudioLines className="h-4 w-4" />,
    gradient: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-green-400',
    activeGlow: 'rgba(34,197,94,0.12)',
  },
  conductor: {
    icon: <User className="h-4 w-4" />,
    gradient: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-teal-400',
    activeGlow: 'rgba(20,184,166,0.12)',
  },
  compose: {
    icon: <Mail className="h-4 w-4" />,
    gradient: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-orange-400',
    activeGlow: 'rgba(249,115,22,0.12)',
  },
}

const RESUME_CONFIG: ItemConfig = {
  icon: <Lock className="h-4 w-4" />,
  gradient: 'radial-gradient(circle, rgba(161,98,7,0.15) 0%, rgba(133,77,14,0.06) 50%, transparent 100%)',
  iconColor: 'group-hover:text-amber-400',
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

function NavItem({
  label,
  config,
  isActive = false,
  onClick,
}: {
  label: string
  config: ItemConfig
  isActive?: boolean
  onClick: () => void
}) {
  // no position class here — the front face adds `relative`, the back face
  // `absolute`; sharing `relative` let it override `absolute` (Tailwind emits
  // it later) and every pill stacked its two faces vertically.
  const buttonClass = `flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 z-10 rounded-xl text-[10px] lg:text-xs font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
    isActive ? 'text-white' : 'text-white/40'
  }`
  const content = (
    <>
      <span className={`hidden lg:inline-flex items-center transition-colors duration-300 ${config.iconColor}`}>
        {config.icon}
      </span>
      {label}
    </>
  )
  return (
    <motion.div
      className="relative overflow-visible group"
      style={{ perspective: '600px' }}
      whileHover="hover"
      initial="initial"
    >
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none rounded-xl"
        variants={gradientVariants}
        style={{ background: config.gradient, opacity: 0 }}
      />
      {isActive && config.activeGlow && (
        <div
          className="absolute inset-0 z-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle, ${config.activeGlow} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
      )}
      <motion.button
        onClick={onClick}
        className={`${buttonClass} relative`}
        variants={frontVariants}
        transition={flipSpring}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom', backfaceVisibility: 'hidden' }}
      >
        {content}
      </motion.button>
      <motion.button
        onClick={onClick}
        className={`${buttonClass} absolute inset-0 z-10 justify-center`}
        variants={backVariants}
        transition={flipSpring}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'center top', backfaceVisibility: 'hidden' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {content}
      </motion.button>
    </motion.div>
  )
}

export default function Nav() {
  const isLoaded = useStore((s) => s.isLoaded)
  const activeSection = useStore((s) => s.activeSection)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const [menuOpen, setMenuOpen] = useState(false)

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
      animate={isLoaded ? { y: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.3 }}
    >
      <nav className="px-4 py-2 md:px-4 lg:px-5 md:py-2 lg:py-2.5 flex items-center justify-between rounded-2xl border border-white/[0.06] w-full bg-black/70 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.4)]">
        <a
          href="#"
          className="font-display font-bold text-sm md:text-base tracking-tight text-white cursor-pointer relative z-20"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          onMouseEnter={() => setCursorVariant('hover')}
          onMouseLeave={() => setCursorVariant('default')}
        >
          RK<span className="text-gradient">.</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {NAV_ITEMS.map((item) => {
            const id = item.href.slice(1)
            const config = ITEM_CONFIG[id]
            if (!config) return null
            return (
              <NavItem
                key={item.href}
                label={item.label}
                config={config}
                isActive={activeSection === id}
                onClick={() => scrollTo(item.href)}
              />
            )
          })}
          <NavItem label="Resume" config={RESUME_CONFIG} onClick={() => { window.location.href = '/resume' }} />
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
                {NAV_ITEMS.map((item, i) => {
                  const id = item.href.slice(1)
                  const config = ITEM_CONFIG[id]
                  const isActive = activeSection === id
                  if (!config) return null
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + 0.08 * i }}
                    >
                      <button
                        onClick={() => scrollTo(item.href)}
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
                  transition={{ delay: 0.15 + 0.08 * NAV_ITEMS.length }}
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
                  transition={{ delay: 0.15 + 0.08 * (NAV_ITEMS.length + 1) }}
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
