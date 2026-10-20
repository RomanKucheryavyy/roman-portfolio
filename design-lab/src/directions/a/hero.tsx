import TopoBackground from '@/components/ui/kokonut-topo-background'
import PluckedText from '@/components/ui/kokonut-plucked-text'
import { Button } from '@/components/ui/button'
import { PERSON } from '@/lib/content'

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#products', label: 'Products' },
  { href: '#experience', label: 'Experience' },
  { href: '#credentials', label: 'Credentials' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

function TopBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="text-sm font-medium tracking-tight text-foreground">
          {PERSON.name}
        </a>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="rounded-md px-2.5 py-1.5 transition-colors hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="mx-2 hidden h-4 w-px bg-border md:block" />
          <a href={`mailto:${PERSON.links.email}`} className="rounded-md px-2.5 py-1.5 transition-colors hover:text-foreground">
            Email
          </a>
        </div>
      </nav>
    </div>
  )
}

/**
 * The overture: a contour map that only moves when touched, and his name
 * on a string. On wide screens the name is one string; below `xl` it is
 * two, one per word, so it fits a phone. Both versions stay mounted and
 * measured (the plucked text needs a real width), and the one not in use
 * is parked invisible, out of the accessibility tree and out of the way.
 */
export function Hero() {
  return (
    <TopoBackground className="min-h-[100svh] bg-transparent text-zinc-500 dark:bg-transparent dark:text-zinc-500" speed={0} labels={false} interval={0.085} seed={26}>
      <TopBar />
      <div id="top" className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-24 text-center text-foreground sm:px-6 lg:px-8">
        <h1 className="relative -mx-4 self-stretch sm:-mx-6 lg:mx-0">
          <span className="sr-only">{PERSON.name}</span>
          <div aria-hidden="true" className="max-xl:pointer-events-none max-xl:invisible max-xl:absolute max-xl:top-0 max-xl:right-0 max-xl:w-[1080px]">
            <PluckedText text={PERSON.name} />
          </div>
          <div aria-hidden="true" className="@container xl:pointer-events-none xl:invisible xl:absolute xl:top-0 xl:right-0 xl:w-[360px]">
            <PluckedText text={PERSON.first} />
            <PluckedText text={PERSON.last} className="-mt-[9cqi]" />
          </div>
        </h1>
        <p className="mt-2 max-w-[42rem] text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">{PERSON.tagline}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-10 rounded-full px-5">
            <a href="#work">See the work</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-10 rounded-full px-5">
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
      </div>
      <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center font-mono text-[11px] tracking-wide text-zinc-500">
        Pluck the string · touch the map
      </p>
    </TopoBackground>
  )
}
