import type { ComponentPropsWithoutRef } from 'react'

/**
 * SectionShell's padding, inset and column for the pages outside the home
 * page, as a server component with no client JavaScript.
 *
 * SectionShell.tsx is a client module that also holds SectionHeader, which
 * pulls in ScatterText and GSAP. The 404 and the error boundary are part of
 * every route's tree, so importing it there put GSAP and ScrollTrigger into
 * the first load of every page on the site (+150 KB on /works). These pages
 * need the shell, not the animation.
 *
 * Classes are joined, not merged: the error boundary imports this on the
 * client, and tailwind-merge would ride along. A caller's pt-* still wins
 * over py-*, because Tailwind emits padding-top after padding-block.
 *
 * The classes must stay SectionShell's (tests/proof.spec.ts compares the
 * rendered column with the home page's). W12: once SectionHeader moves out
 * of SectionShell.tsx, this can become SectionShell itself.
 */
const join = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

export function PageShell({
  className,
  innerClassName,
  children,
  ...props
}: ComponentPropsWithoutRef<'section'> & { innerClassName?: string }) {
  return (
    <section
      className={join('relative z-10 scroll-mt-8 md:scroll-mt-0 py-14 md:py-24 px-[clamp(1.5rem,5vw,4rem)]', className)}
      {...props}
    >
      <div className={join('relative mx-auto w-full max-w-6xl', innerClassName)}>{children}</div>
    </section>
  )
}
