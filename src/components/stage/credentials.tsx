'use client'

import dynamic from 'next/dynamic'
import { CERTIFICATIONS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { RankHonour } from './rank-honour'
import { Container, SectionHeader } from './section-header'

// The frieze of the eight certifications, with its glue (frieze.tsx), loads
// after the page, in the browser only (the marquee reads reduced motion on
// its first render).
const Frieze = dynamic(() => import('./frieze'), { ssr: false })

/**
 * RESERVE holds the frieze's rendered height while it loads, so nothing
 * moves when it arrives (frieze.tsx says how each layout is set). In media
 * queries, so the server's HTML already holds the right one for the
 * visitor's width and motion setting. Literal numbers, so Tailwind finds
 * the classes.
 */
const RESERVE = [
  // row, from md: a 52px row, then 12px and the 44px pause control.
  '[@media(prefers-reduced-motion:no-preference)_and_(min-width:768px)]:min-h-[108px]',
  // still, from md under reduced motion: four rows of two, 52px each.
  '[@media(prefers-reduced-motion:reduce)_and_(min-width:768px)]:min-h-[208px]',
  // list, below md: eight lines of 42px, and 17px more for each name that
  // takes a second line (one below 343px wide, two at 336px, three below).
  'max-[767.98px]:min-h-[336px] max-[342.98px]:min-h-[353px] max-[336.98px]:min-h-[369px] max-[335.98px]:min-h-[386px]',
].join(' ')

/**
 * Act IV: his Trailhead rank first, its crowning honour (rank-honour.tsx),
 * then the eight Salesforce certifications, newest first (frieze.tsx). From xl the rank
 * stands beside the act's header (narrower, the header's longest word would
 * not fit beside it); below that, between the header and the frieze.
 */
export function Credentials() {
  const newest = CERTIFICATIONS[0]
  const oldest = CERTIFICATIONS[CERTIFICATIONS.length - 1]

  return (
    // overflow-x-clip: the rank's glory spreads wider than the column.
    <section id="credentials" aria-labelledby="credentials-title" className="scroll-mt-14 overflow-x-clip py-16 md:py-24">
      <Container className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:items-center xl:gap-10">
        <SectionHeader
          id="credentials-title"
          act="Act IV"
          kicker="Credentials"
          title={`${CERTIFICATIONS.length} Salesforce certifications`}
          intro={`From ${oldest.name} in ${oldest.date} to ${newest.name} in ${newest.date}.`}
        />
        <RankHonour className="mt-14 md:mt-16 xl:mt-0" />
      </Container>
      {/* Always mounted, off screen too: the frieze is the only place the
          eight certifications are written out, so screen readers,
          find-in-page and the Tab order all need them there. Moving, its
          frame loop costs one transform write a frame. */}
      <div className={cn('mt-10 md:mt-14', RESERVE)}>
        <Frieze />
      </div>
    </section>
  )
}
