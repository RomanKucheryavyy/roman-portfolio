import type { AriaRole, ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from 'react'
import { keyColor, type SpectrumKey } from '@/lib/score'

/*
 * The column and the header every block of the site is drawn in: the home
 * page's movements and the pages outside it (/colophon, program notes, the
 * 404, the error boundary).
 *
 * Nothing here runs on the client by itself (no 'use client', no hooks), so a
 * server page renders it with no JavaScript at all, and a client module that
 * imports it adds only these few lines. The heading that assembles from
 * scattered letters, which does need the client (ScatterText, GSAP), is
 * SectionHeader.tsx, built on HeaderFrame below. Before W12 the pages outside
 * home carried their own copies of these class strings (PageShell,
 * PageHeader in src/app/_components) because this file was a client module
 * that pulled GSAP into whatever imported it; the copies are gone.
 *
 * Classes are joined, not merged with tailwind-merge: the error boundary
 * renders this on every route, and tailwind-merge (about 28 KB) would ride
 * along. No caller overrides a class here, it only adds: a caller's pt-* still
 * wins over py-*, because Tailwind emits padding-top after padding-block.
 */
const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ')

interface SectionShellProps extends ComponentPropsWithoutRef<'section'> {
  /** Lands on the <section> itself: every reveal and ScrollTrigger keys off it. */
  ref?: Ref<HTMLElement>
  innerClassName?: string
}

/**
 * The one padding, container and inset every section below the hero sits in.
 *
 * The sections used to declare these from scratch and drifted: py-14 against
 * py-16, max-w-6xl against max-w-4xl against no container at all, so headings
 * sat on four different left edges down the page. The stepped `px-6 md:px-16`
 * they shared also made the column 79px narrower when the window grew by one
 * pixel past 767. The clamp keeps both ends (24px on a phone, 64px from 1280)
 * and is monotonic in between.
 *
 * scroll-mt-8 below md keeps a jump to the section (the phone menu, a
 * /#section deep link) from parking its kicker under the fixed nav: py-14
 * alone puts the kicker 6px under a 62px nav, and 32px of margin clears it by
 * 26px, the gap desktop already has. From md up the nav is 61-70px tall and
 * py-24 puts the kicker at 96px, so no margin is added; one would only push
 * the Symphony deck down past the fold. Lenis doesn't read scroll-margin, so
 * a Lenis jump passes its own offset.
 *
 * Named SectionShell, not Section: the résumé builder declares its own Section.
 */
export function SectionShell({ ref, className, innerClassName, children, ...props }: SectionShellProps) {
  return (
    <section
      ref={ref}
      className={join('relative z-10 scroll-mt-8 md:scroll-mt-0 py-14 md:py-24 px-[clamp(1.5rem,5vw,4rem)]', className)}
      {...props}
    >
      <div className={join('relative mx-auto w-full max-w-6xl', innerClassName)}>{children}</div>
    </section>
  )
}

/** The two keys a heading's accent runs between, for `.text-key`. */
export function keyStyle(from: SpectrumKey, to: SpectrumKey): CSSProperties {
  return { '--key-from': keyColor(from), '--key-to': keyColor(to) } as CSSProperties
}

/**
 * A heading's accent word: drawn in `keys[0]` running into `keys[1]` (a
 * static gradient, the movement's key into the next one's), or, with no keys,
 * in the animated brand gradient.
 */
export function Accent({ keys, children }: { keys?: readonly [SpectrumKey, SpectrumKey]; children: ReactNode }) {
  return keys ? (
    <span className="text-key" style={keyStyle(keys[0], keys[1])}>
      {children}
    </span>
  ) : (
    <span className="text-gradient">{children}</span>
  )
}

export interface HeaderFrameProps {
  /** h2 for a movement of the home page, h1 for the top of any other page. */
  as?: 'h1' | 'h2'
  /** The mono line above the heading: `// 01. Credentials`, `// colophon`. */
  kicker: string
  heading: ReactNode
  /** The paragraph under the heading. */
  intro?: ReactNode
  /** The intro's role: `alert` where it is the page's message (the 404, the error page). */
  introRole?: AriaRole
  /** Marks the kicker and the intro for the section's scroll reveal (useRevealOnScroll). */
  reveal?: boolean
  /** Anything that belongs to the header after the intro, like a link. */
  children?: ReactNode
  className?: string
}

/**
 * The header contract: the kicker, the heading and the intro, with one set of
 * type, ink and gaps, whichever page it tops. SectionHeader (the movements'
 * assembling h2) and PageHeader (a route's static h1) are both this frame.
 */
export function HeaderFrame({
  as: Heading = 'h2',
  kicker,
  heading,
  intro,
  introRole,
  reveal = false,
  children,
  className,
}: HeaderFrameProps) {
  const revealed = reveal ? { 'data-reveal': '' } : {}
  return (
    <header className={join('mb-10 md:mb-16', className)}>
      <p {...revealed} className="section-label mb-3 font-mono text-label uppercase tracking-[0.3em] text-ink-meta">
        {kicker}
      </p>
      <Heading className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">{heading}</Heading>
      {intro ? (
        <p {...revealed} role={introRole} className="mt-4 max-w-lg text-body text-ink-meta">
          {intro}
        </p>
      ) : null}
      {children}
    </header>
  )
}

/**
 * The top of a page that is not the home page: the header contract with an
 * h1 that is in the server HTML as it reads (crawlers, link unfurls, a visitor
 * with scripts off), where a movement's h2 assembles on the client.
 */
export function PageHeader({
  kicker,
  lead,
  accent,
  keys,
  intro,
  introRole,
  children,
}: {
  /** The line above the heading: `// program notes`. */
  kicker: string
  /** Words before the accent, in white. */
  lead?: string
  /** The accent, drawn in `keys[0]` running into `keys[1]`. */
  accent: string
  keys: readonly [SpectrumKey, SpectrumKey]
  intro?: ReactNode
  introRole?: AriaRole
  children?: ReactNode
}) {
  return (
    <HeaderFrame
      as="h1"
      kicker={kicker}
      heading={
        <>
          {lead ? `${lead} ` : null}
          <Accent keys={keys}>{accent}</Accent>
        </>
      }
      intro={intro}
      introRole={introRole}
    >
      {children}
    </HeaderFrame>
  )
}
