import LightboxGrid, { type LightboxImage } from '@/components/ui/kokonut-lightbox-grid'
import { PROJECTS, linkLabel } from '@/lib/content'
import { OutLink, Section } from './section'

/** The description's opening phrase, word for word: its first sentence, up to any dash. */
function opening(description: string) {
  const sentence = description.split(/(?<=[.!?])\s/)[0]
  return sentence.split(' — ')[0].replace(/[.!?]$/, '')
}

// Every screenshot is 1280x800. The grid is told to draw all nine alike:
// one size, one crop (16:10, so nothing is cut off), in reading order. The
// open view carries the full description.
const IMAGES: LightboxImage[] = PROJECTS.map((p) => ({
  src: p.image,
  alt: `${p.title} ${p.isApp ? 'app' : 'website'} screenshot`,
  width: 1280,
  height: 800,
  caption: `${p.title} · ${p.description}`,
}))

const GRID =
  'max-w-none [&_ul]:grid-cols-3 [&_ul]:gap-2 sm:[&_ul]:gap-3 [&_li]:col-span-1 [&_li]:row-span-1 [&_button]:aspect-[16/10] [&_button]:rounded-lg sm:[&_button]:rounded-xl [&_button]:ring-1 [&_button]:ring-white/10'

export function Work() {
  return (
    <Section
      id="work"
      index={1}
      kicker={`Client work · ${PROJECTS.length} pieces`}
      title="Work"
      intro="Sites and apps built for clients. Open a screenshot to see it large with its notes; swipe or use the arrow keys to move between them."
    >
      <LightboxGrid images={IMAGES} className={GRID} />

      {/* The legend: one entry per screenshot, in the same three columns and
          the same order, so each name sits under its picture's column. */}
      <ol className="mt-8 grid gap-x-3 border-t pt-6 sm:grid-cols-3 sm:gap-y-9 sm:border-t-0 sm:pt-0">
        {PROJECTS.map((p, i) => (
          <li key={p.id} className="grid grid-cols-[2rem_minmax(0,1fr)] border-b py-4 sm:block sm:border-b-0 sm:py-0">
            <span className="pt-px font-mono text-[11px] tabular-nums text-muted-foreground sm:block">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0 sm:mt-2">
              <h3 className="text-[15px] font-medium tracking-tight text-foreground">{p.title}</h3>
              <p className="mt-1 text-pretty text-sm leading-snug text-muted-foreground">{opening(p.description)}</p>
              <p className="mt-2.5 font-mono text-[11px]">
                {p.url ? (
                  <OutLink href={p.url} label={`${p.title}: ${linkLabel(p)} (opens in a new tab)`} className="group inline-flex items-center gap-1 text-zinc-300 transition-colors hover:text-foreground">
                    {linkLabel(p)}
                    <span aria-hidden="true" className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px">
                      ↗
                    </span>
                  </OutLink>
                ) : (
                  <span className="text-zinc-400">{linkLabel(p)}</span>
                )}
              </p>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">{p.tags.join(' · ')}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
