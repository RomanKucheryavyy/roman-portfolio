'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'

export const SECTIONS = [
  { id: 'work', label: 'Work', mobile: true },
  { id: 'products', label: 'Products', mobile: true },
  { id: 'experience', label: 'Experience', mobile: false },
  { id: 'credentials', label: 'Credentials', mobile: false },
  { id: 'contact', label: 'Contact', mobile: true },
] as const

/**
 * A fixed bar that is clear over the curtain and takes a dark glass once the
 * page moves. `data-site-nav-*` is Lifeline's own hook for lining its rail
 * up with the host page's chrome.
 */
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
      <div data-site-nav-inner className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 md:h-16 md:px-12">
        <a data-site-nav-logo href="#top" className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
          {PERSON.name}
        </a>
        <nav aria-label="Sections" className="flex items-center gap-4 md:gap-7">
          <ul className="flex items-center gap-4 text-[13px] text-muted-foreground md:gap-7 md:text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id} className={s.mobile ? undefined : 'hidden md:block'}>
                <a href={`#${s.id}`} className="transition-colors hover:text-foreground">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:${PERSON.links.email}`}
            className="hidden text-sm text-foreground transition-colors hover:text-[var(--stage-accent-ink)] lg:inline"
          >
            {PERSON.links.email}
          </a>
          <a
            href={`mailto:${PERSON.links.email}`}
            aria-label={`Email ${PERSON.links.email}`}
            className="-mr-2 grid size-9 place-items-center rounded-full text-foreground lg:hidden"
          >
            <Mail className="size-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  )
}
