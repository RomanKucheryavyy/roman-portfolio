'use client'
import { useEffect, type RefObject } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'

/** The values, in one place. Change them here and every section follows. */
export const REVEAL = { y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.08, start: 'top 82%' } as const

/**
 * The site's one scroll reveal: everything marked `data-reveal` inside `ref`
 * lifts 24px into place, once, as it arrives. Elements that arrive together
 * (a row of cards) are staggered as a group.
 *
 * It replaces five mechanisms that each owned a piece of this job, with seven
 * durations, five easings and entry points from 'top 65%' to 'top 88%': a
 * mobile-only fade on every section, a mobile-only lift on every card, a
 * clip-path wipe on the grids, a per-card GSAP slide, and six copies of a
 * per-section GSAP effect. On phones three of them fired on the same element,
 * so a card faded, then lifted, then faded again on three different curves.
 *
 * Reduced motion shows everything in place, with no tween at all.
 */
export function useRevealOnScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!els.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(els, { opacity: 1, y: 0 })
      return
    }

    gsap.set(els, { opacity: 0, y: REVEAL.y })
    const triggers = ScrollTrigger.batch(els, {
      start: REVEAL.start,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: REVEAL.duration,
          ease: REVEAL.ease,
          stagger: REVEAL.stagger,
          overwrite: true,
        }),
    })

    return () => {
      triggers.forEach((t) => t.kill())
      gsap.killTweensOf(els)
    }
  }, [ref])
}
