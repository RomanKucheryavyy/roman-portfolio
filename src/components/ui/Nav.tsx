'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { NAV_ITEMS } from '@/lib/constants'
import { useStore } from '@/stores/useStore'

export default function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const isLoaded = useStore((s) => s.isLoaded)
  const activeSection = useStore((s) => s.activeSection)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  useEffect(() => {
    if (!isLoaded || !navRef.current) return
    const nav = navRef.current
    const items = nav.querySelectorAll('[data-nav-item]')

    // Nav slides in from top
    gsap.fromTo(nav, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', delay: 0.3 })
    // Items slide from right with stagger
    gsap.fromTo(items,
      { x: 40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.08, delay: 0.5 }
    )
  }, [isLoaded])

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-4 flex items-center justify-between opacity-0"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.4)' }}
    >
      {/* Logo */}
      <a
        href="#"
        className="font-display font-bold text-lg tracking-tight text-white cursor-pointer"
        onMouseEnter={() => setCursorVariant('hover')}
        onMouseLeave={() => setCursorVariant('default')}
      >
        RK<span className="text-gradient">.</span>
      </a>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            data-nav-item
            className="relative font-mono text-xs tracking-wider uppercase cursor-pointer transition-colors duration-300"
            style={{ color: activeSection === item.href.slice(1) ? '#fff' : 'rgba(255,255,255,0.35)' }}
            onMouseEnter={() => setCursorVariant('hover')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            {item.label}
            {/* Active dot indicator */}
            {activeSection === item.href.slice(1) && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
            )}
          </a>
        ))}
      </div>

      {/* Mobile menu button */}
      <button className="md:hidden p-2 cursor-pointer" aria-label="Menu">
        <div className="w-5 h-px bg-white mb-1.5" />
        <div className="w-5 h-px bg-white" />
      </button>
    </nav>
  )
}
