'use client'
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { useParallax } from '@/hooks/useParallax'
import { useGyroParallax } from '@/hooks/useGyroParallax'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import TerrainScene from '@/components/canvas/TerrainScene'
import Starfield from '@/components/canvas/Starfield'
import FloatingLetters from '@/components/effects/FloatingLetters'
import MagneticButton from '@/components/ui/MagneticButton'
import { ArrowDown, Github, Linkedin } from 'lucide-react'
import { LINKS } from '@/lib/constants'

const SPOTLIGHTS = [
  { rotate: '20deg', duration: '17s', reverse: false },
  { rotate: '-20deg', duration: '14s', reverse: false },
  { rotate: '0deg', duration: '21s', reverse: true },
]

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstNameRef = useParallax(8)
  const lastNameRef = useParallax(12)
  const isLoaded = useStore((s) => s.isLoaded)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const { isMobile } = useDeviceCapability()
  const gyroRef = useGyroParallax({ maxOffset: 12 })

  useEffect(() => {
    if (!isLoaded || !sectionRef.current) return
    const section = sectionRef.current

    gsap.fromTo(
      section.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 25, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', stagger: 0.12, delay: 0.2 }
    )

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onUpdate: (self) => {
        gsap.set(section.querySelector('[data-hero-content]'), {
          y: -(150 * self.progress),
          opacity: 1 - 1.5 * self.progress,
        })
      },
    })
    return () => trigger.kill()
  }, [isLoaded])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-svh flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* WebGL terrain waves */}
      <div className="absolute inset-0 z-0">
        <TerrainScene />
      </div>

      {/* CSS volumetric spotlight beams — one on phones, three on desktop */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {SPOTLIGHTS.slice(0, isMobile ? 1 : 3).map((beam, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 mx-auto top-0"
            style={{
              width: '30em',
              height: 'max(42em, 86vh)',
              borderRadius: '0 0 50% 50%',
              backgroundImage:
                'conic-gradient(from 0deg at 50% -5%, transparent 45%, rgba(124,145,182,0.3) 49%, rgba(124,145,182,0.5) 50%, rgba(124,145,182,0.3) 51%, transparent 55%)',
              transformOrigin: '50% 0',
              filter: `blur(${isMobile ? 8 : 15}px) opacity(0.5)`,
              transform: `rotate(${beam.rotate})`,
              animation: `spotlight ${beam.duration} ease-in-out infinite ${beam.reverse ? 'reverse' : ''}`,
              fontSize: 'max(calc(min(600px, 80vh) * 0.03), 10px)',
            }}
          />
        ))}
        <style jsx>{`
          @keyframes spotlight {
            0% { filter: blur(15px) opacity(0.5); transform: rotate(0) scale(1); }
            20% { filter: blur(16px) opacity(0.6); transform: rotate(-1deg) scale(1.2); }
            40% { filter: blur(14px) opacity(0.4); transform: rotate(2deg) scale(1.3); }
            60% { filter: blur(15px) opacity(0.6); transform: rotate(-2deg) scale(1.2); }
            80% { filter: blur(13px) opacity(0.4); transform: rotate(1deg) scale(1.1); }
            100% { filter: blur(15px) opacity(0.5); transform: rotate(0) scale(1); }
          }
        `}</style>
      </div>

      <Starfield />

      <div
        ref={gyroRef}
        data-hero-content
        className="relative z-10 text-center"
        style={{ willChange: 'transform, opacity', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        <h1 className="font-display font-black text-[clamp(2.4rem,12.5vw,3rem)] sm:text-7xl md:text-8xl lg:text-[9rem] leading-[1] pb-[0.15em] overflow-visible">
          <div
            ref={firstNameRef}
            className="text-white tracking-tighter"
            style={{ transition: 'transform 0.15s ease-out', willChange: 'transform' }}
          >
            {isMobile ? 'Roman' : <FloatingLetters className="font-display font-black">Roman</FloatingLetters>}
          </div>
          <div
            ref={lastNameRef}
            className="tracking-tight md:tracking-normal leading-[1.15] pb-1"
            style={{ transition: 'transform 0.15s ease-out', willChange: 'transform' }}
          >
            {isMobile ? (
              <span className="text-gradient">Kucheryavyy</span>
            ) : (
              <FloatingLetters className="font-display font-black text-gradient">Kucheryavyy</FloatingLetters>
            )}
          </div>
        </h1>

        <p
          data-reveal
          className="mt-6 pb-1 font-body text-base md:text-lg text-white/50 max-w-xl mx-auto opacity-0 overflow-visible"
        >
          Salesforce engineer by day. Full-stack builder by nature.{' '}
          <span className="text-gradient">Conductor</span> by calling.
        </p>

        <div data-reveal className="flex items-center justify-center gap-4 mt-10 opacity-0">
          <MagneticButton
            href="#symphony"
            className="px-6 py-3 rounded-full bg-white text-black font-mono text-sm font-semibold tracking-wider uppercase hover:opacity-80 transition-all duration-300"
          >
            View Work
          </MagneticButton>
          <MagneticButton
            href={LINKS.github}
            className="p-3 rounded-full border border-white/20 text-white/50 hover:border-white/50 hover:text-white transition-all duration-300"
          >
            <Github size={18} />
          </MagneticButton>
          <MagneticButton
            href={LINKS.linkedin}
            className="p-3 rounded-full border border-white/20 text-white/50 hover:border-white/50 hover:text-white transition-all duration-300"
          >
            <Linkedin size={18} />
          </MagneticButton>
        </div>
      </div>

      <div
        data-reveal
        className="absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 opacity-0"
        onMouseEnter={() => setCursorVariant('hover')}
        onMouseLeave={() => setCursorVariant('default')}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">Scroll</span>
        <ArrowDown size={14} className="text-white/30 animate-bounce" />
      </div>
    </section>
  )
}
