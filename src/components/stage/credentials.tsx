'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ToolchainItem } from '@/components/ui/toolchain-marquee'
import { CERTIFICATIONS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { RankHonour } from './rank-honour'
import { Container, SectionHeader } from './section-header'

// The marquee reads prefers-reduced-motion during its first render, so the
// server's HTML and the browser's disagree for anyone who has it on. Rendering
// it in the browser only avoids that hydration error.
const ToolchainMarquee = dynamic(() => import('@/components/ui/toolchain-marquee'), { ssr: false })

/**
 * Act IV's own Roman idea: each certification is a seal, a disc of the wash
 * ringed in gold with a laurel wreath (Rome's mark of an honour won)
 * struck in it, followed by its inscription. The left branch is drawn and
 * mirrored for the right. Decoration only: the marquee hides its icons
 * from screen readers, and the label says it all.
 */
const LAUREL_STEM = 'M10.2 19.7A7.6 7.6 0 0 1 6.9 6.7'
const LAUREL_LEAVES =
  'M8.4 19Q7.2 20.6 4.9 19.9Q6.6 18.2 8.4 19ZM6.1 17.1Q4.3 18.1 2.5 16.5Q4.7 15.6 6.1 17.1ZM6.1 17.1Q4.6 15.7 5.5 13.5Q7.1 15.3 6.1 17.1ZM4.7 14.4Q2.7 14.6 1.6 12.5Q4 12.5 4.7 14.4ZM4.7 14.4Q3.9 12.5 5.6 10.9Q6.3 13.1 4.7 14.4ZM4.5 11.4Q2.5 10.8 2.4 8.4Q4.6 9.3 4.5 11.4ZM4.5 11.4Q4.4 9.3 6.6 8.5Q6.4 10.8 4.5 11.4ZM5.4 8.5Q3.9 7.2 4.7 5Q6.3 6.7 5.4 8.5ZM5.4 8.5Q6.2 6.6 8.5 6.7Q7.4 8.8 5.4 8.5ZM6.9 6.7Q7.1 4.6 9.3 4Q8.9 6.3 6.9 6.7Z'

function Branch() {
  return (
    <>
      <path d={LAUREL_STEM} fill="none" stroke="currentColor" strokeWidth={0.6} strokeLinecap="round" />
      <path d={LAUREL_LEAVES} />
    </>
  )
}

function Laurel() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <Branch />
      <g transform="matrix(-1 0 0 1 24 0)">
        <Branch />
      </g>
    </svg>
  )
}

// One accent for every seal: these are all the same kind of thing.
const items: ToolchainItem[] = CERTIFICATIONS.map((c) => ({
  label: `${c.name} · ${c.date}`,
  icon: <Laurel />,
  accent: 'var(--stage-gold)',
}))

const chunk = (size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))

/**
 * How the eight seals are laid out. Moving rows run full-bleed so the
 * module's own edge fade sits at the screen edge. Wide, all eight run in
 * one row: its track (about 2,700px) is wider than any screen up to 1920,
 * so no seal shows twice at once (three rows of two or three, each shorter
 * than the screen, wrote every one out two or three times over). On a
 * phone, four rows of two, each wider than the screen. Under reduced motion
 * the rows hold still and must show every seal without sideways scrolling,
 * so they sit in the page column with fewer seals per row.
 *
 * RESERVE holds each layout's rendered height while the browser-only
 * marquee loads, so nothing moves when it arrives: rows of 52px (a 36px
 * line for a seal and its inscription, 8px above and below), a 1px rule between rows
 * and one above and below them all (FRIEZE), and, for moving rows, the
 * pause control's row (a 12px gap and 32px). It says them in media queries,
 * so the server's HTML already holds the right one for the visitor's width
 * and motion setting (the layout itself is only known once the page runs).
 * Literal numbers, so Tailwind finds the classes.
 */
const LAYOUTS = {
  wide: { stacks: [items] },
  narrow: { stacks: chunk(2) },
  stillWide: { stacks: chunk(2) },
  stillNarrow: { stacks: chunk(1) },
  stillMid: { stacks: chunk(1) },
} as const
type Layout = keyof typeof LAYOUTS

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
 * The marquee as a frieze, from outside (descendant classes; the module's
 * own CSS is unlayered, so whatever it sets is set here with `!`). The
 * rows are lines of an inscription between two gold rules, with a fainter
 * rule between them; each badge loses its box and becomes a seal
 * (FRIEZE_SEAL) and its words in Cinzel (FRIEZE_WORDS, 12px and closer set
 * below 360px wide so the longest fits a 320px phone's still list, 13px,
 * the most that fits the still list from 360px, then 15px from lg). The
 * pause control takes the Stage's square shape and a gold edge.
 *
 * Act I's projects are plaques (rectangles, rivets, Roman numerals); these
 * are round, struck, and unnumbered, so the two never read as one idea.
 *
 * The module's parts, from its root: `>div` the rows, `>div>div` each row,
 * `>div>div>div` a row's track and `>div>div>div>div` its groups;
 * `div>span` a badge, `span[aria-hidden]` its icon, `span>span+span` its
 * words, `span svg` the icon's drawing; `>button` the pause control.
 */
const FRIEZE = [
  '[&>div]:gap-0! [&>div]:border-y [&>div]:border-gold/40',
  '[&>div>div]:py-2! [&>div>div+div]:border-t [&>div>div+div]:border-rule/60',
  '[&_div>span]:h-9! [&_div>span]:gap-3! max-[359.98px]:[&_div>span]:gap-2.5! [&_div>span]:border-0! [&_div>span]:bg-transparent! [&_div>span]:pl-0! [&_div>span]:pr-7! [&_div>span]:shadow-none! [&_div>span]:backdrop-blur-none!',
  '[&>button]:rounded-[2px]! [&>button]:text-gold! [&>button]:ring-1! [&>button]:ring-inset [&>button]:ring-gold/55',
].join(' ')

/** The seal: a disc of the wash, a gold rim, a fine gold ring just inside it (an outline drawn inward), and the laurel in gold. */
const FRIEZE_SEAL = [
  '[&_span[aria-hidden]]:size-[34px]! max-[359.98px]:[&_span[aria-hidden]]:size-[30px]! [&_span[aria-hidden]]:rounded-full! [&_span[aria-hidden]]:bg-wash!',
  '[&_span[aria-hidden]]:border [&_span[aria-hidden]]:border-gold/85 [&_span[aria-hidden]]:outline [&_span[aria-hidden]]:-outline-offset-4 [&_span[aria-hidden]]:outline-gold/30',
  '[&_span_svg]:size-[23px]! max-[359.98px]:[&_span_svg]:size-5!',
].join(' ')

/** The inscription: Cinzel, in the module's ink (marble, below). */
const FRIEZE_WORDS = [
  '[&_span>span+span]:font-roman [&_span>span+span]:font-medium [&_span>span+span]:tracking-[0.05em] max-[359.98px]:[&_span>span+span]:tracking-[0.03em]',
  '[&_span>span+span]:text-[12px] min-[360px]:[&_span>span+span]:text-[13px] lg:[&_span>span+span]:text-[15px]',
].join(' ')

/**
 * One column in both (the module keeps a second for its control, and the
 * gap before it, even when there is no control). Moving, the pause control
 * drops under the rows, at the column's right edge, so the rows can run
 * the full width, on a band of the wash that fades out at either side.
 */
const FRIEZE_MOVING = [
  'grid-cols-1! [&>button]:mr-4 [&>button]:justify-self-end md:[&>button]:mr-[max(3rem,calc((100%_-_1280px)/2_+_3rem))]',
  '[&>div]:bg-linear-to-r [&>div]:from-transparent [&>div]:via-wash/40 [&>div]:to-transparent',
].join(' ')

/**
 * Still, the rows are the column's own width (no inset, no band), and the
 * last seal of a row, and its group, keep no trailing space, so nothing can
 * scroll sideways.
 */
const FRIEZE_STILL = 'grid-cols-1! [&>div>div]:px-0! [&>div>div>div>div]:pr-0! [&_div>span:last-child]:pr-0!'

/**
 * Two to a row, still: the second seal of each row on one line down the
 * middle (the module's 10px gap between the halves, and no trailing space
 * on any seal, so the longest pair fits two halves of a 768px column).
 */
const FRIEZE_TWO_UP =
  '[&>div>div>div]:w-full! [&>div>div>div>div]:w-full! [&>div>div>div>div]:grid! [&>div>div>div>div]:grid-cols-2! [&>div>div>div>div>span]:pr-0!'

function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>('wide')
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const small = window.matchMedia('(max-width: 600px)')
    const belowMd = window.matchMedia('(max-width: 767.98px)')
    const update = () =>
      setLayout(
        reduce.matches
          ? belowMd.matches
            ? small.matches
              ? 'stillNarrow'
              : 'stillMid'
            : 'stillWide'
          : small.matches
            ? 'narrow'
            : 'wide',
      )
    update()
    for (const q of [reduce, small, belowMd]) q.addEventListener('change', update)
    return () => {
      for (const q of [reduce, small, belowMd]) q.removeEventListener('change', update)
    }
  }, [])
  return layout
}

/**
 * Act IV: his Trailhead rank first, its crowning honour (rank-honour.tsx),
 * then the eight Salesforce certifications, newest first. From xl the rank
 * stands beside the act's header (narrower, the header's longest word would
 * not fit beside it); below that, between the header and the frieze.
 */
export function Credentials() {
  const layout = useLayout()
  const { stacks } = LAYOUTS[layout]
  const still = layout.startsWith('still')
  const newest = CERTIFICATIONS[0]
  const oldest = CERTIFICATIONS[CERTIFICATIONS.length - 1]

  // Always mounted, off screen too: the seals are the only place the eight
  // certifications are written out, so screen readers, find-in-page and the
  // Tab order all need them there. Its frame loop costs two transform writes
  // a frame.
  const marquee = (
    <ToolchainMarquee
      role="group"
      aria-label="Salesforce certifications"
      stacks={stacks.map((s) => [...s])}
      rows={stacks.length}
      // The module moves a row by its own width in `duration` seconds, so the
      // one long row takes longer, to run at the pace the rows of two do
      // (about 20-30px a second, slow enough to read).
      duration={layout === 'wide' ? 90 : 34}
      showControl
      className={cn(FRIEZE, FRIEZE_SEAL, FRIEZE_WORDS, still ? FRIEZE_STILL : FRIEZE_MOVING, layout === 'stillWide' && FRIEZE_TWO_UP)}
    />
  )

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
      {/* The module's own inks, re-pointed at the Stage's: marble words, a
          dark surface of the wash (the pause control's fill) and the gold focus
          ring. (Its --muted only inks the control, which FRIEZE inks gold.) */}
      <div
        className="mt-10 md:mt-14"
        style={
          {
            '--text': 'var(--foreground)',
            '--surface': 'color-mix(in oklab, var(--stage-wash) 45%, var(--background))',
            '--focus-ring': 'var(--stage-gold)',
          } as React.CSSProperties
        }
      >
        {still ? (
          <Container>
            <div className={RESERVE}>{marquee}</div>
          </Container>
        ) : (
          <div className={RESERVE}>{marquee}</div>
        )}
      </div>
    </section>
  )
}
