'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import OldMastersPreloader, { type OldMastersFigure } from '@/components/ui/old-masters-preloader'
import { PRODUCTS, type Product } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { CAST, pastEdge, type CastPhoto } from './cast'
import { IMPERIAL, WORD_HALO } from './imperial'
import { ROMAN_FONTS } from './roman-type'

/**
 * The stage inside a product's title card (product-stage.tsx, which loads
 * this with next/dynamic once a card comes into view; the Roman faces come
 * with it). Every word is the product's own, from the records
 * (src/lib/content.ts), or its number:
 *
 * - the wordmark: its title; the tagline: its tagline;
 * - the eyebrow: its domain if it is public, "Private" if not (from `url`);
 * - the brand: its number, I to IV; the pills: its status, and its number
 *   of the whole (II / IV); the plate continues the intro's (Tab. I) from
 *   Tab. II;
 * - one statue, on the side away from the row's text from lg (the rows
 *   alternate; products.tsx): Apollo for Alongside Events and, mirrored,
 *   for Sembly (he is the god of music, and Sembly schedules worship
 *   teams); the Hercules for Praxis and, mirrored, for Alongside Brain (cut
 *   at the belly in the file, and stood below the floor);
 * - behind it, a public product's own desktop screenshot (already on the
 *   page, in its preview), which the component greys, darkens and blurs;
 *   nothing behind a private one.
 *
 * Nothing in it takes focus: no nav, no skip (`skippable={false}` also
 * keeps the root out of the tab order), and its call to action, which the
 * component renders by default, hidden. Under reduced motion it opens
 * straight on the still landing.
 */

/** A reveal, not a wait. */
const DURATION_MS = 2400
const MIN_LOAD_MS = 1800

/** The cast's files are pre-keyed (cast.ts): the component's own key only keeps their edge. */
const KEY = { threshold: 0.08, softness: 0.08 } as const

/**
 * Each product's statue, as it stands on the right; on the left it is
 * mirrored. `flip` turns it in where it can, and out where the photograph
 * cuts the statue off: Apollo's frame cuts his arm, so the arm reaches out
 * past the card's edge (`reach`: x is the least, and a wider card moves him
 * further out, pastEdge), where the cut never shows.
 */
const STATUES: Record<string, { photo: CastPhoto; x: number; y: number; h: number; flip: boolean; reach?: boolean }> = {
  'alongside-events': { photo: CAST.apollo, x: 84, y: 100, h: 74, flip: false, reach: true },
  sembly: { photo: CAST.apollo, x: 84, y: 100, h: 74, flip: false, reach: true },
  praxis: { photo: CAST.hercules, x: 78, y: 104, h: 74, flip: false },
  'alongside-brain': { photo: CAST.hercules, x: 78, y: 104, h: 74, flip: false },
}

/** A title longer than this is set smaller on phones than the component's floor of 36px allows. */
const LONG_TITLE = 10

const domain = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')

/**
 * From outside, by descendant classes (the component as published): its
 * call to action hidden (nothing here is a way in), and the scroll hint
 * with it; its interface above the statue (as in the intro), so no figure
 * covers a word of it; the copy below the pills (on a 1024 screen it ran
 * between them); on phones no barcode, which stood on the statue's base;
 * the plate on a dark label, as in the intro; the word keeps the intro's
 * dark halo; the tagline's lines are balanced; the backdrop darker than the
 * component's (a light site's screenshot, Sembly's, showed its headings
 * through and dimmed the chrome); and no meander ring while it loads: the
 * ring is the intro's alone, so a card opens on its own word and count.
 */
const LOOK = [
  '[&_.om-cta]:hidden! [&_.om-hint]:hidden! [&_.om-ring]:hidden!',
  '[&_.om-chrome]:z-[6]!',
  'max-sm:[&_.om-copy]:top-[148px]! sm:[&_.om-copy]:top-[max(16.5%,138px)]!',
  'max-sm:[&_.om-bars]:hidden! max-sm:[&_.om-foot]:justify-end!',
  '[&_.om-plate]:rounded-[2px] [&_.om-plate]:bg-[var(--om-ground-b)] [&_.om-plate]:px-2 [&_.om-plate]:py-1',
  WORD_HALO,
  '[&_.om-tagline]:text-balance',
  '[&_.om-backdrop]:[filter:grayscale(1)_contrast(1.1)_brightness(0.32)_blur(6px)]!',
].join(' ')

/** Watches a media query; false on the server. */
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (change) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', change)
      return () => mq.removeEventListener('change', change)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** On a phone's card the statue stands shorter, its head below the copy. */
const PHONE_SCALE = 0.7

export function titleCardFigure(product: Product, index: number, phone = false, stage = { w: 0, h: 0 }): OldMastersFigure | null {
  const statue = STATUES[product.id]
  if (!statue) return null
  // From lg an even row has its text on the left, so its statue stands on the right.
  const right = index % 2 === 0
  const h = phone ? Math.round(statue.h * PHONE_SCALE) : statue.h
  const x = statue.reach ? Math.max(statue.x, pastEdge(statue.photo, h, stage.w, stage.h)) : statue.x
  return {
    src: statue.photo.src,
    alt: statue.photo.alt,
    x: right ? x : 100 - x,
    y: statue.y,
    h,
    depth: 0.8,
    flip: right ? statue.flip : !statue.flip,
    ...KEY,
  }
}

export default function ProductStageCard({ product, index }: { product: Product; index: number }) {
  const still = useMedia('(prefers-reduced-motion: reduce)')
  const phone = useMedia('(max-width: 639px)')
  // The card's size, for where a statue that reaches out must stand.
  const box = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const watch = new ResizeObserver(([entry]) => setStage({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  const figure = titleCardFigure(product, index, phone, stage)
  const n = toRoman(index + 1)
  return (
    <div ref={box} className="h-full">
      <OldMastersPreloader
        durationMs={DURATION_MS}
        minLoadMs={MIN_LOAD_MS}
        skippable={false}
        skipIntro={still}
        figures={figure ? [figure] : []}
        backdrop={product.preview?.desktop.src ?? null}
        duotone
        tone="noir"
        palette={IMPERIAL}
        fontHref={null}
        fonts={ROMAN_FONTS}
        wordmark={product.title}
        wordAs="p"
        tagline={product.tagline}
        eyebrow={product.url ? domain(product.url) : 'Private'}
        brand={n}
        nav={[]}
        labels={[product.status, `${n} / ${toRoman(PRODUCTS.length)}`]}
        asides={[]}
        annotations={[]}
        plate={`Tab. ${toRoman(index + 2)}`}
        loadingLabel="Loading"
        formatCount={toRoman}
        height="100%"
        // The word fits the card's width down to 36px; a long title on a phone
        // needs less, and the word's size is a CSS variable, so it is set here.
        className={product.title.length > LONG_TITLE ? `${LOOK} max-sm:[--om-fs:7.2vw]!` : LOOK}
      />
    </div>
  )
}
