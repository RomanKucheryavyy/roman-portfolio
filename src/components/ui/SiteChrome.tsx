'use client'
import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Cursor from '@/components/ui/Cursor'
import Nav from '@/components/ui/Nav'
import { useIsHydrated } from '@/hooks/useMediaQuery'
import { useStore } from '@/stores/useStore'

/**
 * What every route wears: the nav, the custom cursor and the film grain.
 *
 * They used to be mounted by the home page alone, so /works and /resume had
 * no navigation at all, just a hand-rolled "← Back to portfolio" link each,
 * and a visitor who landed on one from a shared link had no way to the rest
 * of the site. The résumé builder keeps the native pointer: it is a work
 * surface full of text fields, not a page to look at.
 *
 * MotionConfig makes every framer-motion animation under it honour
 * prefers-reduced-motion.
 */
export default function SiteChrome() {
  const pathname = usePathname()
  const cursor = !pathname.startsWith('/resume')
  return (
    <MotionConfig reducedMotion="user">
      <div className="noise-overlay" aria-hidden="true" />
      {cursor && <Cursor />}
      <Nav />
    </MotionConfig>
  )
}

/**
 * Holds the layout's own content (the footer) out of the tab order while the
 * home page's boot covers it, as the nav and main are: without it, Tab went
 * from the skip link straight to links the Loader was hiding. Only after
 * hydration, so the footer still works with scripts off.
 */
export function BootInert({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hydrated = useIsHydrated()
  const isLoaded = useStore((s) => s.isLoaded)
  const booting = hydrated && !isLoaded && pathname === '/'
  return <div inert={booting}>{children}</div>
}
