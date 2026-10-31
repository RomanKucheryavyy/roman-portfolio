'use client'

import { DISPLAY, HAIRLINE, INTRO, KICKER, STAGE_FOCUS, STAGE_STYLE, WASH, stageButton } from '@/components/stage/look'
import { cn } from '@/lib/utils'

/**
 * What a page shows when something inside it throws: the Stage's ground,
 * its gold and Roman type (their variables are on <html>, from the root
 * layout) and its two buttons (stageButton), instead of Next's white "This
 * page couldn't load". The root layout stays; global-error.tsx covers a
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
    <div className={cn('relative min-h-svh overflow-hidden bg-background text-foreground', STAGE_FOCUS)} style={STAGE_STYLE}>
      <div aria-hidden="true" className={WASH} />
      <main id="main" tabIndex={-1} className="relative flex min-h-svh items-center outline-none">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-12">
          <p className="flex items-center gap-4 md:gap-5">
            <span className={cn(KICKER, 'text-[var(--stage-accent-ink)]')}>Error</span>
            <span aria-hidden="true" className={HAIRLINE} />
            <span className="sr-only">, </span>
            <span className={KICKER}>Something broke</span>
          </p>
          <h1 className={`mt-6 max-w-4xl ${DISPLAY}`}>This part of the page failed to load.</h1>
          <p role="alert" className={`mt-5 ${INTRO}`}>
            Try it again, or head back to the home page.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 md:mt-12 md:gap-4">
            <button type="button" className={stageButton('primary')} onClick={() => (retry ?? reset)()}>
              Try again
            </button>
            {/* A full load on purpose, see above. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={stageButton('secondary')}>
              Back to the home page
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
