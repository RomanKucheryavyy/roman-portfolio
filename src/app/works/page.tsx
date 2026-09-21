import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WorksWheel, type WorksWheelItem } from '@/components/ui/works-wheel'
import { PROJECTS, SITE } from '@/lib/constants'

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

/** Not every piece is public — an unlaunched client site has no link to give,
 *  and the wheel renders those as a plain card with no "Visit" affordance. */
const WORKS: WorksWheelItem[] = PROJECTS.map((project) => ({
  title: project.title,
  image: project.image,
  ...('url' in project ? { href: project.url } : {}),
}))

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
        className="absolute top-6 left-6 z-20 font-mono text-[11px] tracking-wider text-white/30 transition-colors hover:text-white/70 md:top-[7.5%] md:left-[2.5%]"
      >
        ← Back to portfolio
      </Link>

      {/* ── the wheel, from md up ─────────────────────────────────────────── */}
      <div className="hidden h-full md:block">
        <WorksWheel items={WORKS} label="The Setlist" action="Visit" />
        <p className="pointer-events-none absolute bottom-[5%] left-1/2 z-10 -translate-x-1/2 text-center font-mono text-[10px] tracking-wider text-white/20">
          scroll, drag or use ↑ ↓ to turn
        </p>
      </div>

      {/* ── the same setlist, as a list, on phones ────────────────────────── */}
      <div className="px-6 pt-20 pb-16 md:hidden">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">The Setlist</h1>
        <p className="mt-2 mb-8 font-mono text-[11px] tracking-wider text-white/30">
          {PROJECTS.length} pieces
        </p>

        <ul className="space-y-4">
          {PROJECTS.map((project) => {
            const href = 'url' in project ? project.url : null
            const status = 'status' in project ? project.status : null
            const card = (
              <>
                <span className="relative block aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="88vw"
                    className="object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <span className="absolute right-0 bottom-0 left-0 flex items-end justify-between gap-3 p-4">
                    <span className="font-display text-xl font-black tracking-tight text-white">
                      {project.title}
                    </span>
                    {href ? (
                      <ArrowUpRight size={16} className="shrink-0 text-white/60" />
                    ) : (
                      <span className="shrink-0 font-mono text-[10px] text-white/45">{status}</span>
                    )}
                  </span>
                </span>
              </>
            )

            return (
              <li key={project.id}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  card
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
