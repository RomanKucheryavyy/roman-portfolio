'use client'

import dynamic from 'next/dynamic'
import { CERTIFICATIONS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { RankHonour } from './rank-honour'
import { Container, SectionHeader } from './section-header'

// The frieze of the eight seals, with its glue (frieze.tsx), loads after the
// page, in the browser only (the marquee reads reduced motion on its first
// render).
const Frieze = dynamic(() => import('./frieze'), { ssr: false })

/**
 * RESERVE holds the frieze's rendered height while it loads, so nothing
 * moves when it arrives (frieze.tsx says how each layout's height adds up).
 * In media queries, so the server's HTML already holds the right one for
 * the visitor's width and motion setting. Literal numbers, so Tailwind
 * finds the classes.
 */
const RESERVE = [
  // wide: 52 + 2, + 12 + 32
  '[@media(prefers-reduced-motion:no-preference)_and_(min-width:601px)]:min-h-[98px]',
  // narrow: 4 * 52 + 3 + 2, + 12 + 32
  '[@media(prefers-reduced-motion:no-preference)_and_(max-width:600px)]:min-h-[257px]',
  // stillWide: 4 * 52 + 3 + 2
  '[@media(prefers-reduced-motion:reduce)_and_(min-width:768px)]:min-h-[213px]',
  // stillMid: 8 * 52 + 7 + 2
  '[@media(prefers-reduced-motion:reduce)_and_(min-width:601px)_and_(max-width:767.98px)]:min-h-[425px]',
  // stillNarrow: 8 * 52 + 7 + 2
  '[@media(prefers-reduced-motion:reduce)_and_(max-width:600px)]:min-h-[425px]',
].join(' ')

/**
 * Act IV: his Trailhead rank first, its crowning honour (rank-honour.tsx),
 * then the eight Salesforce certifications, newest first. From xl the rank
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
      {/* Always mounted, off screen too: the seals are the only place the
          eight certifications are written out, so screen readers,
          find-in-page and the Tab order all need them there. Its frame loop
          costs two transform writes a frame. */}
      <div className={cn('mt-10 md:mt-14', RESERVE)}>
        <Frieze />
      </div>
    </section>
  )
}
