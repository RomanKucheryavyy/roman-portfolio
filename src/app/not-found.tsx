import type { Metadata } from 'next'
import { DISPLAY, HAIRLINE, INTRO, KICKER, NUMERAL, STAGE_FOCUS, STAGE_STYLE, WASH, stageButton } from '@/components/stage/look'
import { SITE } from '@/lib/constants'
import { fullTitle } from '@/lib/seo'
import { cn } from '@/lib/utils'

const TITLE = fullTitle('Not found')
/** The page's one sentence, which is also its description and its share text. */
const LINE = 'Nothing is written for this address. The page moved, or the link has a typo.'

/**
 * The 404 in the Stage's look: its ground and the wash's light, the gold, the
 * Roman type (its variables are on <html>, from the root layout), its
 * section header's shape (a gold numeral, a hairline, the kicker) and the
 * hero's buttons (stageButton on plain links). Next's built-in one injected
 * an unlayered `body { background: #fff }` and a second <title>, and offered
 * no way back.
 *
 * Every route's tree carries the root 404, so it is a server component with
 * no client code of its own: only class strings reach the page.
 */
export const metadata: Metadata = {
  // Absolute, so the tab reads the same with or without the layout's template.
  title: { absolute: TITLE },
  description: LINE,
  // Next adds <meta name="robots" content="noindex"> to every 404 itself;
  // null drops any inherited robots tag so that one is the only one.
  robots: null,
  // No canonical: the layout's would point a missing page at the home page.
  alternates: {},
  // Its own share titles, and no og:url: the layout's would call it the home page.
  openGraph: { siteName: SITE.name, locale: 'en_US', type: 'website', title: TITLE, description: LINE },
  twitter: { card: 'summary_large_image', title: TITLE, description: LINE },
}

/** Home first, solid; then the two places a visitor most likely came for, as the hero offers them. */
const WAYS_OUT = [
  { href: '/', label: 'Back to the home page', kind: 'primary' },
  { href: '/#work', label: 'See the work', kind: 'secondary' },
  { href: '/#contact', label: 'Get in touch', kind: 'secondary' },
] as const

export default function NotFound() {
  return (
    <div className={cn('relative min-h-svh overflow-hidden bg-background text-foreground', STAGE_FOCUS)} style={STAGE_STYLE}>
      <div aria-hidden="true" className={WASH} />
      {/* His name where the Stage's top bar draws it, in its Cinzel, as the way home it is there. */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center px-4 md:h-16 md:px-12">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load, as below */}
          <a href="/" className="rounded-sm font-roman text-[15px] font-semibold tracking-[0.06em] text-foreground md:text-base">
            {SITE.name}
          </a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="relative flex min-h-svh items-center outline-none">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-12">
          <p className="flex items-center gap-4 md:gap-5">
            <span className={NUMERAL}>404</span>
            <span aria-hidden="true" className={HAIRLINE} />
            <span className="sr-only">, </span>
            <span className={KICKER}>Not found</span>
          </p>
          <h1 className={`mt-6 max-w-4xl ${DISPLAY}`}>This page is not on the programme.</h1>
          <p role="alert" className={`mt-5 ${INTRO}`}>
            {LINE}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 md:mt-12 md:gap-4">
            {WAYS_OUT.map(({ href, label, kind }) => (
              // Plain links: a full load of the home page, and no client
              // router for a page that only leads away.
              <a key={href} href={href} className={stageButton(kind)}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
