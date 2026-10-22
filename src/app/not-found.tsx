import type { Metadata } from 'next'
import { buttonVariants } from '@/components/ui/button'
import { DISPLAY, INTRO, KICKER, STAGE_FOCUS, STAGE_STYLE } from '@/components/stage/look'
import { SITE } from '@/lib/constants'
import { fullTitle } from '@/lib/seo'
import { cn } from '@/lib/utils'

const TITLE = fullTitle('Not found')
/** The page's one sentence, which is also its description and its share text. */
const LINE = 'Nothing is written for this address. The page moved, or the link has a typo.'

/**
 * The 404 in the Stage's look: its black, its violet, its header type and
 * the hero's two pill buttons (shadcn's Button, as buttonVariants on plain
 * links). Next's built-in one injected an unlayered `body { background: #fff }`
 * and a second <title>, and offered no way back.
 *
 * Every route's tree carries the root 404, so it is a server component with
 * no client code of its own: buttonVariants runs here, on the server, and only
 * its class string reaches the page.
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

const PILL = 'h-11 rounded-full px-6'

/** Home first, solid; then the two places a visitor most likely came for, as the hero offers them. */
const WAYS_OUT = [
  { href: '/', label: 'Back to the home page', variant: 'default' },
  { href: '/#work', label: 'See the work', variant: 'outline' },
  { href: '/#contact', label: 'Get in touch', variant: 'outline' },
] as const

export default function NotFound() {
  return (
    <div className={cn('relative min-h-svh bg-background text-foreground', STAGE_FOCUS)} style={STAGE_STYLE}>
      {/* His name where the Stage's top bar draws it, as the way home it is there. */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center px-4 md:h-16 md:px-12">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load, as below */}
          <a href="/" className="rounded-sm text-sm font-semibold tracking-tight text-foreground">
            {SITE.name}
          </a>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex min-h-svh items-center outline-none">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-12">
          <p className={KICKER}>
            <span className="text-[var(--stage-accent-ink)]">404</span>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            Not found
          </p>
          <h1 className={`mt-5 max-w-3xl ${DISPLAY}`}>This page is not on the programme.</h1>
          <p role="alert" className={`mt-6 ${INTRO}`}>
            {LINE}
          </p>
          <div className="mt-9 flex flex-wrap gap-3 md:mt-11">
            {WAYS_OUT.map(({ href, label, variant }) => (
              // Plain links: a full load of the home page, and no client
              // router for a page that only leads away.
              <a key={href} href={href} className={cn(buttonVariants({ size: 'lg', variant }), PILL)}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
