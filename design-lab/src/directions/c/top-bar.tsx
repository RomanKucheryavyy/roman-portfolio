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

/** One focus ring for the bar: the page's violet ink, clear of the text. */
const RING =
  'rounded-sm focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-[var(--stage-accent-ink)]'

/** A fixed bar that is clear over the curtain and takes a dark glass once the page moves. */
export function TopBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500',
        scrolled ? 'border-white/10 bg-black/70 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <a
        href="#main"
        className="sr-only rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:absolute focus:px-4 focus:py-2 focus:left-4 focus:top-3 focus:z-10 focus:outline-2 focus:outline-solid focus:outline-offset-2 focus:outline-[var(--stage-accent-ink)]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 md:h-16 md:gap-4 md:px-12">
        <a href="#top" className={cn('shrink-0 text-sm font-semibold tracking-tight text-foreground', RING)}>
          {PERSON.name}
        </a>
        <nav aria-label="Sections" className="flex items-center gap-3 md:gap-7">
          <ul className="flex items-center gap-3 text-[13px] text-muted-foreground md:gap-7 md:text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id} className={SHOW[s.from]}>
                {/* The ::after pads the tap target to 44px tall without moving the layout or the focus ring. */}
                <a
                  href={`#${s.id}`}
                  className={cn('relative block transition-colors after:absolute after:inset-x-0 after:-inset-y-3.5 hover:text-foreground', RING)}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${PERSON.links.email}`}
            className={cn('hidden text-sm text-foreground transition-colors hover:text-[var(--stage-accent-ink)] lg:inline', RING)}
          >
            {PERSON.links.email}
          </a>
          <a
            href={`mailto:${PERSON.links.email}`}
            aria-label={`Email ${PERSON.links.email}`}
            className={cn('-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-foreground lg:hidden', RING, 'rounded-full')}
          >
            <Mail className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
