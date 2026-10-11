'use client'
import { MotionConfig } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Cursor from '@/components/ui/Cursor'
import Nav from '@/components/ui/Nav'

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
