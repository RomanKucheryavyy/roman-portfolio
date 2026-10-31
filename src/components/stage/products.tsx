'use client'

import dynamic from 'next/dynamic'
import { ArrowUpRight } from 'lucide-react'
import { PRODUCTS, type Product } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { cn } from '@/lib/utils'
import { stageButton } from './look'
import { CAPTION_ROW, FLOW_BOX, LIVE_BOX } from './preview-box'
import { ProductStage } from './product-stage'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * A row's catalogue line, in the Imperial Stage's type (look.ts): its number
 * of the whole as Roman numerals in gold Cinzel ("II / IV", as on its title
 * card; screen readers still get "02 / 04"), and its status on a gold-edged
 * pill in Geist capitals, the title cards' own pill. Under it the title in
 * Cinzel and the tagline in Cormorant italic: quieter than the card above,
 * which already shouts the name.
 */
const NUMBER = 'font-roman text-lg font-medium leading-none tracking-[0.14em] text-gold md:text-xl'
const STATUS =
  'inline-flex items-center gap-2.5 rounded-full border border-gold/60 px-3 py-1.5 font-sans text-[10.5px] font-medium uppercase leading-none tracking-[0.22em] text-(--stage-text)'
const TITLE = 'font-roman text-[1.875rem] font-medium leading-[1.06] tracking-[0.02em] text-balance text-foreground md:text-5xl lg:text-[3.25rem]'
const TAGLINE = 'font-serif text-[1.375rem] italic leading-snug text-pretty text-(--stage-text) md:text-[1.625rem]'
/** The stack: an inscribed line rather than boxes, each name after a small gold lozenge. */
const STACK = 'flex flex-wrap items-center gap-x-5 gap-y-2.5 font-sans text-[11px] font-medium uppercase leading-4 tracking-[0.18em] text-muted-foreground'
const LOZENGE = 'size-[5px] shrink-0 rotate-45 bg-gold/80'

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
          {/* On a phone the title card just above already shows the number,
              the status and the tagline, so there they are for screen
              readers only, and the row opens on its title. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 max-md:sr-only">
            <span className={NUMBER}>
              <span aria-hidden="true">
                {toRoman(index + 1)} <span className="text-gold/55">/</span>{' '}
                {toRoman(PRODUCTS.length)}
              </span>
              <span className="sr-only">
                {pad(index + 1)} / {pad(PRODUCTS.length)}
              </span>
            </span>
            <span className={STATUS}>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
              <span className="sr-only">Status: </span>
              {product.status}
            </span>
          </div>
          <h3 className={cn('md:mt-6', TITLE)}>{product.title}</h3>
          <p className={cn('mt-3 max-md:sr-only md:mt-4', TAGLINE)}>{product.tagline}</p>
        </div>

        <div className={cn('lg:row-span-2 lg:row-start-1 lg:self-center', flip ? 'lg:col-start-1' : 'lg:col-start-2')}>
          {product.preview ? <LivePreview product={product} flip={flip} /> : product.flow ? <ProductParts product={product} /> : null}
        </div>

        <div className={cn('flex flex-col items-start gap-6 lg:row-start-2 lg:self-start', text)}>
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{product.description}</p>
          <ul aria-label="Stack" className={cn('w-full max-w-xl border-t border-border pt-5', STACK)}>
            {product.stack.map((item) => (
              <li key={item} className="inline-flex items-center gap-2.5">
                <span aria-hidden="true" className={LOZENGE} />
                {item}
              </li>
            ))}
          </ul>
          {product.url ? (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className={stageButton('secondary', 'sm')}>
              {domain(product.url)}
              <ArrowUpRight aria-hidden="true" />
            </a>
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
