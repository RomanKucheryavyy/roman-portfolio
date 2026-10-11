'use client'

import { PageHeader } from '@/app/_components/PageHeader'
import { PageShell } from '@/app/_components/PageShell'
import { PILL_OUTLINE } from '@/components/ui/pill'
import { keyOf, nextKeyOf } from '@/lib/score'

/**
 * What a page shows when something inside it throws: the site's black page
 * and a way on, instead of Next's white "This page couldn't load". The root
 * layout (nav, footer) stays; global-error.tsx covers a throw in the layout.
 *
 * React already reports the error to the console, so nothing is logged here.
 * This boundary loads on every route, so it uses PageShell and PILL_OUTLINE
 * directly (SectionShell would bring GSAP, Button tailwind-merge and
 * next/link), and its way home is a plain "/" rather than ROUTES.home:
 * routes.ts imports constants.ts, which would carry every card's copy into
 * every route. A full load is also the surest way out of a broken page.
 */
export default function ErrorPage({
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  /** Re-fetches and re-renders the segment (stable since Next 16.3). */
  retry?: () => void
  /** Re-renders without re-fetching; the fallback where retry is missing. */
  reset: () => void
}) {
  return (
    <main id="main" tabIndex={-1} className="relative w-full bg-black outline-none">
      <PageShell className="flex min-h-svh items-center">
        <PageHeader kicker="// error" lead="Something" accent="broke." keys={[keyOf('compose'), nextKeyOf('compose')]}>
          <p role="alert" className="mt-4 max-w-lg text-body text-ink-meta">
            This part of the page failed to load. Try it again, or head back to the top.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => (retry ?? reset)()} className={`${PILL_OUTLINE} cursor-pointer`}>
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load on purpose, see above */}
            <a href="/" className={PILL_OUTLINE}>
              <span aria-hidden="true">←</span> Back to the top
            </a>
          </div>
        </PageHeader>
      </PageShell>
    </main>
  )
}
