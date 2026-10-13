import type { Metadata } from 'next'
import { PageHeader, SectionShell } from '@/components/ui/SectionShell'
import { PILL_OUTLINE, TAP_PILL } from '@/components/ui/pill'
import { cn } from '@/lib/utils'
import { SITE } from '@/lib/constants'
import { ROUTES } from '@/lib/routes'
import { keyOf, nextKeyOf } from '@/lib/score'
import { fullTitle } from '@/lib/seo'

const TITLE = fullTitle('Not found')
/** The page's one sentence, which is also its description and its share text. */
const LINE = 'Nothing is written for this address. The page moved, or the link has a typo.'

/**
 * The 404, in the site's voice. Next's built-in one injected an unlayered
 * `body { background: #fff }` and a second <title>, and offered no way back.
 *
 * Structure from Not Found 404 (21st.dev 21523, mohammadshehadeh): a mono
 * eyebrow, a display headline, one sentence, a row of ways out. Built here on
 * the page shell, the page header and the outline pill, with none of its own
 * type or palette. role="alert" is borrowed from 36194.
 *
 * Every route's tree carries the root 404, so nothing here may pull client
 * JavaScript into every page: SectionShell and PageHeader are plain markup
 * (see SectionShell.tsx), and the links are PILL_OUTLINE on plain anchors
 * rather than Button (tailwind-merge and a
 * second copy of next/link's client code, about 29 KB on every route).
 */
export const metadata: Metadata = {
  // Absolute, so the tab reads the same with or without the layout's template.
  title: { absolute: TITLE },
  description: LINE,
  // Next adds <meta name="robots" content="noindex"> to every 404 itself;
  // null drops the layout's "index, follow" so that one is the only robots tag.
  robots: null,
  // No canonical: the layout's would point a missing page at the home page.
  alternates: {},
  // Its own share titles, and no og:url: the layout's would call it the home page.
  openGraph: { siteName: SITE.name, locale: 'en_US', type: 'website', title: TITLE, description: LINE },
  twitter: { card: 'summary_large_image', title: TITLE, description: LINE },
}

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="relative w-full bg-black outline-none">
      <SectionShell className="flex min-h-svh items-center">
        <PageHeader
          kicker="// 404. Not found"
          accent="Tacet."
          keys={[keyOf('compose'), nextKeyOf('compose')]}
          intro={LINE}
          introRole="alert"
        >
          <div className="mt-8 flex flex-wrap gap-3">
            {/* Plain links, not next/link: see above. */}
            <a href={ROUTES.home} className={cn(PILL_OUTLINE, TAP_PILL)}>
              <span aria-hidden="true">←</span> Back to the top
            </a>
            <a href={ROUTES.works} className={cn(PILL_OUTLINE, TAP_PILL)}>
              The setlist
            </a>
            <a href={`${ROUTES.home}#compose`} className={cn(PILL_OUTLINE, TAP_PILL)}>
              Let’s compose
            </a>
          </div>
        </PageHeader>
      </SectionShell>
    </main>
  )
}
