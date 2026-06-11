'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import ScatterText from '@/components/effects/ScatterText'
import RevealMask from '@/components/effects/RevealMask'
import MobileReveal from '@/components/effects/MobileReveal'
import { COMPOSITIONS } from '@/lib/constants'

/**
 * Original works — the products Roman composes and operates himself
 * (Praxis, Alongside Events, Alongside Brain). Private builds, so the cards
 * tell the story instead of linking out.
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
    <section ref={sectionRef} id="compositions" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
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
        <p data-reveal className="text-white/40 max-w-lg mb-16">
          Personal projects, composed entirely on my own time. AI-heavy pieces I design, build, and run
          after hours — each one solving a problem I actually have.
        </p>

        <RevealMask direction="bottom" duration={1.2}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {COMPOSITIONS.map((work, i) => (
              <MobileReveal key={work.id} delay={100 * i}>
                <article
                  className="composition-card group relative h-full rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden transition-colors duration-500 hover:border-white/15"
                  style={{ borderLeft: `2px solid ${work.color}` }}
                  onMouseEnter={() => setCursorVariant('text')}
                  onMouseLeave={() => setCursorVariant('default')}
                >
                  {/* faint color wash on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${work.color}14, transparent 70%)` }}
                  />
                  <div className="relative p-6 md:p-7 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-mono text-[10px] text-white/25 tracking-wider">
                        op. {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white/40">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: work.color }}
                        />
                        {work.status}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-black tracking-tighter text-white leading-[0.95]">
                      {work.title}
                    </h3>
                    <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mt-2 mb-4">
                      {work.tagline}
                    </p>
                    <p className="text-white/45 text-sm leading-relaxed mb-6">{work.description}</p>
                    <div className="mt-auto flex flex-wrap gap-2">
                      {work.stack.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded-full text-[10px] font-mono border border-white/10 text-white/35"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </MobileReveal>
            ))}
          </div>
        </RevealMask>
      </div>
    </section>
  )
}
