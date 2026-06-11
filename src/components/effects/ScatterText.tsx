'use client'
import { useEffect, useMemo, useRef, type ElementType } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'

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
  assembledRef.current = onAssembled

  const chars = useMemo(
    () =>
      children.split('').map((char) => ({
        char,
        x: (Math.random() - 0.5) * scatterRadius * 2,
        y: (Math.random() - 0.5) * scatterRadius,
        rotation: (Math.random() - 0.5) * 180,
        scale: Math.random() * 0.5 + 0.3,
      })),
    [children, scatterRadius]
  )

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
