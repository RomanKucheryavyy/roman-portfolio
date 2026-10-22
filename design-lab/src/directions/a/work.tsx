import LightboxGrid, { type LightboxImage } from '@/components/ui/kokonut-lightbox-grid'
import { PROJECTS, linkLabel } from '@/lib/content'
import { OutLink, Section } from './section'

/** The description's opening phrase, word for word: its first sentence, up to any dash. */
function opening(description: string) {
  const sentence = description.split(/(?<=[.!?])\s/)[0]
  return sentence.split(' — ')[0].replace(/[.!?]$/, '')
}

const number = (i: number) => String(i + 1).padStart(2, '0')

// Every screenshot is 1280x800. The grid is told to draw all nine alike:
// one size, one crop (16:10, so nothing is cut off), in reading order. The
// open view carries one short line; the full notes are in the list.
const IMAGES: LightboxImage[] = PROJECTS.map((p) => ({
  src: p.image,
  alt: `${p.title} ${p.isApp ? 'app' : 'website'} screenshot`,
  width: 1280,
  height: 800,
  caption: `${p.title} · ${opening(p.description)}`,
}))

const TILE =
  'max-w-none [&_li]:col-span-1 [&_li]:row-span-1 [&_button]:aspect-[16/10] [&_button]:rounded-lg sm:[&_button]:rounded-xl [&_button]:ring-1 [&_button]:ring-white/10'

// From sm up: all nine in one 3x3 grid, each tile carrying its entry's
// number (a CSS counter, so it follows the grid's own order).
const GRID = `${TILE} [&_ul]:grid-cols-3 [&_ul]:gap-2 sm:[&_ul]:gap-3 [&_ul]:[counter-reset:shot] [&_li]:relative [&_li]:[counter-increment:shot] [&_li]:after:pointer-events-none [&_li]:after:absolute [&_li]:after:top-2 [&_li]:after:left-2 [&_li]:after:rounded-md [&_li]:after:bg-black/75 [&_li]:after:px-1.5 [&_li]:after:py-0.5 [&_li]:after:font-mono [&_li]:after:text-xs [&_li]:after:text-zinc-100 [&_li]:after:tabular-nums [&_li]:after:content-[counter(shot,decimal-leading-zero)]`

// Below sm every entry carries its own picture, full width: a grid that
// holds all nine (so the open view still moves between them) but shows only
// that entry's tile.
const ONLY = [
  '[&_li:not(:nth-child(1))]:hidden',
  '[&_li:not(:nth-child(2))]:hidden',
  '[&_li:not(:nth-child(3))]:hidden',
  '[&_li:not(:nth-child(4))]:hidden',
  '[&_li:not(:nth-child(5))]:hidden',
  '[&_li:not(:nth-child(6))]:hidden',
  '[&_li:not(:nth-child(7))]:hidden',
  '[&_li:not(:nth-child(8))]:hidden',
  '[&_li:not(:nth-child(9))]:hidden',
]

const CAPTION = `[role='dialog'][aria-modal='true'] > div:last-child > p {
  left: 50%; right: auto; transform: translateX(-50%);
  width: max-content; max-width: min(36rem, calc(100vw - 2rem));
  padding: 0.375rem 0.75rem; border-radius: 0.75rem;
  background: rgb(9 9 11 / 0.92); text-wrap: balance;
}`

export function Work() {
  return (
    <Section
      id="work"
      index={1}
      kicker={`Client work · ${PROJECTS.length}`}
      title="Work"
      intro="Sites and apps built for clients. Open a screenshot to see it large, then swipe or use the arrow keys to move between them."
    >
      {/* The open view is portalled to the end of the page, out of reach of a
          className: its caption gets a backing so it never sits on the page
          showing faintly through, and a reading width. */}
      <style>{CAPTION}</style>
      <div className="max-sm:hidden">
        <LightboxGrid images={IMAGES} className={GRID} />
      </div>

      {/* The legend: one entry per screenshot, numbered like its tile and in
          the same order. On phones each entry has its picture on top. */}
      <ol className="grid gap-x-6 gap-y-12 sm:mt-10 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
        {PROJECTS.map((p, i) => (
          <li key={p.id} className="min-w-0">
            <div className="mb-4 sm:hidden">
              <LightboxGrid images={IMAGES} className={`${TILE} [&_ul]:grid-cols-1 ${ONLY[i]}`} />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tabular-nums text-zinc-400">{number(i)}</span>
              <h3 className="text-base font-medium tracking-tight text-foreground">{p.title}</h3>
            </div>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{p.description}</p>
            <p className="mt-2 font-mono text-xs">
              {p.url ? (
                <OutLink
                  href={p.url}
                  label={`${p.title}: ${linkLabel(p)} (opens in a new tab)`}
                  className="group -my-3 inline-flex items-center gap-1 py-3 text-zinc-300 transition-colors hover:text-foreground"
                >
                  {linkLabel(p)}
                  <span aria-hidden="true" className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px">
                    ↗
                  </span>
                </OutLink>
              ) : (
                <span className="text-zinc-400">{linkLabel(p)}</span>
              )}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-400">{p.tags.join(' · ')}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
