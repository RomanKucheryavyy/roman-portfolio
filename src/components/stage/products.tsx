'use client'

import dynamic from 'next/dynamic'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PRODUCTS, type Product } from '@/lib/content'
import { cn } from '@/lib/utils'
import { CAPTION_ROW, FLOW_BOX, LIVE_BOX } from './preview-box'
import { ProductStage } from './product-stage'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * The previews (the browser and phone frames, the screenshots that scroll in
 * them, the animated beams) load after the page, like the other heavy pieces
 * below the first screen (stage.tsx, "lazy parts"): fetched as soon as the
 * page hydrates, and until then a block of exactly their size holds their
 * place (preview-box.ts), so nothing moves when they land. Visitors without
 * scripts get the page's <noscript> summary.
 */
const holder = (box: string) =>
  function Holding() {
    return (
      <div aria-hidden="true">
        <div className={box} />
        <div className={CAPTION_ROW} />
      </div>
    )
  }

const LivePreview = dynamic(() => import('./product-previews').then((m) => m.LivePreview), {
  ssr: false,
  loading: holder(LIVE_BOX),
})
const ProductParts = dynamic(() => import('./product-previews').then((m) => m.ProductParts), {
  ssr: false,
  loading: holder(FLOW_BOX),
})

function ProductRow({ product, index }: { product: Product; index: number }) {
  // From lg the rows alternate: the preview on the right, then the left.
  const flip = index % 2 === 1
  const text = flip ? 'lg:col-start-2' : 'lg:col-start-1'
  return (
    <li>
      <ProductStage product={product} index={index} />
      <Container
        className={cn(
          'grid grid-cols-1 gap-y-8 py-16 md:gap-y-10 md:py-24 lg:grid-rows-[auto_auto] lg:gap-x-16 lg:gap-y-6 lg:py-28',
          flip ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
        )}
      >
        <div className={cn('lg:row-start-1 lg:self-end', text)}>
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
          <h3 className="mt-4 text-[2.5rem] font-bold leading-[0.95] tracking-[-0.05em] md:mt-5 md:text-6xl">{product.title}</h3>
          <p className="mt-4 text-lg text-foreground/80 md:text-xl">{product.tagline}</p>
        </div>

        <div className={cn('lg:row-span-2 lg:row-start-1 lg:self-center', flip ? 'lg:col-start-1' : 'lg:col-start-2')}>
          {product.preview ? <LivePreview product={product} flip={flip} /> : product.flow ? <ProductParts product={product} /> : null}
        </div>

        <div className={cn('flex flex-col items-start gap-5 lg:row-start-2 lg:self-start', text)}>
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{product.description}</p>
          <ul aria-label="Stack" className="flex flex-wrap gap-1.5">
            {product.stack.map((item) => (
              <li key={item} className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
          {product.url ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                {domain(product.url)}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>
      </Container>
    </li>
  )
}

/**
 * Act II: his own products, after the client work of Act I. Each one opens
 * on its title card (product-stage.tsx: its name in marble, one statue),
 * then a split tour, alternating sides from lg: what it is on one side, a
 * look at it on the other. The public ones show their live sites, scrolling in a
 * browser and on a phone; the private ones, which have no public screens,
 * show their parts around them, in the description's own words. Nothing
 * takes over the scroll: the previews move by themselves, and only while in
 * view. The section clips sideways, for the violet behind the previews.
 */
export function Products() {
  return (
    <section id="products" aria-labelledby="products-title" className="relative isolate scroll-mt-14 overflow-x-clip pt-20 md:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--stage-accent)_70%,transparent),transparent)]"
      />
      <Container>
        <SectionHeader
          id="products-title"
          act="Act II"
          kicker="My own products"
          title="Of my own making"
          intro={`Not client work: ${PRODUCTS.length} products of my own.`}
        />
      </Container>

      <ol className="mt-12 md:mt-20">
        {PRODUCTS.map((product, index) => (
          <ProductRow key={product.id} product={product} index={index} />
        ))}
      </ol>
    </section>
  )
}
