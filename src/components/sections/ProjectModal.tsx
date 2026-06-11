'use client'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { PROJECTS } from '@/lib/constants'

interface ProjectModalProps {
  projectIndex: number | null
  onClose: () => void
}

/** Desktop-only "Project Deep Dive" overlay — opened by clicking a deck card. */
export default function ProjectModal({ projectIndex, onClose }: ProjectModalProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const mousePosition = useStore((s) => s.mousePosition)

  const project = projectIndex !== null ? PROJECTS[projectIndex] : null

  useEffect(() => {
    if (!project || !rootRef.current || !contentRef.current) return
    const root = rootRef.current
    const content = contentRef.current

    document.body.style.overflow = 'hidden'
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
    gsap.fromTo(content, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.15 })
    gsap.fromTo(
      root.querySelectorAll('[data-modal-tag]'),
      { y: 30, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1,0.6)', stagger: 0.06, delay: 0.3 }
    )

    const close = () => {
      document.body.style.overflow = ''
      gsap.to(content, { y: 40, opacity: 0, duration: 0.3, ease: 'power2.in' })
      gsap.to(root, { opacity: 0, duration: 0.3, delay: 0.1, ease: 'power2.in', onComplete: onClose })
    }

    const onWheel = (e: WheelEvent) => { if (e.deltaY > 50) close() }
    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0].clientY - touchStartY < -50) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project])

  if (!project) return null

  const tx = (mousePosition.x / (typeof window !== 'undefined' ? window.innerWidth : 1) - 0.5) * 20
  const ty = (mousePosition.y / (typeof window !== 'undefined' ? window.innerHeight : 1) - 0.5) * 20

  const close = () => {
    document.body.style.overflow = ''
    if (contentRef.current) gsap.to(contentRef.current, { y: 40, opacity: 0, duration: 0.3, ease: 'power2.in' })
    if (rootRef.current) gsap.to(rootRef.current, { opacity: 0, duration: 0.3, delay: 0.1, ease: 'power2.in', onComplete: onClose })
  }

  return (
    <div ref={rootRef} className="fixed inset-0 z-[180] flex items-center justify-center" style={{ opacity: 0 }}>
      <div className="absolute inset-0">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover"
          style={{ filter: 'blur(30px) brightness(0.3)' }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <button
        onClick={close}
        className="absolute top-6 right-6 z-10 p-3 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/50 transition-all cursor-pointer"
        onMouseEnter={() => setCursorVariant('hover')}
        onMouseLeave={() => setCursorVariant('default')}
      >
        <X size={20} />
      </button>

      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: `translate(${tx}px, ${ty}px)` }}
      >
        <div className="flex flex-wrap gap-4 max-w-lg justify-center opacity-30">
          {project.tags.map((tag) => (
            <span
              key={tag}
              data-modal-tag
              className="px-4 py-2 rounded-full text-sm font-mono border border-white/20 text-white/50"
              style={{ opacity: 0 }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div ref={contentRef} className="relative z-10 max-w-2xl mx-auto px-8 text-center" style={{ opacity: 0 }}>
        <p className="font-mono text-[10px] text-white/30 mb-4 tracking-wider uppercase">Project Deep Dive</p>
        <h2 className="font-display text-4xl sm:text-6xl font-black tracking-tighter text-white mb-6">
          {project.title}
        </h2>
        <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md mx-auto">{project.description}</p>
        <div className="grid grid-cols-2 gap-6 mb-8 max-w-sm mx-auto">
          <div className="text-left">
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-wider mb-1">Role</p>
            <p className="text-white text-sm">Design &amp; Development</p>
          </div>
          <div className="text-left">
            <p className="font-mono text-[9px] text-white/25 uppercase tracking-wider mb-1">Stack</p>
            <p className="text-white text-sm">{project.tags.join(', ')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {project.tags.map((tag) => (
            <span
              key={tag}
              data-modal-tag
              className="px-3 py-1 rounded-full text-xs font-mono border border-white/20 text-white/60"
              style={{ opacity: 0 }}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="font-mono text-[10px] text-white/20 mt-8">Scroll down or press ESC to close</p>
      </div>
    </div>
  )
}
