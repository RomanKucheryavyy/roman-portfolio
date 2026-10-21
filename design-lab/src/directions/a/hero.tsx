import TopoBackground from '@/components/ui/kokonut-topo-background'
import PluckedText from '@/components/ui/kokonut-plucked-text'
import { Button } from '@/components/ui/button'
import { PERSON } from '@/lib/content'
import { COLUMN } from './section'

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#products', label: 'Products' },
  { href: '#experience', label: 'Experience' },
  { href: '#credentials', label: 'Credentials' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

const LINK = 'inline-flex h-11 items-center rounded-md transition-colors hover:text-foreground'

function TopBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <nav aria-label="Primary" className={COLUMN}>
        <div className="flex h-16 items-center justify-between gap-6">
          <a href="#top" className={`-mx-2 px-2 text-sm font-medium tracking-tight text-foreground ${LINK}`}>
            {PERSON.name}
          </a>
          <div className="-mr-2.5 flex items-center gap-1 text-sm text-muted-foreground">
            <ul className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={`px-2.5 ${LINK}`}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-border md:block" />
            <a href={`mailto:${PERSON.links.email}`} className={`px-2.5 ${LINK}`}>
              Email
            </a>
          </div>
        </div>
        {/* Phones: the same six links, in a row of their own under the name. */}
        <ul className="-mt-1 grid grid-cols-3 gap-x-4 text-sm text-muted-foreground md:hidden">
          {NAV.map((item) => (
            <li key={item.href}>
              <a href={item.href} className={`w-full ${LINK}`}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

// The plucked name lets vertical swipes through to the page (sideways drags
// and pulls still pluck it), so a thumb that lands on it can still scroll.
const PLUCK = '[&_.touch-none]:touch-pan-y'

/**
 * The overture: a contour map that only moves when touched, and his name
 * on a string. On wide screens the name is one string; below `xl` it is
 * two, one per word, so it fits a phone. Both versions stay mounted and
 * measured (the plucked text needs a real width); the one not in use is
 * parked invisible and off to the side, out of the accessibility tree and
 * out of view, so it never runs its greeting strum unseen.
 */
export function Hero() {
  return (
    <header id="top">
      <TopoBackground className="min-h-[100svh] bg-transparent text-zinc-500 dark:bg-transparent dark:text-zinc-500" speed={0} labels={false} interval={0.085} seed={26}>
        <TopBar />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-28 pb-24 text-center text-foreground sm:px-6 md:pt-16 lg:px-8">
          <h1 className="sr-only">{PERSON.name}</h1>
          <div aria-hidden="true" className="relative -mx-4 self-stretch sm:-mx-6 lg:mx-0">
            <div className="max-xl:pointer-events-none max-xl:invisible max-xl:absolute max-xl:top-0 max-xl:right-[150%] max-xl:w-[1080px]">
              <PluckedText text={PERSON.name} className={PLUCK} />
            </div>
            <div className="@container xl:pointer-events-none xl:invisible xl:absolute xl:top-0 xl:right-[150%] xl:w-[360px]">
              <PluckedText text={PERSON.first} className={PLUCK} />
              <PluckedText text={PERSON.last} className={`-mt-[9cqi] ${PLUCK}`} />
            </div>
          </div>
          <p className="mt-2 max-w-[42rem] text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">{PERSON.tagline}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 rounded-full px-5 sm:h-10">
              <a href="#work">See the work</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-5 sm:h-10">
              <a href="#contact">Get in touch</a>
            </Button>
          </div>
        </div>
        {/* The map's touch ripples are off under reduced motion; so is its half of the hint. */}
        <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center font-mono text-xs tracking-wide text-zinc-400">
          Pluck the string<span className="motion-reduce:hidden"> · touch the map</span>
        </p>
      </TopoBackground>
    </header>
  )
}
