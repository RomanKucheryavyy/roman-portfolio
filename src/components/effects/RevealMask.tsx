'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'

const CLIPS: Record<string, { from: string; to: string }> = {
  left: { from: 'inset(0 100% 0 0)', to: 'inset(0 0% 0 0)' },
  right: { from: 'inset(0 0 0 100%)', to: 'inset(0 0 0 0%)' },
  top: { from: 'inset(0 0 100% 0)', to: 'inset(0 0 0% 0)' },
  bottom: { from: 'inset(100% 0 0 0)', to: 'inset(0% 0 0 0)' },
  center: { from: 'inset(50% 50% 50% 50%)', to: 'inset(0% 0% 0% 0%)' },
}

interface RevealMaskProps {
  children: React.ReactNode
  direction?: keyof typeof CLIPS
  duration?: number
  className?: string
}

/** Clip-path reveal on scroll. Skipped under prefers-reduced-motion. */
export default function RevealMask({ children, direction = 'bottom', duration = 1, className = '' }: RevealMaskProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const clip = CLIPS[direction] ?? CLIPS.bottom
    const tween = gsap.fromTo(
      el,
      { clipPath: clip.from },
      {
        clipPath: clip.to,
        duration,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      }
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [direction, duration])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
