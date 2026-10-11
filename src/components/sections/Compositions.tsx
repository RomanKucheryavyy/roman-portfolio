'use client'
import { useRef } from 'react'
import { useStore } from '@/stores/useStore'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
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
  useRevealOnScroll(sectionRef)

  return (
    <SectionShell ref={sectionRef} id="compositions">
      <SectionHeader
        movement="compositions"
        kicker="// 03. Original Works"
        title={{ lead: 'The', accent: 'Compositions' }}
        intro="Personal projects, composed entirely on my own time. AI-heavy pieces I design, build, and run after hours — each one solving a problem I actually have."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRODUCTS.map((work, i) => (
          <div
            key={work.id}
            data-reveal
            className="h-full"
            onMouseEnter={() => setCursorVariant('text')}
            onMouseLeave={() => setCursorVariant('default')}
          >
            <WorkCard work={work} index={i} total={PRODUCTS.length} />
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
