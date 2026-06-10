'use client'
import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { useStore } from '@/stores/useStore'

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null)
  const setScrollVelocity = useStore((s) => s.setScrollVelocity)
  const setScrollProgress = useStore((s) => s.setScrollProgress)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })
    lenisRef.current = lenis

    // Critical: sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => { lenis.raf(time * 1000) })
    gsap.ticker.lagSmoothing(0)

    // Feed scroll data to Zustand store
    let smoothVel = 0
    lenis.on('scroll', (e: { velocity: number; progress: number }) => {
      const rawVel = Math.min(Math.abs(e.velocity) / 2000, 1)
      smoothVel += (rawVel - smoothVel) * 0.1
      setScrollVelocity(smoothVel)
      setScrollProgress(e.progress)
    })

    return () => { lenis.destroy() }
  }, [setScrollVelocity, setScrollProgress])

  return lenisRef
}
