'use client'
import { useRef, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { useParallax } from '@/hooks/useParallax'
import MagneticButton from '@/components/ui/MagneticButton'
import { ArrowDown, Github, Linkedin } from 'lucide-react'
import { LINKS } from '@/lib/constants'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstNameRef = useParallax(8)
  const lastNameRef = useParallax(12)
  const isLoaded = useStore((s) => s.isLoaded)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  // Hero departure on scroll: text moves up + fades
  useEffect(() => {
    if (!isLoaded || !sectionRef.current) return
    const section = sectionRef.current

    // Reveal elements
    const els = section.querySelectorAll('[data-reveal]')
    gsap.fromTo(els,
      { opacity: 0, y: 30, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out', stagger: 0.12, delay: 0.3 }
    )

    // Scroll departure: as user scrolls, content drifts up and fades
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5,
      onUpdate: (self) => {
        const p = self.progress
        gsap.set(section.querySelector('[data-hero-content]'), {
          y: -p * 150,
          opacity: 1 - p * 1.5,
        })
      },
    })
  }, [isLoaded])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div data-hero-content className="text-center" style={{ willChange: 'transform, opacity' }}>
        {/* Subtitle with typewriter */}
        <div data-reveal className="mb-6 opacity-0">
          <p className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-white/40 inline-block typewriter">
            Orchestrating Logic & Art
          </p>
        </div>

        {/* Name — massive fluid typography with mouse parallax */}
        <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] leading-[0.9] tracking-tighter">
          <div
            ref={firstNameRef}
            data-reveal
            className="text-white opacity-0"
            style={{ transition: 'transform 0.15s ease-out', willChange: 'transform' }}
          >
            Roman
          </div>
          <div
            ref={lastNameRef}
            data-reveal
            className="text-gradient opacity-0"
            style={{ transition: 'transform 0.15s ease-out', willChange: 'transform' }}
          >
            Kucheryavyy
          </div>
        </h1>

        {/* Role */}
        <p data-reveal className="mt-6 font-body text-base md:text-lg text-white/50 max-w-xl mx-auto opacity-0">
          Senior Technical Support Engineer at{' '}
          <span className="text-white font-medium">Salesforce</span> — Developer, Designer,{' '}
          <span className="text-gradient">Conductor</span>
        </p>

        {/* CTAs */}
        <div data-reveal className="flex items-center justify-center gap-4 mt-10 opacity-0">
          <MagneticButton
            href="#projects"
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

      {/* Scroll indicator */}
      <div
        data-reveal
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
        onMouseEnter={() => setCursorVariant('hover')}
        onMouseLeave={() => setCursorVariant('default')}
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-white/30">Scroll</span>
        <ArrowDown size={14} className="text-white/30 animate-bounce" />
      </div>
    </section>
  )
}
