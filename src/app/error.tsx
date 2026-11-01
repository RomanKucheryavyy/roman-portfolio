'use client'

import { DISPLAY, INTRO, KICKER, STAGE_FOCUS, STAGE_STYLE, WASH, stageButton, stageLink } from '@/components/stage/look'
import { cn } from '@/lib/utils'

/**
 * What a page shows when something inside it throws: the Stage's ground,
 * its gold and Roman type (their variables are on <html>, from the root
 * layout), its one button (stageButton) and a text link (stageLink),
 * instead of Next's white "This
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
          {/* The kicker's two words, set apart by the page's one divider. */}
          <p className={KICKER}>
            <span className="text-gold">Error</span>
            <span aria-hidden="true" className="mx-3 text-gold">
              ·
            </span>
            <span className="sr-only">, </span>
            Something broke
          </p>
          <h1 className={`mt-6 max-w-4xl ${DISPLAY}`}>This part of the page failed to load.</h1>
          <p role="alert" className={`mt-5 ${INTRO}`}>
            Try it again, or head back to the home page.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 md:mt-12">
            <button type="button" className={stageButton('primary')} onClick={() => (retry ?? reset)()}>
              Try again
            </button>
            {/* A full load on purpose, see above. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={stageLink()}>
              Back to the home page
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
