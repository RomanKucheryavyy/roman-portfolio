'use client'
import { useRef, ReactNode } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'

interface Props {
  children: ReactNode
  className?: string
  href?: string
  onClick?: () => void
}

export default function MagneticButton({ children, className = '', href, onClick }: Props) {
  const ref = useRef<HTMLElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' })
  }

  const handleLeave = () => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' })
    setCursorVariant('default')
  }

  const Tag = href ? 'a' : 'button'
  const props = href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick, type: 'button' as const }

  return (
    <Tag
      // @ts-expect-error ref type mismatch between a and button
      ref={ref}
      {...props}
      className={`magnetic-btn inline-flex items-center gap-2 cursor-pointer ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={() => setCursorVariant('hover')}
      onMouseLeave={handleLeave}
    >
      {children}
    </Tag>
  )
}
