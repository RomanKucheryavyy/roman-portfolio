'use client'
import { useEffect, useRef } from 'react'
import { useStore } from '@/stores/useStore'

export default function Loader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setLoaded = useStore((s) => s.setLoaded)

  useEffect(() => {
    // Simple timer — after 2.5s, hide loader and reveal content
    const timer = setTimeout(() => {
      setLoaded(true)
      if (containerRef.current) {
        containerRef.current.style.opacity = '0'
        containerRef.current.style.transform = 'scale(1.02)'
        setTimeout(() => {
          if (containerRef.current) containerRef.current.style.display = 'none'
        }, 600)
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [setLoaded])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6"
      style={{ transition: 'opacity 0.6s ease, transform 0.6s ease' }}
    >
      <h1 className="font-display text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white text-center leading-tight animate-fade-in">
        ROMAN<br />
        <span className="text-white/50">KUCHERYAVYY</span>
      </h1>

      <div className="w-48 h-px bg-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-white origin-left animate-progress" />
      </div>

      <p className="font-mono text-xs text-white/20 mt-6 tracking-wider animate-fade-in-delayed">
        {'> orchestrating logic & art'}
      </p>
    </div>
  )
}
