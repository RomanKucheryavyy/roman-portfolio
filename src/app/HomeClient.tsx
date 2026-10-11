'use client'
import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useMouseTracking } from '@/hooks/useMouseVelocity'
import { useIsHydrated } from '@/hooks/useMediaQuery'
import { useStore } from '@/stores/useStore'
import { setLenis } from '@/lib/lenis'
import DynamicFavicon from '@/components/effects/DynamicFavicon'
import AmbientBackground from '@/components/effects/AmbientBackground'
import ScrollProgress from '@/components/effects/ScrollProgress'
import SectionTransition from '@/components/effects/SectionTransition'
import CodePeek from '@/components/effects/CodePeek'
import ConsoleSignature from '@/components/effects/ConsoleSignature'
import Loader from '@/components/ui/Loader'
import Hero from '@/components/sections/Hero'
import Measures from '@/components/sections/Measures'
import Projects from '@/components/sections/Projects'
import Compositions from '@/components/sections/Compositions'
import Manifesto from '@/components/sections/Manifesto'
import Conductor from '@/components/sections/Conductor'
import Compose from '@/components/sections/Compose'

const SECTIONS = ['hero', 'measures', 'symphony', 'compositions', 'interlude', 'conductor', 'compose']

function AppContent() {
  useMouseTracking()
  const setActiveSection = useStore((s) => s.setActiveSection)
  const isLoaded = useStore((s) => s.isLoaded)

  // Lenis smooth scroll wired into GSAP's ticker + ScrollTrigger. Not under
  // reduced motion: Lenis eases every wheel notch and every jump, which is the
  // motion that preference asks to remove, and ScrollTrigger listens to the
  // native scroll by itself.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    setLenis(lenis)
    lenis.on('scroll', () => ScrollTrigger.update())
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      setLenis(null)
      lenis.destroy()
    }
  }, [])

  // Active-section tracking
  useEffect(() => {
    const observers = SECTIONS.map((id) => {
      const el = document.getElementById(id)
      if (!el) return null
      const io = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.15, rootMargin: '-5% 0px -5% 0px' }
      )
      io.observe(el)
      return io
    })
    return () => observers.forEach((io) => io?.disconnect())
  }, [setActiveSection])

  // The nav, the cursor and the grain are the layout's (SiteChrome), on every route.
  return (
    <MotionConfig reducedMotion="user">
      <ConsoleSignature />
      <DynamicFavicon />
      <AmbientBackground />
      <ScrollProgress />
      <Loader />
      <CodePeek />
      {/* The skip link's target. Inert during the boot, so a keyboard can't
          walk through a page the Loader is still covering. */}
      <main id="main" tabIndex={-1} inert={!isLoaded} className="relative z-[1] outline-none">
        <Hero />
        <SectionTransition movement="measures" />
        <Measures />
        <SectionTransition movement="symphony" />
        <Projects />
        <SectionTransition movement="compositions" />
        <Compositions />
        <SectionTransition movement="interlude" />
        <Manifesto />
        <SectionTransition movement="conductor" />
        <Conductor />
        <SectionTransition movement="compose" />
        <Compose />
      </main>
    </MotionConfig>
  )
}

export default function HomeClient() {
  const mounted = useIsHydrated()

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center" aria-hidden="true">
        <div className="w-48 h-px bg-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white origin-left animate-progress" />
        </div>
        <p className="font-mono text-label text-ink-faint mt-4 tracking-wider">{'> initializing...'}</p>
      </div>
    )
  }

  return <AppContent />
}
