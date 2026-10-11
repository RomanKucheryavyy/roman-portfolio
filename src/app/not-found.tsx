import type { Metadata } from 'next'
import { PageHeader } from '@/app/_components/PageHeader'
import { Button } from '@/components/ui/Button'
import { SectionShell } from '@/components/ui/SectionShell'
import { ROUTES } from '@/lib/routes'
import { keyOf, nextKeyOf } from '@/lib/score'
import { fullTitle } from '@/lib/seo'

/**
 * The 404, in the site's voice. Next's built-in one injected an unlayered
 * `body { background: #fff }` and a second <title>, and offered no way back.
 *
 * Structure from Not Found 404 (21st.dev 21523, mohammadshehadeh): a mono
 * eyebrow, a display headline, one sentence, a row of ways out. Built here on
 * SectionShell, the page header and Button's outline pill, with none of its
 * own type or palette. role="alert" is borrowed from 36194.
 */
export const metadata: Metadata = {
  // Absolute, so the tab reads the same with or without the layout's template.
  title: { absolute: fullTitle('Not found') },
  // Next adds <meta name="robots" content="noindex"> to every 404 itself;
  // null drops the layout's "index, follow" so that one is the only robots tag.
  robots: null,
  // No canonical: the layout's would point a missing page at the home page.
  alternates: {},
}

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="relative w-full bg-black outline-none">
      <SectionShell className="flex min-h-svh items-center">
        <PageHeader
          kicker="// 404. Not found"
          accent="Tacet."
          keys={[keyOf('compose'), nextKeyOf('compose')]}
        >
          <p role="alert" className="mt-4 max-w-lg text-body text-ink-meta">
            Nothing is written for this address. The page moved, or the link has a typo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" href={ROUTES.home}>
              <span aria-hidden="true">←</span> Back to the top
            </Button>
            <Button variant="outline" href={ROUTES.works}>
              The setlist
            </Button>
            <Button variant="outline" href={`${ROUTES.home}#compose`}>
              Let’s compose
            </Button>
          </div>
        </PageHeader>
      </SectionShell>
    </main>
  )
}
