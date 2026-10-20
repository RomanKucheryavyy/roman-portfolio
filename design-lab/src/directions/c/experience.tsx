'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import { Briefcase, GraduationCap } from 'lucide-react'
import Lifeline from '@/components/ui/lifeline'
import { registerCompanyIcons } from '@/components/ui/lifeline-utils/company-icon'
import type { LifelineMarker } from '@/components/ui/lifeline-utils/types'
import { EDUCATION, ROLES } from '@/lib/content'
import { Container, SectionHeader } from './section-header'

// Lifeline's public hook for emblems: generic marks for "a job" and "a
// school", never a company's logo.
registerCompanyIcons({
  'stage-role': { icon: Briefcase, sizeClassName: 'h-4 w-4' },
  'stage-school': { icon: GraduationCap, sizeClassName: 'h-4 w-4' },
})

type Milestone = Omit<LifelineMarker, 'year' | 'id'>

function milestones(): Map<number, Milestone> {
  const byYear = new Map<number, Milestone>()
  const add = (year: number, m: Milestone) => {
    const prev = byYear.get(year)
    byYear.set(year, prev ? { ...prev, events: [...prev.events, ...m.events], companies: [...(prev.companies ?? []), ...(m.companies ?? [])] } : m)
  }
  for (const r of ROLES) {
    const team = r.team ? `, ${r.team}` : ''
    const note = r.note ? `, ${r.note}` : ''
    add(r.startYear, {
      // `age` is a free label slot above the year. There is no birth year in
      // the content, so it stays empty rather than showing a made-up age.
      age: '',
      companies: [{ id: 'stage-role', name: r.company }],
      events: [`${r.title} at ${r.company}${team}${note}. ${r.dates}.`],
    })
  }
  for (const e of EDUCATION) {
    add(e.start, {
      age: '',
      companies: [{ id: 'stage-school', name: e.school }],
      events: [`${e.degree}, ${e.school}. ${e.start} – ${e.end}.`],
    })
  }
  return byYear
}

/**
 * The horizontal rail gets every year from the first milestone to the latest,
 * so its spacing keeps real time. The phone's vertical list gets only the
 * milestone years, newest first.
 */
function buildMarkers(layout: 'rail' | 'list'): LifelineMarker[] {
  const byYear = milestones()
  const years = [...byYear.keys()]
  const markers: LifelineMarker[] = []
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    const m = byYear.get(year)
    if (m) markers.push({ id: `y${year}`, year, ...m })
    else if (layout === 'rail') markers.push({ id: `y${year}`, year, age: '', events: [] })
  }
  return layout === 'list' ? markers.reverse() : markers
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

/** Act III: roles and education on Lifeline's rail, at their real years. */
export function Experience() {
  const mobile = useIsMobile()
  // The rail reads left to right and settles on the present.
  const markers = useMemo(() => buildMarkers(mobile ? 'list' : 'rail'), [mobile])

  return (
    <section id="experience" aria-labelledby="experience-title" className="scroll-mt-14 py-16 md:py-32">
      <Container>
        <SectionHeader
          id="experience-title"
          act="Act III"
          kicker="Experience"
          title="Where I have worked and studied"
          intro={<span className="hidden md:inline">Drag the rail or scroll over it to move through the years.</span>}
        />
      </Container>

      {/* Lifeline paints its sticky label column `bg-black` and says to
          re-colour it for another surface: --color-black does that. */}
      <div className="mt-10 h-auto md:mt-16 md:h-[17rem]" style={{ '--color-black': 'var(--background)' } as React.CSSProperties}>
        <Lifeline
          key={mobile ? 'vertical' : 'rail'}
          mode="embed"
          title="Experience and education, by year"
          markers={markers}
          birthYear={Math.min(...markers.map((m) => m.year))}
          // The empty age slot keeps its height; its "Age" heading would
          // label nothing, so it is hidden in both layouts.
          className="[&_.lifeline-labels_p:first-child]:invisible [&_article>div:first-child>p:first-child]:invisible"
        />
      </div>
    </section>
  )
}
