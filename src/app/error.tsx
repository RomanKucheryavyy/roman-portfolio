'use client'

import { PageHeader } from '@/app/_components/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionShell } from '@/components/ui/SectionShell'
import { ROUTES } from '@/lib/routes'
import { keyOf, nextKeyOf } from '@/lib/score'

/**
 * What a page shows when something inside it throws: the site's black page
 * and a way on, instead of Next's white "This page couldn't load". The root
 * layout (nav, footer) stays; global-error.tsx covers a throw in the layout.
 *
 * React already reports the error to the console, so nothing is logged here.
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
      <SectionShell className="flex min-h-svh items-center">
        <PageHeader kicker="// error" lead="Something" accent="broke." keys={[keyOf('compose'), nextKeyOf('compose')]}>
          <p role="alert" className="mt-4 max-w-lg text-body text-ink-meta">
            This part of the page failed to load. Try it again, or head back to the top.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => (retry ?? reset)()}>
              Try again
            </Button>
            <Button variant="outline" href={ROUTES.home}>
              <span aria-hidden="true">←</span> Back to the top
            </Button>
          </div>
        </PageHeader>
      </SectionShell>
    </main>
  )
}
