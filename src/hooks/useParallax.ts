'use client'
import { useRef, useEffect } from 'react'
import { useStore } from '@/stores/useStore'

/**
 * Mouse parallax hook — shifts an element based on mouse position.
 * @param strength How many pixels to shift (default 10)
 */
export function useParallax(strength = 10) {
  const ref = useRef<HTMLDivElement>(null)
  const mousePos = useStore((s) => s.mousePosition)

  useEffect(() => {
    if (!ref.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    // Normalize mouse position to -1...1 range centered on viewport
    const nx = (mousePos.x / window.innerWidth - 0.5) * 2
    const ny = (mousePos.y / window.innerHeight - 0.5) * 2

    // Apply smooth shift via CSS transform (no GSAP needed — runs on RAF via React)
    ref.current.style.transform = `translate(${nx * strength}px, ${ny * strength}px)`
  }, [mousePos.x, mousePos.y, strength])

  return ref
}
