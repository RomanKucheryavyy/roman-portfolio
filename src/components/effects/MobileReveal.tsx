'use client'
import { useEffect, useRef, useState } from 'react'

interface MobileRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/**
 * Mobile-only staggered entrance (fade + lift + settle); a plain wrapper on
 * desktop where GSAP owns the choreography.
 */
export default function MobileReveal({ children, delay = 0, className = '' }: MobileRevealProps) {
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
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [isMobile])

  if (!isMobile) return <div className={className}>{children}</div>

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(30px) scale(0.97)',
        transition: `opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
