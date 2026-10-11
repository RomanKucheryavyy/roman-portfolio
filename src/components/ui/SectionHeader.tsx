'use client'
import { useState, type ReactNode } from 'react'
import ScatterText from '@/components/effects/ScatterText'
import { keyOf, kickerOf, nextKeyOf, type MovementId } from '@/lib/score'
import { Accent, HeaderFrame } from '@/components/ui/SectionShell'

type SectionHeaderKicker =
  | {
      /** Which movement this is, from score.ts. It names the kicker (`// 02. Work`). */
      movement: MovementId
      /** Overrides the movement's kicker. */
      kicker?: string
    }
  | {
      movement?: undefined
      /** The line above the heading, for a header outside the score. */
      kicker: string
    }

type SectionHeaderProps = SectionHeaderKicker & {
  /**
   * The heading is `{lead} {accent}`. With a movement, the accent word is drawn
   * in that movement's key running into the next one's; without, in the brand
   * gradient.
   */
  title: { lead: string; accent: string }
  /** The paragraph under the heading. */
  intro?: ReactNode
  /** Anything that belongs to the header after the intro, like a link. */
  children?: ReactNode
  className?: string
}

/**
 * A home-page movement's header: the header contract (HeaderFrame, in
 * SectionShell.tsx) with an h2 that assembles from scattered letters.
 *
 * Each section used to hand-write this, and to finish the heading by
 * rewriting its own innerHTML from a selector, so renaming a heading meant
 * renaming it in two places or the gradient word broke. The assembled state
 * is now just state.
 */
export function SectionHeader({ movement, kicker, title, intro, children, className }: SectionHeaderProps) {
  const [assembled, setAssembled] = useState(false)
  const label = kicker ?? (movement ? kickerOf(movement) : '')
  const keys = movement ? ([keyOf(movement), nextKeyOf(movement)] as const) : undefined
  return (
    <HeaderFrame
      reveal
      kicker={label}
      intro={intro}
      className={className}
      heading={
        assembled ? (
          <>
            {title.lead} <Accent keys={keys}>{title.accent}</Accent>
          </>
        ) : (
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => setAssembled(true)}
          >
            {`${title.lead} ${title.accent}`}
          </ScatterText>
        )
      }
    >
      {children}
    </HeaderFrame>
  )
}
