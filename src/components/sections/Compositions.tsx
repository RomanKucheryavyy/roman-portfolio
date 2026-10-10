'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import ScatterText from '@/components/effects/ScatterText'
import RevealMask from '@/components/effects/RevealMask'
import MobileReveal from '@/components/effects/MobileReveal'
import WorkCard from '@/components/ui/WorkCard'
import { PRODUCTS } from '@/lib/work'

/**
 * Original works — the products Roman composes and operates himself.
 * Most are private builds, so the card tells the story; the ones that are
 * public (Sembly) carry a link to the live thing.
 */
export default function Compositions() {
  const sectionRef = useRef<HTMLElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.fromTo(
      section.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      }
    )

    section.querySelectorAll('.composition-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.1 * i,
          scrollTrigger: { trigger: card, start: 'top 88%', once: true },
        }
      )
    })
  }, [])

  return (
    <section ref={sectionRef} id="compositions" className="py-14 md:py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-label font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          {'// 03. Original Works'}
        </p>
        <h2 data-section-heading className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => {
              const el = document.querySelector('#compositions [data-section-heading]')
              if (el) el.innerHTML = 'The <span class="text-gradient">Compositions</span>'
            }}
          >
            The Compositions
          </ScatterText>
        </h2>
        <p data-reveal className="text-white/40 max-w-lg mb-10 md:mb-16">
          Personal projects, composed entirely on my own time. AI-heavy pieces I design, build, and run
          after hours — each one solving a problem I actually have.
        </p>

        <RevealMask direction="bottom" duration={1.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTS.map((work, i) => (
              <MobileReveal key={work.id} delay={100 * i}>
                <div
                  className="composition-card h-full"
                  onMouseEnter={() => setCursorVariant('text')}
                  onMouseLeave={() => setCursorVariant('default')}
                >
                  <WorkCard work={work} index={i} total={PRODUCTS.length} />
                </div>
              </MobileReveal>
            ))}
          </div>
        </RevealMask>
      </div>
    </section>
  )
}
