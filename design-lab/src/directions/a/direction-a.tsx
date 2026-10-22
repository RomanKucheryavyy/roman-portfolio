import ScrollIndex from '@/components/ui/kokonut-scroll-index'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'
import { Contact } from './contact'
import { Hero } from './hero'
import { Products } from './products'
import { About, Credentials, Experience } from './record'
import { COLUMN } from './section'
import { Work } from './work'

// The rail is for a mouse on a wide screen. Under a thumb (any touch-first
// screen) or in a narrow window it turns a scroll into a jump and takes the
// right gutter, so there it is left out and the column runs full width; the
// top bar carries the section links instead. Its ticks are drawn in one ink,
// like a progress bar: the playhead is the one bright mark, the sections
// above it are lit, the ones ahead are dimmer (and still above 3:1).
const RAIL = cn(
  COLUMN,
  'gap-0 lg:gap-12',
  'max-lg:grid-cols-1 max-lg:[&>nav]:hidden pointer-coarse:grid-cols-1 pointer-coarse:[&>nav]:hidden',
  '[&_button[data-state=current]>span]:bg-zinc-300! [&_button[data-state=passed]>span]:bg-zinc-300! [&_button[data-state=ahead]>span]:bg-zinc-500!',
)

export function DirectionA() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased selection:bg-zinc-100 selection:text-zinc-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-zinc-100 focus:px-3 focus:py-2 focus:text-sm focus:text-zinc-900"
      >
        Skip to content
      </a>
      <Hero />
      <main id="main" tabIndex={-1} className="pt-6 outline-none">
        {/* The rail reads the h2 of every section below and sits beside them. */}
        <ScrollIndex scroller="window" selector="h2" className={RAIL}>
          <Work />
          <Products />
          <Experience />
          <Credentials />
          <About />
          <Contact />
        </ScrollIndex>
      </main>
      <footer className="border-t">
        <div className={cn(COLUMN, 'flex flex-col py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
          <p className="flex min-h-11 items-center">{PERSON.name}</p>
          <p>
            <a href="#top" className="-mx-2 inline-flex min-h-11 items-center px-2 transition-colors hover:text-foreground">
              Back to top ↑
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
