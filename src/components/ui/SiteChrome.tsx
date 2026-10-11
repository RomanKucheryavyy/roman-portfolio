'use client'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import Cursor from '@/components/ui/Cursor'
import Nav from '@/components/ui/Nav'
import { PILL_OUTLINE } from '@/components/ui/pill'
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
 * None of it uses framer-motion, so it adds none to any route's first load:
 * the nav's motion is CSS, and the phone menu (which does use framer-motion,
 * under its own MotionConfig reducedMotion="user") is fetched on demand.
 */
export default function SiteChrome() {
  const pathname = usePathname()
  const cursor = !pathname.startsWith('/resume')
  return (
    <>
      <div className="noise-overlay" aria-hidden="true" />
      {cursor && <Cursor />}
      <Nav />
    </>
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

/**
 * The footer's copy-email control, fetched after hydration. A copy button
 * does nothing without scripts, and CopyButton brings tailwind-merge (about
 * 28 KB) with it, which routes like the 404 and /resume would otherwise load
 * for this one pill. Until it arrives an invisible pill of the same size
 * holds its place, so nothing moves.
 */
export const FooterCopyButton = dynamic(() => import('@/components/ui/CopyButton'), {
  ssr: false,
  loading: () => (
    <span className={`${PILL_OUTLINE} invisible`} aria-hidden="true">
      <span className="h-3.5 w-3.5" />
      Copy email
    </span>
  ),
})
