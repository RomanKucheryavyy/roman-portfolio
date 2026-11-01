'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Container, SectionHeader } from './section-header'

// Lifeline loads after the page with its glue (experience-road.tsx), like
// the other heavy pieces below the first screen (see "lazy parts" in
// stage.tsx). The rail's box already has its height from md up (h-[16rem],
// below: the 225px track, its 20px top and a little air); on a phone the
// placeholder is the five-year list's own height with the titles in Cinzel,
// 908px, and 930px below 331px wide, where "Technical Support Engineer"
// (270px of Cinzel) takes a second line.
const Road = dynamic(() => import('./experience-road'), {
  ssr: false,
  loading: function Holding() {
    return <div aria-hidden="true" className="h-[908px] max-[330.98px]:h-[930px] md:h-full" />
  },
})

/** Act III: roles and education on Lifeline's rail, at their real years. */
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
          // From 1200px the whole rail fits, so there is nothing to drag.
          intro={<span className="hidden md:max-[1199.98px]:inline">Drag the rail to move through the years.</span>}
        />

        {/* Rail: Lifeline starts its track 24px inside its own box, after a
            72px label column, so the box starts 96px left of the column and
            the first year lands on it. Phones: the list's tick column sits
            on the gutter. Lifeline paints its label column `bg-black` and
            says to re-colour it for another surface: --color-black does that. */}
        <div
          ref={railRef}
          className="-ml-3 mt-8 h-auto md:-ml-[96px] md:mt-14 md:h-[16rem]"
          style={{ '--color-black': 'var(--background)' } as React.CSSProperties}
        >
          <Road />
        </div>
      </Container>
    </section>
  )
}
