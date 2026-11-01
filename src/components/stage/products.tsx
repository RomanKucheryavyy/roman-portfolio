'use client'

import dynamic from 'next/dynamic'
import { PRODUCTS, type Product } from '@/lib/content'
import { cn } from '@/lib/utils'
import { INTERPUNCT, INTERPUNCT_LIST } from './interpunct'
import { stageLink } from './look'
import { CAPTION_ROW, flowBox, isChain, LIVE_BOX } from './preview-box'
import { ProductStage } from './product-stage'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')
const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/**
 * The stack: an inscribed line, the names in the Stage's Geist capitals at
 * the page's label size, the interpunct between them (Act I's tags' own
 * divider, interpunct.ts): no rule, no marks.
 */
const STACK = `${INTERPUNCT_LIST} font-sans text-xs font-medium uppercase leading-5 tracking-[0.18em] text-muted-foreground`

/**
 * The previews (the browser and phone frames, the screenshots that scroll in
 * them, the private products' inscriptions) load after the page, like the
 * other heavy pieces below the first screen (stage.tsx, "lazy parts"):
 * fetched as soon as the page hydrates, and until then a block of exactly
 * their size holds their place (preview-box.ts), so nothing moves when they
 * land. Visitors without scripts get the page's <noscript> summary.
 */
const holder = (box: string, caption: boolean) =>
  function Holding() {
    return (
      <div aria-hidden="true">
        <div className={box} />
        {caption ? <div className={CAPTION_ROW} /> : null}
      </div>
    )
  }

const LivePreview = dynamic(() => import('./product-previews').then((m) => m.LivePreview), {
  ssr: false,
  loading: holder(LIVE_BOX, true),
})
// One loader per private product, each holding its own inscription's place
// (a chain has a Pause under it; the desk, which only moves as it arrives, has none).
const parts = (flow: NonNullable<Product['flow']>) =>
  dynamic(() => import('./product-previews').then((m) => m.ProductParts), {
    ssr: false,
    loading: holder(flowBox(flow), isChain(flow)),
  })
const PARTS = Object.fromEntries(PRODUCTS.flatMap((p) => (p.flow ? [[p.id, parts(p.flow)]] : [])))

function ProductRow({ product, index }: { product: Product; index: number }) {
  // From lg the rows alternate: the preview on the right, then the left.
  const flip = index % 2 === 1
  const text = flip ? 'lg:col-start-2' : 'lg:col-start-1'
  const Parts = PARTS[product.id]
  return (
    <li>
      <ProductStage product={product} index={index} />
      <Container
        className={cn(
          'grid grid-cols-1 gap-y-8 py-16 md:gap-y-10 md:py-24 lg:gap-x-16 lg:py-28',
          flip ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
        )}
      >
        {/* The title card just above shows the product's name, tagline,
            status and number, so the row doesn't say them again: they are
            here for screen readers (the card is aria-hidden), ahead of the
            preview, and the row shows the product itself. */}
        <div className="sr-only">
          <h3>{product.title}</h3>
          <p>{product.tagline}</p>
          <p>
            {pad(index + 1)} / {pad(PRODUCTS.length)}
          </p>
          <p>Status: {product.status}</p>
        </div>

        <div className={cn('lg:row-start-1 lg:self-center', flip ? 'lg:col-start-1' : 'lg:col-start-2')}>
          {product.preview ? <LivePreview product={product} flip={flip} /> : Parts ? <Parts product={product} /> : null}
        </div>

        <div className={cn('flex flex-col items-start gap-6 lg:row-start-1 lg:self-center', text)}>
          <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{product.description}</p>
          <ul aria-label="Stack" className={cn('w-[calc(100%_+_1.5rem)] max-w-[calc(36rem_+_1.5rem)]', STACK)}>
            {product.stack.map((item) => (
              <li key={item} className={INTERPUNCT}>
                {item}
              </li>
            ))}
          </ul>
          {product.url ? (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className={stageLink('away')}>
              {domain(product.url)}
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
 * are set as inscriptions of their parts, in the description's own words.
 * Nothing takes over the scroll: the previews move by themselves, and only
 * while in view. The section clips sideways, for the glow behind the previews
 * (each preview's own; there is no light over the act from above).
 */
export function Products() {
  return (
    <section id="products" aria-labelledby="products-title" className="relative isolate scroll-mt-14 overflow-x-clip pt-20 md:pt-32">
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
