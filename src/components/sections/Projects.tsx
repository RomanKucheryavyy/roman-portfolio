'use client'
import { useRef, useEffect, useState, lazy, Suspense } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import MagneticButton from '@/components/ui/MagneticButton'
import { PROJECTS } from '@/lib/constants'
import { ExternalLink, Smartphone } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))
const SPLINE_IPHONE_URL = 'https://prod.spline.design/Mi7zxeQ50WnJzGOr/scene.splinecode'

function ProjectSlide({ project, index }: { project: (typeof PROJECTS)[number]; index: number }) {
  const slideRef = useRef<HTMLDivElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const isApp = 'isApp' in project && project.isApp

  useEffect(() => {
    const slide = slideRef.current
    if (!slide) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const trigger = ScrollTrigger.create({
      trigger: slide,
      start: 'top top',
      end: '+=100%',
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress
        const bg = slide.querySelector('[data-project-bg]') as HTMLElement
        const text = slide.querySelector('[data-project-text]') as HTMLElement

        if (bg) {
          bg.style.filter = `brightness(${0.45 + p * 0.25})`
          bg.style.transform = `scale(1.05) translateY(${p * -20}px)`
        }
        if (text) {
          text.style.transform = `translateY(${(1 - p) * 60}px)`
          text.style.opacity = `${Math.min(p * 2, 1)}`
        }
      },
      onEnter: () => useStore.getState().setActiveProject(index),
      onEnterBack: () => useStore.getState().setActiveProject(index),
    })
    return () => trigger.kill()
  }, [index])

  return (
    <div
      ref={slideRef}
      className="relative w-full h-screen overflow-hidden"
      onMouseEnter={() => setCursorVariant('text')}
      onMouseLeave={() => setCursorVariant('default')}
    >
      {/* Full-viewport background */}
      <div data-project-bg className="absolute inset-0" style={{ filter: 'brightness(0.45)' }}>
        {isApp ? (
          /* Spline 3D iPhone fills the background for iOS app */
          <div className="absolute inset-0">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            }>
              <Spline scene={SPLINE_IPHONE_URL} style={{ width: '100%', height: '100%' }} />
            </Suspense>
          </div>
        ) : (
          /* Live website iframe as full-viewport background */
          <>
            <iframe
              src={project.url}
              title={`${project.title} preview`}
              className="absolute top-0 left-0 border-0 pointer-events-none"
              style={{
                width: '1920px',
                height: '1200px',
                transform: `scale(${typeof window !== 'undefined' ? window.innerWidth / 1920 : 1})`,
                transformOrigin: 'top left',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoaded(true)}
            />
            {!iframeLoaded && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content overlay — bottom-left */}
      <div
        data-project-text
        className="relative z-10 flex flex-col justify-end h-full p-8 md:p-16 pb-24"
        style={{ opacity: 0 }}
      >
        <p className="font-mono text-xs text-white/30 mb-4">
          {String(index + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
        </p>
        <h2
          className="font-display text-4xl sm:text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter text-white leading-[0.9] mb-6"
          style={{ mixBlendMode: 'difference' }}
        >
          {project.title}
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-lg mb-6 leading-relaxed">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {project.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-mono border border-white/15 text-white/40">
              {tag}
            </span>
          ))}
        </div>
        <MagneticButton
          href={project.url}
          className="inline-flex items-center gap-2 font-mono text-sm text-white border border-white/20 px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition-all duration-300 w-fit"
        >
          {isApp ? <Smartphone size={14} /> : <ExternalLink size={14} />}
          {isApp ? 'App Store' : 'Visit Site'}
        </MagneticButton>
      </div>
    </div>
  )
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const header = sectionRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(header,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="projects">
      <div className="py-24 px-6 md:px-16">
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          // 02. Projects & Work
        </p>
        <h2 data-reveal className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          The <span className="text-gradient">Symphony</span>
        </h2>
        <p data-reveal className="text-white/40 max-w-lg">
          Each project is a full movement — scroll to experience them live.
        </p>
      </div>
      {PROJECTS.map((project, i) => (
        <ProjectSlide key={project.id} project={project} index={i} />
      ))}
    </section>
  )
}
