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
 * this with next/dynamic once a card comes near; the Roman faces come with
 * it). Every word is the product's own, from the records
 * (src/lib/content.ts), or its number:
 *
 * - the wordmark: its title; the tagline: its tagline;
 * - the eyebrow: its domain if it is public, "Private" if not (from `url`),
 *   then its status, one quiet line (two on a phone);
 * - the brand: its number, I to IV, in gold Cinzel as the act headers set
 *   their numerals; the pills (its status, and its number of the whole,
 *   II / IV) are hidden, since the eyebrow and the brand say both;
 * - one statue, on the side away from the row's text from lg (the rows
 *   alternate; products.tsx): Apollo for Alongside Events and, mirrored,
 *   for Sembly (he is the god of music, and Sembly schedules worship
 *   teams); the Hercules for Praxis and, mirrored, for Alongside Brain (cut
 *   at the belly in the file, and stood below the floor);
 * - behind it, a public product's own desktop screenshot (already on the
 *   page, in its preview), which the component greys, darkens and blurs;
 *   nothing behind a private one.
 *
 * No ornaments: no pills, no stars, no rules; the type is the ornament.
 * No stage light: no shafts from above, no spotlight on the pointer; the
 * flood and the print light it. One word scale across the four cards: a long title
 * stands on two lines, a short one is held to at most 1.3 times its size,
 * so the four read as one series.
 *
 * Nothing in it takes focus: no nav, no skip (`skippable={false}` also
 * keeps the root out of the tab order), and its call to action, which the
 * component renders by default, hidden. Under reduced motion it opens
 * straight on the still landing.
 *
 * On a phone it opens on its landing too (the component's load and unveil
 * take seconds a phone's scroll doesn't give), mounted ahead of the card
 * (product-stage.tsx) so it scrolls in composed: the number, the eyebrow and
 * the word. It holds three things back until a third of it has arrived,
 * then brings them in, all within about 1.3 s: the light floods out from
 * behind the word, the statue rises into it, the tagline follows word by
 * word, and a sheen crosses the word (ARRIVAL, below).
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

/** A title longer than this stands on two lines (WORD). */
const LONG_TITLE = 10

const domain = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')

/**
 * From outside, by descendant classes (the component as published): its
 * call to action hidden (nothing here is a way in), and the scroll hint
 * with it; its pills, its stars and the rules beside its eyebrow hidden
 * (no lines, no ornaments); its spotlight that follows the pointer hidden
 * (no stage light; over a light site's screenshot it also took the eyebrow
 * under 3:1); its interface above the statue (as in the intro), so no
 * figure covers a word of it; the number in gold Cinzel; the eyebrow at the
 * page's 12px floor, in the body ink (the muted ink, over a light site's
 * blurred screenshot, measured under 4.5:1); the copy just under the
 * eyebrow; the word keeps the intro's dark halo; the tagline's lines are
 * balanced; the backdrop darker
 * than the component's (a light site's screenshot, Sembly's, showed its
 * headings through and dimmed the chrome); and none of the intro's
 * loading: no meander ring, no count, no barcode and no plate. Those are
 * the intro's alone, and over a product that is already on the page
 * "Loading" says something untrue; a card opens on its own word.
 */
const LOOK = [
  '[&_.om-cta]:hidden! [&_.om-hint]:hidden! [&_.om-ring]:hidden! [&_.om-counter]:hidden! [&_.om-foot]:hidden! [&_.om-pill]:hidden! [&_.om-star]:hidden! [&_.om-rule]:hidden! [&_.om-spot]:hidden!',
  '[&_.om-chrome]:z-[6]!',
  '[&_.om-brand]:font-roman! [&_.om-brand]:text-[1.75rem]! [&_.om-brand]:not-italic! [&_.om-brand]:leading-none! [&_.om-brand]:tracking-[0.04em]! [&_.om-brand]:[color:var(--om-accent)]!',
  '[&_.om-eyebrow]:top-14! [&_.om-eyebrow]:[transform:translateX(-50%)]! [&_.om-eyebrow]:text-xs! [&_.om-eyebrow]:[color:var(--om-text)]! [&_.om-eyebrow]:leading-5! [&_.om-eyebrow]:tracking-[0.24em]! [&_.om-eyebrow]:w-max! [&_.om-eyebrow]:whitespace-pre-line! [&_.om-eyebrow]:text-center!',
  'max-sm:[&_.om-copy]:top-[7.25rem]! sm:[&_.om-copy]:top-[max(14%,6.5rem)]!',
  WORD_HALO,
  '[&_.om-tagline]:text-balance',
  '[&_.om-backdrop]:[filter:grayscale(1)_contrast(1.1)_brightness(0.32)_blur(6px)]!',
].join(' ')

/**
 * The word's one scale, as CSS over the component's own fit (its size is a
 * CSS variable): a long title on two lines (the space between its words
 * made a line break), sized so its longer word fits the card's width with
 * the page's gutter, at most 56px on a phone; a short one on one line, at
 * most 1.3 times that. ALONGSIDE (the longest word) is 6.6 of its own size
 * wide in Cinzel with the component's tracking, and 5.1 is 6.6 / 1.3 (the
 * widest short title, SEMBLY, is 4.2, so it fits). From sm the screen's
 * height caps both, in the same ratio.
 */
const WORD = {
  long: '[&_.om-sp]:block! max-sm:[--om-fs:min(56px,calc((100vw-2.25rem)/6.6))]! sm:[--om-fs:min(calc((100vw-4.5rem)/6.6),17svh)]!',
  short: 'max-sm:[--om-fs:min(72px,calc((100vw-2.25rem)/5.1))]! sm:[--om-fs:min(calc((100vw-4.5rem)/5.1),22svh)]!',
}

/**
 * A phone's entrance, from outside: while the wrapper's data-arrived is
 * "false", the flood is closed, the statue stands low and unseen and the
 * tagline's words wait below their line; when it turns "true" each comes
 * in on its own timing, and a sheen (the component's own keyframes)
 * crosses the word once. Only where the wrapper carries data-arrived at
 * all: a phone, with motion.
 */
const ARRIVAL = [
  '[&[data-arrived=false]_.om-flood]:[clip-path:circle(0%_at_50%_70%)]! [&[data-arrived]_.om-flood]:[transition:clip-path_1.1s_cubic-bezier(0.16,1,0.3,1)]!',
  '[&[data-arrived=false]_.om-fig]:opacity-0! [&[data-arrived=false]_.om-fig]:[transform:translate3d(0,14%,0)]! [&[data-arrived]_.om-fig]:[transition:transform_1.1s_cubic-bezier(0.16,1,0.3,1)_0.1s,opacity_0.7s_ease_0.1s,filter_0.9s_ease]!',
  '[&[data-arrived=false]_.om-tagline_span]:opacity-0! [&[data-arrived=false]_.om-tagline_span]:[transform:translate3d(0,14px,0)]! [&[data-arrived]_.om-tagline_span]:[transition:opacity_0.6s_ease_calc(0.3s+var(--i)*50ms),transform_0.7s_cubic-bezier(0.16,1,0.3,1)_calc(0.3s+var(--i)*50ms)]!',
  '[&[data-arrived=true]_.om-sheen]:[animation:om-sheen_1.1s_cubic-bezier(0.4,0,0.2,1)_0.45s_forwards]!',
].join(' ')

/** The share of a phone's card in view that brings its entrance in. */
const ARRIVE_AT = 0.35

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
const PHONE_SCALE = 0.8

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
  // A phone's entrance waits for the card to arrive (once; it unmounts after leaving).
  const arriving = phone && !still
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el || !arriving) return
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1].intersectionRatio < ARRIVE_AT) return
        setArrived(true)
        watch.disconnect()
      },
      { threshold: [0, ARRIVE_AT] },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [arriving])
  const figure = titleCardFigure(product, index, phone, stage)
  const where = product.url ? domain(product.url) : 'Private'
  const n = toRoman(index + 1)
  return (
    <div ref={box} className={`h-full ${ARRIVAL}`} data-arrived={arriving ? String(arrived) : undefined}>
      <OldMastersPreloader
        durationMs={DURATION_MS}
        minLoadMs={MIN_LOAD_MS}
        skippable={false}
        skipIntro={still || phone}
        figures={figure ? [figure] : []}
        backdrop={product.preview?.desktop.src ?? null}
        duotone
        // No shafts of light from above: the card is lit by its flood and
        // the statue's own print, never by stage beams (Roman, 2026-11-01,
        // of the hero's light: "not this like stage light look thingy").
        // The dust still drifts.
        rays={false}
        tone="noir"
        palette={IMPERIAL}
        fontHref={null}
        fonts={ROMAN_FONTS}
        wordmark={product.title}
        wordAs="p"
        tagline={product.tagline}
        // Where it lives, then its status: one line, two on a phone (the
        // eyebrow keeps its line breaks, LOOK).
        eyebrow={phone ? `${where}\n${product.status}` : `${where} · ${product.status}`}
        brand={n}
        nav={[]}
        labels={[product.status, `${n} / ${toRoman(PRODUCTS.length)}`]}
        asides={[]}
        annotations={[]}
        // The count and the plate are hidden (LOOK): no plate of its own, and
        // the progress bar keeps its name inside the aria-hidden card.
        plate=""
        loadingLabel="Loading"
        height="100%"
        className={`${LOOK} ${product.title.length > LONG_TITLE ? WORD.long : WORD.short}`}
      />
    </div>
  )
}
