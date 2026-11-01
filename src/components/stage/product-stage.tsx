'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Product } from '@/lib/content'
import { IMPERIAL } from './imperial'

/**
 * A product's title card: the Roman intro's staging (old-masters-preloader)
 * above its row in Act II, its name in marble with one statue (Roman, on
 * 2026-10-30, of the intro: "this also cool for my featured projects like
 * alongside events").
 *
 * Purely visual: the row below carries the real heading, words and link, so
 * the card is aria-hidden and holds nothing that takes focus
 * (product-stage-card.tsx). It mounts ahead, a screen and a half before it
 * arrives from below and three quarters of one from above, so the component
 * has drawn its word in outline, letter by letter, with its number and its
 * eyebrow, by the time it scrolls in, never an empty box, and it holds its
 * load until it has arrived and its word is drawn (product-stage-card.tsx);
 * it unmounts once the card is that far off the screen, so only the cards
 * near the screen run their animation loops, and each plays again on return
 * (as the previews rewind).
 *
 * The card's box is this element, the same before, during and after the
 * stage: a block of its own height (TITLE_CARD_BOX) on the stage's ground,
 * so nothing below moves when the stage lands. The stage, the component and
 * the Roman faces load with next/dynamic only when the first card comes into
 * view.
 */

/** Phones: a card, not a wall. From md, most of a screen. */
export const TITLE_CARD_BOX = 'h-[30rem] md:h-[clamp(520px,80svh,820px)]'

const ProductStageCard = dynamic(() => import('./product-stage-card'), { ssr: false })

export function ProductStage({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const watch = new IntersectionObserver(
      (entries) => {
        // The last entry is the card's current state.
        setLive(entries[entries.length - 1].isIntersecting)
      },
      { rootMargin: '75% 0px 150% 0px' },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-title-card={product.id}
      data-live={live ? 'true' : 'false'}
      className={`relative overflow-hidden ${TITLE_CARD_BOX}`}
      style={{ background: IMPERIAL.ground }}
      // The stage's root can take focus (tabIndex -1), and a click would put
      // focus inside this aria-hidden card; the pointer still tilts it.
      onMouseDown={(e) => e.preventDefault()}
    >
      {live ? <ProductStageCard product={product} index={index} /> : null}
    </div>
  )
}
