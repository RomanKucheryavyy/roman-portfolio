import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WorksWheel } from '@/components/ui/works-wheel'
import WorkCard from '@/components/ui/WorkCard'
import { PILL_OUTLINE } from '@/components/ui/pill'
import { SITE } from '@/lib/constants'
import { notesHrefOf } from '@/lib/case-studies'
import { pageMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { CLIENT_WORK, LIVE_CLIENT_WORK, type Work } from '@/lib/work'

const TOTAL = CLIENT_WORK.length
const LIVE = LIVE_CLIENT_WORK.length

export const metadata = pageMetadata({
  path: '/works',
  title: 'The setlist',
  description: `${TOTAL} sites and apps · ${LIVE} live, ${TOTAL - LIVE} launching soon. Designed and built by ${SITE.name}.`,
  // The segment's own opengraph-image / twitter-image (the setlist card).
  // The default would name the site card and override them.
  images: false,
})

/** One entry of the setlist for search engines: what each piece is and where
 *  it lives. A site is a WebSite, the app a MobileApplication; a piece with no
 *  address yet says where it stands instead. No ratings, by rule. */
function itemOf(work: Work) {
  const base = { name: work.title, description: work.description }
  if (work.isApp) {
    return { '@type': 'MobileApplication', ...base, operatingSystem: 'iOS', ...(work.url ? { url: work.url } : {}) }
  }
  return work.url
    ? { '@type': 'WebSite', ...base, url: work.url }
    : { '@type': 'WebSite', ...base, ...(work.status ? { creativeWorkStatus: work.status } : {}) }
}

const SETLIST_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'The Setlist',
  url: `${SITE.url}/works`,
  numberOfItems: TOTAL,
  itemListElement: CLIENT_WORK.map((work, i) => ({ '@type': 'ListItem', position: i + 1, item: itemOf(work) })),
}

/**
 * The works index, on its own route rather than inside the one-page scroll.
 *
 * The wheel turns by capturing the scroll wheel, which is the whole interaction
 * and exactly right for a page that is only this — but dropped into the middle
 * of the long home page it would have hijacked nine notches of scroll from
 * anyone just passing through on their way to the contact form.
 *
 * Phones get a list instead. The ring has to fit the stage's *width*, so on a
 * 390px viewport its cards shrink to about 130px and the whole composition
 * falls apart around them — that is the geometry doing what it should, not a
 * bug to tune out. Hiding the wheel rather than rendering it small also parks
 * it for free: with `display:none` its stage measures zero, and the animation
 * loop returns before it starts.
 *
 * The way back is the site nav, which every route mounts; the page no longer
 * draws its own back link.
 */
export default function WorksPage() {
  return (
    <main id="main" tabIndex={-1} className="relative min-h-svh w-full bg-black outline-none md:h-svh md:overflow-hidden">
      <script
        type="application/ld+json"
        // `<` escaped so no description can close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SETLIST_LD).replace(/</g, '\\u003c') }}
      />

      {/* One h1 for the page: the phone list's visible heading, and from md up
          a screen-reader name for the wheel, whose own title is not a heading. */}
      <h1 className="px-6 pt-20 font-display text-4xl font-bold tracking-tight text-white md:sr-only">The Setlist</h1>

      {/* ── the wheel, from md up ───────────────────────────────────────────
          data-stage: a full-bleed stage, so the site footer stands aside.
          --wheel-top: the wheel measures and centres itself below the fixed
          site nav (its pill ends at 70px), so the ring's top card, the front
          piece on arrival, is no longer under the nav. The wheel still draws
          full bleed: the drum's neighbours run off the top of the window,
          under the nav, as they always ran off the frame. */}
      <div data-stage className="hidden h-full [--wheel-top:6rem] md:block">
        <WorksWheel items={CLIENT_WORK} label="The Setlist" />
        {/* Bottom-right, on the "Products" pill's line (its py-2 and 1px
            border), clear of the ring and the drum: centred, it sat on the
            ring's two bottom cards and on the drum's next card. */}
        <p className="pointer-events-none absolute right-[2.5%] bottom-[5%] z-10 border border-transparent py-2 text-right font-mono text-label tracking-wider text-ink-meta">
          scroll, drag or use <span aria-hidden="true">↑ ↓</span>
          <span className="sr-only">the arrow keys</span> to turn
        </p>
      </div>

      {/* ── the same setlist, as a list, on phones ──────────────────────────
          The same card the phone deck uses on the home page. The card body
          goes nowhere; its link pill is the only way off the site, as on
          every other surface. */}
      <div className="px-6 pb-8 md:hidden">
        <p className="mt-2 mb-8 font-mono text-label tracking-wider text-ink-meta">
          {`${TOTAL} pieces · ${LIVE} live, ${TOTAL - LIVE} launching soon`}
        </p>

        <ul className="space-y-4">
          {CLIENT_WORK.map((work, i) => (
            <li key={work.id}>
              <WorkCard
                work={work}
                index={i}
                total={TOTAL}
                size="md"
                layout="stacked"
                titleAs="h2"
                notesHref={notesHrefOf(work.id)}
                imageSizes="(max-width: 768px) 92vw, 1px"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* The products are the other half of the work, and they live on the home
          page: after the list on phones, bottom-left of the stage from md up. */}
      <Link
        href="/#compositions"
        className={cn(PILL_OUTLINE, 'mx-6 mb-16 md:absolute md:bottom-[5%] md:left-[2.5%] md:z-10 md:m-0')}
      >
        Products I build &amp; run
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </main>
  )
}
