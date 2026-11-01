'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'

/**
 * Every section, in page order. `from` is the narrowest width that shows it
 * in the top bar (the footer always lists all of them).
 */
export const SECTIONS = [
  { id: 'work', label: 'Work', from: 'base' },
  { id: 'products', label: 'Products', from: 'xs' },
  { id: 'experience', label: 'Experience', from: 'md' },
  { id: 'credentials', label: 'Credentials', from: 'md' },
  { id: 'about', label: 'About', from: 'lg' },
  { id: 'contact', label: 'Contact', from: 'base' },
] as const

const SHOW = {
  base: undefined,
  // Below 375px the bar holds the name, Work, Contact and the mail icon.
  xs: 'max-[374px]:hidden',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
} as const

/** One focus ring for the bar: the page's gold, clear of the text. */
const RING =
  'rounded-sm focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-gold'

/**
 * A gold hairline under a section's link, drawn from the left on hover and
 * held under the section on screen. (The ::after pads the tap target.)
 */
const MARK =
  'before:absolute before:inset-x-0 before:-bottom-1.5 before:h-px before:origin-left before:scale-x-0 before:bg-gold before:transition-transform before:duration-300 hover:before:scale-x-100 [&[aria-current]]:text-foreground [&[aria-current]]:before:scale-x-100'

/** The section under the middle of the screen, if any. */
function useCurrentSection(): string | null {
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => {
    const seen = new Map<string, boolean>()
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        setCurrent(SECTIONS.find((s) => seen.get(s.id))?.id ?? null)
      },
      // A line just below the middle of the screen: the section across it is the one being read.
      { rootMargin: '-55% 0px -44% 0px' },
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) watch.observe(el)
    }
    return () => watch.disconnect()
  }, [])
  return current
}

/**
 * A fixed bar that is clear over the curtain and takes the ground's glass
 * once the page moves, with a soft shadow under it rather than a line.
 */
export function TopBar() {
  const [scrolled, setScrolled] = useState(false)
  const current = useCurrentSection()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500',
        scrolled
          ? 'bg-background/78 shadow-[0_12px_32px_-14px_color-mix(in_oklab,var(--stage-shadow)_85%,transparent)] backdrop-blur-md'
          : 'bg-transparent',
      )}
    >
      {/* The skip link sits in the root layout (it serves every route), drawn
          where this bar's own used to be: over its top-left corner. */}
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 md:h-16 md:gap-4 md:px-12">
        {/* His name in the intro's Cinzel (its lowercase draws as small
            capitals); on phones, where the name and the links can't share
            the bar, the intro's monogram stands for it, as a logo would. */}
        <a
          href="#top"
          className={cn(
            'shrink-0 font-roman text-[15px] font-semibold tracking-[0.08em] text-foreground transition-colors hover:text-glow sm:text-sm sm:tracking-[0.06em] md:text-base',
            RING,
          )}
        >
          {/* On phones the name says what is shown first (WCAG 2.5.3, label
              in name): "RK, Roman Kucheryavyy"; the dot is ornament. */}
          <span className="sm:hidden">
            R<span aria-hidden="true" className="text-gold">·</span>K<span className="sr-only">, </span>
          </span>
          <span className="max-sm:sr-only">{PERSON.name}</span>
        </a>
        {/* The links in the intro's own nav type (Geist capitals at 12px,
            the page's floor: from xl at 0.16em, below it a little closer, so
            five links and the mail icon fit a 768px bar and six and the
            address a 1024px one), so the bar keeps its face when the intro
            lifts. */}
        <nav aria-label="Sections" className="flex items-center gap-3 md:gap-4 xl:gap-7">
          <ul className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground lg:gap-4 xl:gap-7 xl:tracking-[0.16em]">
            {SECTIONS.map((s) => (
              <li key={s.id} className={SHOW[s.from]}>
                <a
                  href={`#${s.id}`}
                  aria-current={current === s.id ? 'location' : undefined}
                  className={cn(
                    'relative block transition-colors after:absolute after:inset-x-0 after:-inset-y-3.5 hover:text-foreground',
                    MARK,
                    RING,
                  )}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${PERSON.links.email}`}
            className={cn('hidden text-sm text-foreground transition-colors hover:text-gold lg:inline', RING)}
          >
            {PERSON.links.email}
          </a>
          <a
            href={`mailto:${PERSON.links.email}`}
            aria-label={`Email ${PERSON.links.email}`}
            className={cn(
              '-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:text-gold lg:hidden',
              RING,
              'rounded-full',
            )}
          >
            <Mail className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
