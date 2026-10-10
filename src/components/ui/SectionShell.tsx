'use client'
import { useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react'
import ScatterText from '@/components/effects/ScatterText'
import { cn } from '@/lib/utils'

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
 * Named SectionShell, not Section: resume/page.tsx declares its own Section.
 */
export function SectionShell({ ref, className, innerClassName, children, ...props }: SectionShellProps) {
  return (
    <section
      ref={ref}
      className={cn('relative z-10 py-14 md:py-24 px-[clamp(1.5rem,5vw,4rem)]', className)}
      {...props}
    >
      <div className={cn('relative mx-auto w-full max-w-6xl', innerClassName)}>{children}</div>
    </section>
  )
}

interface SectionHeaderProps {
  /** The "// 02. Projects & Work" line above the heading. */
  kicker: string
  /** The heading is `{lead} {accent}`, with the accent word in the brand gradient. */
  title: { lead: string; accent: string }
  /** The paragraph under the heading. */
  intro?: ReactNode
  /** Anything that belongs to the header after the intro, like a link. */
  children?: ReactNode
  className?: string
}

/**
 * The kicker, the assembling heading and the intro, with one set of gaps.
 *
 * Each section used to hand-write this, and to finish the heading by
 * rewriting its own innerHTML from a selector, so renaming a heading meant
 * renaming it in two places or the gradient word broke. The assembled state
 * is now just state.
 */
export function SectionHeader({ kicker, title, intro, children, className }: SectionHeaderProps) {
  const [assembled, setAssembled] = useState(false)
  const text = `${title.lead} ${title.accent}`
  return (
    <header className={cn('mb-10 md:mb-16', className)}>
      <p data-reveal className="section-label font-mono text-label tracking-[0.3em] uppercase text-white/30 mb-3">
        {kicker}
      </p>
      <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white">
        {assembled ? (
          <>
            {title.lead} <span className="text-gradient">{title.accent}</span>
          </>
        ) : (
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => setAssembled(true)}
          >
            {text}
          </ScatterText>
        )}
      </h2>
      {intro && (
        <p data-reveal className="mt-4 max-w-lg text-body text-white/40">
          {intro}
        </p>
      )}
      {children}
    </header>
  )
}
