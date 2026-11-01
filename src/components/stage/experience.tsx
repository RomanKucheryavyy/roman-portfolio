'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Container, SectionHeader } from './section-header'

// Lifeline loads after the page with its glue (experience-road.tsx), like
// the other heavy pieces below the first screen (see "lazy parts" in
// stage.tsx). The rail's box already has its height from md up (h-[16rem]);
// on a phone the placeholder is the five milestones' own height (each year
// at 40px, the role in Cinzel, where and when in Geist), which grows as the
// roles and the where-and-when lines take a second line: 870px from 377px
// wide, 893px from 353px, 916px from 340px, 944px below.
const Road = dynamic(() => import('./experience-road'), {
  ssr: false,
  loading: function Holding() {
    return (
      <div
        aria-hidden="true"
        className="h-[870px] max-[376.98px]:h-[893px] max-[352.98px]:h-[916px] max-[339.98px]:h-[944px] md:h-full"
      />
    )
  },
})

/** Act III: roles and education on Lifeline's rail at their real years (a list of years on a phone). */
export function Experience() {
  // The rail scrubs on drag and sideways swipes. A vertical wheel is the
  // page's: stopping it here, before it reaches the rail's own listener,
  // means the rail can never hold the page.
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { capture: true, passive: true })
    return () => el.removeEventListener('wheel', onWheel, { capture: true })
  }, [])

  return (
    <section id="experience" aria-labelledby="experience-title" className="scroll-mt-14 py-16 md:py-24">
      <Container>
        <SectionHeader
          id="experience-title"
          act="Act III"
          kicker="Experience"
          title="Where I have worked and studied"
          // Below sm, and from md to lg, the title is fitted to the width (its
          // longest half is 11.6 times its size), so it balances to two
          // lines ("Where I have worked / and studied") rather than leaving
          // "worked" alone on a line of its own.
          className="max-sm:[&_h2]:text-[min(2.125rem,calc((100vw_-_2rem)/11.6))] md:max-lg:[&_h2]:text-[min(3.75rem,calc((100vw_-_6rem)/11.6))]"
          // From 1200px the whole rail fits, so there is nothing to drag.
          intro={<span className="hidden md:max-[1199.98px]:inline">Drag the rail to move through the years.</span>}
        />

        {/* Rail: Lifeline starts its track 24px inside its own box, after a
            72px label column, so the box starts 96px left of the column and
            the first year lands on it. Phones: the list stands in the
            column. Lifeline paints its label column `bg-black` and says to
            re-colour it for another surface: --color-black does that. */}
        <div
          ref={railRef}
          className="mt-10 h-auto md:-ml-[96px] md:mt-14 md:h-[16rem]"
          style={{ '--color-black': 'var(--background)' } as React.CSSProperties}
        >
          <Road />
        </div>
      </Container>
    </section>
  )
}
