'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import Lifeline from '@/components/ui/lifeline'
import type { LifelineMarker } from '@/components/ui/lifeline-utils/types'
import { EDUCATION, ROLES } from '@/lib/content'

/**
 * Act III's road, configured: Lifeline with Act III's own glue, in a module
 * of its own so it loads after the page with the component it styles
 * (experience.tsx loads it with next/dynamic, behind a block of its
 * height). The section, its header and the rail's box stay in the page's
 * own HTML.
 */

/**
 * One marker per year something started, each with two lines: what it was,
 * then where and when. `age` is a free label slot above the year; there is no
 * birth year in the content, so it stays empty rather than showing a made-up
 * age.
 */
function buildMarkers(): LifelineMarker[] {
  const byYear = new Map<number, string[]>()
  const add = (year: number, lines: string[]) => byYear.set(year, [...(byYear.get(year) ?? []), ...lines])
  // A date range wraps as one piece, after the "·": no break at its spaces
  // (no-break spaces) nor after its dash, where browsers break by default
  // (a word joiner).
  const keep = (dates: string) => dates.replace(/ /g, '\u00a0').replace(/–/g, '–\u2060')
  for (const r of ROLES) {
    const where = [r.company, r.team, r.note].filter(Boolean).join(', ')
    add(r.startYear, [r.title, `${where} · ${keep(r.dates)}`])
  }
  for (const e of EDUCATION) add(e.start, [e.degree, `${e.school} · ${keep(`${e.start} – ${e.end}`)}`])
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
 * component's own className). Act III's own Roman idea is the road: the
 * rail is a gold line that fades out past the last year, and each year a
 * milestone on it, a small gold lozenge that fills when its column is
 * hovered. The roles are inscribed in Cinzel; the years and the where and
 * when stay in Geist (the years in Arabic figures: facts to read).
 *
 * - its sticky "Age" / "Years" column labels nothing here (no ages, and the
 *   years read for themselves), so it is hidden in both layouts, and on the
 *   rail each column's empty age line is taken out, with the rail raised to
 *   match (Lifeline's --lifeline-rail, 5rem with the line, 2.75rem without);
 * - a year is in the muted ink, gold while its column is hovered;
 * - each milestone's title (its odd lines) is Cinzel in marble, its where
 *   and when (the even lines) Geist in the muted ink;
 * - on the rail, every column is 216px, so the whole career fits the page
 *   column from 1200px up with no travel;
 * - in the phone list, the empty age column collapses and the rail moves to
 *   the gutter, under the lozenges.
 *
 * Every colour that Lifeline sets in a `dark:` or hover rule is set here
 * with `!`, since those rules outrank a descendant class.
 */
const LOOK = [
  // Lifeline holds itself invisible until its intro is armed, which also
  // takes it out of the Tab order until then; it is shown from the start so
  // the rail is reachable by keyboard in page order.
  'visible!',
  '[&_.lifeline-labels_p]:invisible',
  '[&_.group]:w-[216px]!',
  // The rail's columns: no age line, and the rail raised to the year's foot.
  '[&_.group_.flex-col>p:first-child]:hidden [&_.will-change-transform]:[--lifeline-rail:2.75rem]',
  // The road: a gold line, fading out after the last milestone.
  '[&_.border-dashed]:border-0! [&_.border-t.border-dashed]:bg-linear-to-r [&_.border-l.border-dashed]:bg-linear-to-b [&_.border-dashed]:from-gold/70 [&_.border-dashed]:via-gold/70 [&_.border-dashed]:via-85% [&_.border-dashed]:to-transparent',
  // The milestones: Lifeline's tick (a 10px line; its only span hidden from
  // screen readers) drawn as a gold lozenge on the rail; the latest, where
  // the road has got to (the rail's last, the list's first), filled.
  '[&_span[aria-hidden]]:size-[9px]! [&_span[aria-hidden]]:rotate-45 [&_span[aria-hidden]]:border [&_span[aria-hidden]]:border-gold [&_span[aria-hidden]]:bg-background!',
  '[&_.group_span[aria-hidden]]:-translate-x-1/2 [&_.group:hover_span[aria-hidden]]:bg-gold!',
  '[&_:is(.group:last-child,li:first-child)_span[aria-hidden]]:bg-gold! [&_:is(.group:last-child,li:first-child)_span[aria-hidden]]:shadow-[0_0_0_4px_color-mix(in_oklab,var(--stage-gold)_16%,transparent)]',
  // The years (and the empty age slots): Geist, muted, gold on hover.
  '[&_.tabular-nums]:tracking-[0.06em] [&_.tabular-nums]:text-muted-foreground! [&_.group:hover_.tabular-nums]:text-gold!',
  // The milestones' lines: the title inscribed, the where and when below it.
  '[&_.space-y-4>p]:text-muted-foreground [&_.space-y-4>p]:odd:mb-2 [&_.space-y-4>p]:odd:font-roman [&_.space-y-4>p]:odd:text-[17px] [&_.space-y-4>p]:odd:font-medium [&_.space-y-4>p]:odd:leading-[1.3] [&_.space-y-4>p]:odd:tracking-[0.02em] [&_.space-y-4>p]:odd:text-foreground',
  '[&_article]:px-0 [&_article>div:first-child]:hidden [&_article_[class*=grid-cols-]]:grid-cols-[0_1rem_1fr] [&_article_[aria-hidden].absolute]:left-5!',
].join(' ')

/** The road: the rail from md, the phone's list (newest first) below it. */
export default function Road() {
  const mobile = useIsMobile()
  // The rail reads left to right in time; the phone's list, newest first.
  const markers = useMemo(() => {
    const m = buildMarkers()
    return mobile ? m.reverse() : m
  }, [mobile])
  return (
    <Lifeline
      key={mobile ? 'vertical' : 'rail'}
      mode="embed"
      title="Experience and education, by year"
      markers={markers}
      birthYear={Math.min(...markers.map((m) => m.year))}
      className={LOOK}
    />
  )
}
