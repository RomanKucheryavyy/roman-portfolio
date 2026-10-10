import type { Metadata } from 'next'
import Link from 'next/link'
import { WorksWheel } from '@/components/ui/works-wheel'
import WorkCard from '@/components/ui/WorkCard'
import { SITE } from '@/lib/constants'
import { CLIENT_WORK } from '@/lib/work'

export const metadata: Metadata = {
  title: `The Setlist — ${SITE.name}`,
  description: 'Every shipped piece, on a wheel you turn.',
  alternates: { canonical: '/works' },
  openGraph: {
    title: `The Setlist — ${SITE.name}`,
    description: 'Every shipped piece, on a wheel you turn.',
    url: `${SITE.url}/works`,
    type: 'website',
  },
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
 */
export default function WorksPage() {
  return (
    <main className="relative min-h-svh w-full bg-black md:h-svh md:overflow-hidden">
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 font-mono text-label tracking-wider text-white/50 transition-colors hover:text-white md:top-[7.5%] md:left-[2.5%]"
      >
        ← Back to portfolio
      </Link>

      {/* ── the wheel, from md up ─────────────────────────────────────────── */}
      <div className="hidden h-full md:block">
        <WorksWheel items={CLIENT_WORK} label="The Setlist" />
        <p className="pointer-events-none absolute bottom-[5%] left-1/2 z-10 -translate-x-1/2 text-center font-mono text-label tracking-wider text-white/35">
          scroll, drag or use ↑ ↓ to turn
        </p>
      </div>

      {/* ── the same setlist, as a list, on phones ──────────────────────────
          The same card the phone deck uses on the home page. The card body
          goes nowhere; its link pill is the only way off the site, as on
          every other surface. */}
      <div className="px-6 pt-20 pb-16 md:hidden">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">The Setlist</h1>
        <p className="mt-2 mb-8 font-mono text-label tracking-wider text-white/50">
          {CLIENT_WORK.length} pieces
        </p>

        <ul className="space-y-4">
          {CLIENT_WORK.map((work, i) => (
            <li key={work.id}>
              <WorkCard
                work={work}
                index={i}
                total={CLIENT_WORK.length}
                size="md"
                layout="stacked"
                titleAs="h2"
                imageSizes="(max-width: 768px) 92vw, 1px"
              />
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
