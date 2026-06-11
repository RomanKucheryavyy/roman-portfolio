'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'

/** Code-comment interludes between sections, with a faint rainbow hairline. */
export default function SectionTransition({ commentText }: { commentText: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const text = textRef.current
    if (!wrap || !text) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        text,
        { y: 20 },
        {
          y: -20,
          ease: 'none',
          scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        }
      )
    }, wrap)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: '60px' }}
      aria-hidden="true"
    >
      <span
        ref={textRef}
        className="absolute font-mono text-[11px] tracking-wider"
        style={{ opacity: 0.1, color: '#ffffff' }}
      >
        {commentText}
      </span>
      <div
        className="absolute w-full"
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, #ff0040, #ff8c00, #ffef00, #00cc69, #00aaff, #8855ff, transparent)',
          opacity: 0.2,
        }}
      />
    </div>
  )
}
