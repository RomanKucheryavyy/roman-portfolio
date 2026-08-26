'use client'
import { useEffect, useMemo, useRef, type ElementType } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'

/** mulberry32 seeded by the string — random-looking, but the same every time. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ScatterTextProps {
  children: string
  className?: string
  scatterRadius?: number
  duration?: number
  stagger?: number
  triggerStart?: string
  as?: ElementType
  onAssembled?: () => void
}

/**
 * Section-heading entrance: letters fly in from random scatter positions and
 * assemble on scroll. Reduced motion shows text instantly; mobile gets gentler
 * offsets, no blur, and a faster tween.
 */
export default function ScatterText({
  children,
  className = '',
  scatterRadius = 600,
  duration = 1.2,
  stagger = 0.03,
  triggerStart = 'top 85%',
  as: Tag = 'span',
  onAssembled,
}: ScatterTextProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const assembledRef = useRef(onAssembled)

  // Keeps the callback current without writing to a ref during render.
  useEffect(() => {
    assembledRef.current = onAssembled
  }, [onAssembled])

  const chars = useMemo(() => {
    // Deterministic per string: same scatter every render, no hydration drift.
    const rand = seededRandom(children)
    return children.split('').map((char) => ({
      char,
      x: (rand() - 0.5) * scatterRadius * 2,
      y: (rand() - 0.5) * scatterRadius,
      rotation: (rand() - 0.5) * 180,
      scale: rand() * 0.5 + 0.3,
    }))
  }, [children, scatterRadius])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const spans = wrap.querySelectorAll<HTMLElement>('[data-scatter-char]')
    if (!spans.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spans.forEach((s) => { s.style.opacity = '1' })
      assembledRef.current?.()
      return
    }

    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches

    spans.forEach((s, i) => {
      const c = chars[i]
      gsap.set(s, {
        x: isMobile ? c.x * 0.3 : c.x,
        y: isMobile ? c.y * 0.3 : c.y,
        rotation: isMobile ? c.rotation * 0.5 : c.rotation,
        scale: c.scale,
        opacity: 0,
        ...(isMobile ? {} : { filter: 'blur(8px)' }),
        webkitTextFillColor: 'white',
        color: 'white',
      })
    })

    const tween = gsap.to(spans, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      ...(isMobile ? {} : { filter: 'blur(0px)' }),
      duration: isMobile ? duration * 0.6 : duration,
      ease: isMobile ? 'power3.out' : 'elastic.out(1, 0.75)',
      stagger: { each: isMobile ? stagger * 0.5 : stagger, from: 'random' },
      scrollTrigger: { trigger: wrap, start: triggerStart, once: true },
      onComplete: () => {
        spans.forEach((s) => {
          s.style.webkitTextFillColor = ''
          s.style.color = ''
          s.style.filter = ''
        })
        assembledRef.current?.()
      },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [chars, duration, stagger, triggerStart])

  return (
    <div ref={wrapRef} className={`inline-block ${className}`} style={{ overflow: 'visible' }}>
      <Tag className={className} style={{ display: 'inline' }}>
        {chars.map(({ char }, i) => (
          <span
            key={i}
            data-scatter-char
            className="inline-block will-change-transform"
            style={{ opacity: 0, whiteSpace: char === ' ' ? 'pre' : undefined }}
          >
            {char}
          </span>
        ))}
      </Tag>
    </div>
  )
}
