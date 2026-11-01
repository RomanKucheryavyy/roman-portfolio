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
 * (product-stage-card.tsx). It plays when it arrives: the stage mounts once
 * at least MOUNT_AT of the card is in view and unmounts once the card has
 * left the screen entirely, so only the cards near the screen run their
 * animation loops, and each plays again on return (as the previews rewind).
 * On a phone it mounts ahead, three quarters of a screen before it arrives,
 * so it scrolls in already composed and never as an empty box; it holds its
 * entrance until it has arrived (product-stage-card.tsx).
 *
 * The card's box is this element, the same before, during and after the
 * stage: a block of its own height (TITLE_CARD_BOX) on the stage's ground,
 * so nothing below moves when the stage lands. The stage, the component and
 * the Roman faces load with next/dynamic only when the first card comes into
 * view.
 */

/** Phones: a card, not a wall. From md, most of a screen. */
export const TITLE_CARD_BOX = 'h-[30rem] md:h-[clamp(520px,80svh,820px)]'

/** The share of the card in view that mounts its stage (from sm; a phone mounts it ahead). */
const MOUNT_AT = 0.35

const ProductStageCard = dynamic(() => import('./product-stage-card'), { ssr: false })

export function ProductStage({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ahead = matchMedia('(max-width: 639px)').matches
    const watch = new IntersectionObserver(
      (entries) => {
        // The last entry is the card's current state.
        const entry = entries[entries.length - 1]
        if (ahead ? entry.isIntersecting : entry.intersectionRatio >= MOUNT_AT) setLive(true)
        else if (!entry.isIntersecting) setLive(false)
      },
      ahead ? { rootMargin: '0px 0px 75% 0px' } : { threshold: [0, MOUNT_AT] },
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
