import ScrollIndex from '@/components/ui/kokonut-scroll-index'
import { PERSON } from '@/lib/content'
import { Contact } from './contact'
import { Hero } from './hero'
import { Products } from './products'
import { About, Credentials, Experience } from './record'
import { Work } from './work'

export function DirectionA() {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased selection:bg-zinc-100 selection:text-zinc-900">
      <Hero />
      <main id="main" className="px-4 pt-6 pr-3 sm:px-6 lg:px-8">
        {/* The rail reads the h2 of every section below and sits beside them. */}
        <ScrollIndex scroller="window" selector="h2" className="mx-auto max-w-[60rem] gap-0 sm:gap-6 lg:gap-12 lg:pl-24">
          <Work />
          <Products />
          <Experience />
          <Credentials />
          <About />
          <Contact />
        </ScrollIndex>
      </main>
      <footer className="border-t px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 py-10 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{PERSON.name}</p>
          <p className="flex gap-5">
            <a href="#top" className="transition-colors hover:text-foreground">
              Back to top ↑
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
