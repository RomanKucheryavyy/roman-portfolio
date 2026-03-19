'use client'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useMouseTracking } from '@/hooks/useMouseVelocity'
import { useLenis } from '@/hooks/useLenis'
import { useStore } from '@/stores/useStore'
import Loader from '@/components/ui/Loader'
import Cursor from '@/components/ui/Cursor'
import Nav from '@/components/ui/Nav'
import Hero from '@/components/sections/Hero'
import Arsenal from '@/components/sections/Arsenal'
import Projects from '@/components/sections/Projects'
import About from '@/components/sections/About'
import Contact from '@/components/sections/Contact'

// Full-page WebGL canvas — loaded client-side only
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

function AppContent() {
  useMouseTracking()
  useLenis()
  const scrollProgress = useStore((s) => s.scrollProgress)
  const progressRef = useRef<HTMLDivElement>(null)

  // Update scroll progress bar
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${scrollProgress})`
    }
  }, [scrollProgress])

  return (
    <>
      {/* Fixed full-page WebGL canvas — behind everything */}
      <Scene />

      {/* Scroll progress bar */}
      <div ref={progressRef} className="scroll-progress" />

      {/* Noise grain overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* UI layer */}
      <Loader />
      <Cursor />
      <Nav />

      {/* Scrolling DOM content — sits on top of canvas */}
      <main className="relative z-[1]">
        <Hero />
        <Arsenal />
        <Projects />
        <About />
        <Contact />
      </main>
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6">
        <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white text-center leading-tight animate-fade-in">
          ROMAN<br /><span className="text-white/50">KUCHERYAVYY</span>
        </h1>
        <div className="w-48 h-px bg-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white origin-left animate-progress" />
        </div>
        <p className="font-mono text-xs text-white/20 mt-6 tracking-wider animate-fade-in-delayed">
          {'> orchestrating logic & art'}
        </p>
      </div>
    )
  }

  return <AppContent />
}
