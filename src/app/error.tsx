'use client'

import { Button } from '@/components/ui/button'
import { DISPLAY, INTRO, KICKER, STAGE_FOCUS, STAGE_STYLE } from '@/components/stage/look'
import { cn } from '@/lib/utils'

/**
 * What a page shows when something inside it throws: the Stage's black page,
 * its type and its two pill buttons (shadcn's Button), instead of Next's white
 * "This page couldn't load". The root layout stays; global-error.tsx covers a
 * throw in the layout itself.
 *
 * React already reports the error to the console, so nothing is logged here.
 * The way home is a plain "/": a full load is the surest way out of a broken
 * page, and the boundary imports nothing that carries the site's content.
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
    <div className={cn('min-h-svh bg-background text-foreground', STAGE_FOCUS)} style={STAGE_STYLE}>
      <main id="main" tabIndex={-1} className="flex min-h-svh items-center outline-none">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-12">
          <p className={KICKER}>
            <span className="text-[var(--stage-accent-ink)]">Error</span>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            Something broke
          </p>
          <h1 className={`mt-5 max-w-3xl ${DISPLAY}`}>This part of the page failed to load.</h1>
          <p role="alert" className={`mt-6 ${INTRO}`}>
            Try it again, or head back to the home page.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 md:mt-11">
            <Button size="lg" className="h-11 rounded-full px-6" onClick={() => (retry ?? reset)()}>
              Try again
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
              {/* A full load on purpose, see above. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/">Back to the home page</a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
