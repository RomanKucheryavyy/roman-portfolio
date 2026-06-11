'use client'
import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useMouseTracking } from '@/hooks/useMouseVelocity'
import { useStore } from '@/stores/useStore'
import DynamicFavicon from '@/components/effects/DynamicFavicon'
import AmbientBackground from '@/components/effects/AmbientBackground'
import ScrollProgress from '@/components/effects/ScrollProgress'
import SectionTransition from '@/components/effects/SectionTransition'
import SectionFade from '@/components/effects/SectionFade'
import CodePeek from '@/components/effects/CodePeek'
import Loader from '@/components/ui/Loader'
import Cursor from '@/components/ui/Cursor'
import Nav from '@/components/ui/Nav'
import Hero from '@/components/sections/Hero'
import Measures from '@/components/sections/Measures'
import Projects from '@/components/sections/Projects'
import Compositions from '@/components/sections/Compositions'
import Conductor from '@/components/sections/Conductor'
import Compose from '@/components/sections/Compose'

const SECTIONS = ['hero', 'measures', 'symphony', 'compositions', 'conductor', 'compose']

function AppContent() {
  useMouseTracking()
  const setActiveSection = useStore((s) => s.setActiveSection)
  const setScrollVelocity = useStore((s) => s.setScrollVelocity)
  const setScrollProgress = useStore((s) => s.setScrollProgress)

  // Lenis smooth scroll wired into GSAP's ticker + ScrollTrigger
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    let smoothed = 0
    lenis.on('scroll', (e: { velocity: number; progress: number }) => {
      ScrollTrigger.update()
      const v = Math.min(Math.abs(e.velocity) / 2000, 1)
      smoothed += (v - smoothed) * 0.1
      setScrollVelocity(smoothed)
      setScrollProgress(e.progress)
    })
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [setScrollVelocity, setScrollProgress])

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

  return (
    <>
      <DynamicFavicon />
      <AmbientBackground />
      <ScrollProgress />
      <div className="noise-overlay" aria-hidden="true" />
      <Loader />
      <Cursor />
      <Nav />
      <CodePeek />
      <main className="relative z-[1]">
        <Hero />
        <SectionTransition commentText="// end of hero" />
        <SectionFade transition="slide-right">
          <Measures />
        </SectionFade>
        <SectionTransition commentText="/* loading arsenal */" />
        <SectionFade transition="stack-up">
          <Projects />
        </SectionFade>
        <SectionTransition commentText="// compiling projects..." />
        <SectionFade transition="fade-center">
          <Compositions />
        </SectionFade>
        <SectionTransition commentText="/* premiering original works */" />
        <SectionFade transition="fade-center">
          <Conductor />
        </SectionFade>
        <SectionTransition commentText="/* the conductor speaks */" />
        <SectionFade transition="slide-up">
          <Compose />
        </SectionFade>
      </main>
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
        <div className="w-48 h-px bg-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white origin-left animate-progress" />
        </div>
        <p className="font-mono text-[10px] text-white/20 mt-4 tracking-wider">{'> initializing...'}</p>
      </div>
    )
  }

  return <AppContent />
}
