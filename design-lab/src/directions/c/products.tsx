import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRODUCTS } from '@/lib/content'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Act II: his own products. No images on purpose (there is nothing honest to
 * show), so they read like a printed programme: name, line, status, notes.
 */
export function Products() {
  return (
    <section id="products" aria-labelledby="products-title" className="scroll-mt-14 pt-20 pb-16 md:py-32">
      <Container>
        <SectionHeader
          id="products-title"
          act="Act II"
          kicker="My own products"
          title="Of my own making"
          intro={`Not client work: ${PRODUCTS.length} products of my own.`}
        />

        <ol className="mt-12 border-t border-white/10 md:mt-20">
          {PRODUCTS.map((product, index) => (
            <li
              key={product.id}
              className="grid gap-4 border-b border-white/10 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:py-14"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {pad(index + 1)} / {pad(PRODUCTS.length)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--stage-accent-ink)]" />
                    <span className="sr-only">Status: </span>
                    {product.status}
                  </span>
                </div>
                <h3 className="mt-3 text-[2rem] font-bold leading-none tracking-[-0.05em] md:mt-5 md:text-5xl">{product.title}</h3>
                <p className="mt-3 text-lg text-foreground/80 md:text-xl">{product.tagline}</p>
              </div>

              <div className="flex flex-col items-start gap-4 md:gap-5 md:pt-10">
                <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{product.description}</p>
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  <span className="sr-only">Stack: </span>
                  {product.stack.join('  ·  ')}
                </p>
                {product.url ? (
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={product.url} target="_blank" rel="noopener noreferrer">
                      {product.url.replace(/^https?:\/\//, '')}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
