'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Lifeline from '@/components/ui/lifeline'
import type { LifelineMarker } from '@/components/ui/lifeline-utils/types'
import { EDUCATION, ROLES } from '@/lib/content'
import { Container, SectionHeader } from './section-header'

/**
 * One marker per year something started, each with two lines: what it was,
 * then where and when. `age` is a free label slot above the year; there is no
 * birth year in the content, so it stays empty rather than showing a made-up
 * age.
 */
function buildMarkers(): LifelineMarker[] {
  const byYear = new Map<number, string[]>()
  const add = (year: number, lines: string[]) => byYear.set(year, [...(byYear.get(year) ?? []), ...lines])
  for (const r of ROLES) {
    const where = [r.company, r.team, r.note].filter(Boolean).join(', ')
    add(r.startYear, [r.title, `${where} · ${r.dates}`])
  }
  for (const e of EDUCATION) add(e.start, [e.degree, `${e.school} · ${e.start} – ${e.end}`])
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, events]) => ({ id: `y${year}`, year, age: '', events }))
}

/** Matches Lifeline's own breakpoint (Tailwind md). */
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useLayoutEffect(() => {
    const q = window.matchMedia('(max-width: 767.98px)')
    const update = () => setMobile(q.matches)
    update()
    q.addEventListener('change', update)
    return () => q.removeEventListener('change', update)
  }, [])
  return mobile
}

/**
 * Lifeline's look, re-pointed from outside (descendant classes on the
 * component's own className):
 * - its sticky "Age" / "Years" column labels nothing here (no ages, and the
 *   years read for themselves), so it is hidden in both layouts;
 * - each milestone's first line (the title) reads in the page's ink, the
 *   second (where and when) in its muted ink;
 * - on the rail, every column is 216px, so the whole career fits the page
 *   column from 1200px up with no travel;
 * - in the phone list, the empty age column collapses and the rail moves to
 *   the gutter.
 */
const LOOK = [
  // Lifeline holds itself invisible until its intro is armed, which also
  // takes it out of the Tab order until then; it is shown from the start so
  // the rail is reachable by keyboard in page order.
  'visible!',
  '[&_.lifeline-labels_p]:invisible',
  '[&_.group]:w-[216px]!',
  '[&_.tabular-nums]:text-muted-foreground',
  '[&_.space-y-4>p]:text-muted-foreground [&_.space-y-4>p:first-child]:mb-1 [&_.space-y-4>p:first-child]:text-[15px] [&_.space-y-4>p:first-child]:font-medium [&_.space-y-4>p:first-child]:text-foreground',
  '[&_article]:px-0 [&_article>div:first-child]:hidden [&_article_[class*=grid-cols-]]:grid-cols-[0_1rem_1fr] [&_article_[aria-hidden].absolute]:left-5!',
].join(' ')

/** Act III: roles and education on Lifeline's rail, at their real years. */
export function Experience() {
  const mobile = useIsMobile()
  // The rail reads left to right in time; the phone's list, newest first.
  const markers = useMemo(() => {
    const m = buildMarkers()
    return mobile ? m.reverse() : m
  }, [mobile])

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
          className="-ml-3 mt-8 h-auto md:-ml-[96px] md:mt-14 md:h-[19rem]"
          style={{ '--color-black': 'var(--background)' } as React.CSSProperties}
        >
          <Lifeline
            key={mobile ? 'vertical' : 'rail'}
            mode="embed"
            title="Experience and education, by year"
            markers={markers}
            birthYear={Math.min(...markers.map((m) => m.year))}
            className={LOOK}
          />
        </div>
      </Container>
    </section>
  )
}
