'use client'
import { useEffect, useRef, useState } from 'react'

interface SectionFadeProps {
  children: React.ReactNode
  transition?: 'slide-right' | 'stack-up' | 'fade-center' | 'slide-up'
  className?: string
}

/**
 * On mobile, sections fade in when scrolled into view (cheap, GPU-friendly).
 * On desktop it renders a plain wrapper — GSAP handles section entrances there.
 * The named transition variants are reserved; all currently fade.
 */
export default function SectionFade({ children, className = '' }: SectionFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [isMobile])

  if (!isMobile) return <div className={className}>{children}</div>

  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease-out', willChange: 'opacity' }}
    >
      {children}
    </div>
  )
}
