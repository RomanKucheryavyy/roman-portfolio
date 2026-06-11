'use client'
import { useRef, useEffect } from 'react'
import { useStore } from '@/stores/useStore'

/**
 * Mouse parallax hook — shifts an element based on mouse position.
 * Desktop pointers only; respects prefers-reduced-motion.
 * @param strength How many pixels to shift (default 10)
 */
export function useParallax(strength = 10) {
  const ref = useRef<HTMLDivElement>(null)
  const mousePos = useStore((s) => s.mousePosition)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const nx = (mousePos.x / window.innerWidth - 0.5) * 2
    const ny = (mousePos.y / window.innerHeight - 0.5) * 2
    el.style.transform = `translate(${nx * strength}px, ${ny * strength}px)`
  }, [mousePos.x, mousePos.y, strength])

  return ref
}
