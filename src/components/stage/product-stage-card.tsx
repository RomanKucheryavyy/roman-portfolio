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
 * It opens as the component does (Roman, 2026-11-01, once its animation had
 * been taken out: "but the animation from2 1st dev for this roman theme is
 * now gone"): the load, its own word filling with marble; the unveil, the
 * flood opening as its circle with the flash, the sheen crossing the word,
 * the statue rising and the backdrop surfacing; then the living landing,
 * its light (the shafts and the dust on the component's canvas, the
 * spotlight on the pointer), the statue's bob and the parallax, the
 * moving grain, the stars' twinkle. In the palette (IMPERIAL).
 *
 * When: the card mounts ahead of the screen (product-stage.tsx), so it
 * scrolls in with its number, its eyebrow, its stars and its word drawn in
 * outline, never as an empty box. Its load is held at nothing until its
 * word is on screen (ARRIVE_AT); then the word fills within about a second
 * and the unveil follows at once, so a card lands about four seconds after
 * it arrives. Its light runs only while the card is on screen. Under
 * reduced motion it opens straight on its still landing (the component's
 * own still frame).
 *
 * Kept from the page's look: no pills, no rules (the eyebrow's), none of
 * the intro's loading (LOOK); one word scale across the four cards (WORD);
 * its top and foot sink into the page's ground (EDGES), so it has no hard
 * edges.
 *
 * Nothing in it takes focus: no nav, no skip (`skippable={false}` also
 * keeps the root out of the tab order), and its call to action, which the
 * component renders by default, hidden.
 */

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
 * The words stay AA through the light, from outside. The sheen's band
 * crosses the card at the unveil: it fades out above the word (by a third
 * of the way down, where the eyebrow and the number stand clear of it),
 * and the word stands in front of it rather than under it (the band passes
 * behind the letters; over marble it only whitened them, and it washed out
 * the word's halo). The shafts gather behind the eyebrow at the top and the
 * spotlight follows the pointer, so the eyebrow and the number take a dark
 * halo of the ground (the tagline has the component's own). Measured on the
 * pixels at the band's brightest, over the lightest backdrops (Sembly's,
 * Alongside Events'): without these the eyebrow fell to 2.0:1 and the word
 * to 1.9:1 as the band passed.
 */
const LIGHT_SAFE = [
  '[&_.om-eyebrow]:[text-shadow:0_0_1px_var(--om-ground),0_0_3px_var(--om-ground),0_0_6px_var(--om-ground-b),0_1px_14px_var(--om-ground-c)]',
  '[&_.om-brand]:[text-shadow:0_0_2px_var(--om-ground),0_0_10px_var(--om-ground-c)]',
  '[&_.om-wordclip]:z-[1]',
  '[&_.om-sheen]:[mask-image:linear-gradient(to_bottom,transparent_18%,#000_32%)]',
].join(' ')

/**
 * From outside, by descendant classes (the component as published): its
 * call to action hidden (nothing here is a way in), and the scroll hint
 * with it; its pills and the rules beside its eyebrow hidden (no lines, no
 * pills: the eyebrow and the number say what they said); its interface
 * above the statue (as in the intro), so no figure covers a word of it; the
 * number in gold Cinzel; the eyebrow at the page's 12px floor, in the body
 * ink (the muted ink, over a light site's blurred screenshot, measured
 * under 4.5:1); the copy just under the eyebrow; the word keeps the
 * intro's dark halo; the tagline's lines are balanced; the backdrop darker
 * than the component's (a light site's screenshot, Sembly's, showed its
 * headings through and dimmed the chrome); and none of the intro's
 * loading: no meander ring, no count, no barcode and no plate. Those are
 * the intro's alone, and over a product that is already on the page
 * "Loading" says something untrue; a card loads as its own word filling.
 */
const LOOK = [
  '[&_.om-cta]:hidden! [&_.om-hint]:hidden! [&_.om-ring]:hidden! [&_.om-counter]:hidden! [&_.om-foot]:hidden! [&_.om-pill]:hidden! [&_.om-rule]:hidden!',
  '[&_.om-chrome]:z-[6]!',
  '[&_.om-brand]:font-roman! [&_.om-brand]:text-[1.75rem]! [&_.om-brand]:not-italic! [&_.om-brand]:leading-none! [&_.om-brand]:tracking-[0.04em]! [&_.om-brand]:[color:var(--om-accent)]!',
  '[&_.om-eyebrow]:top-14! [&_.om-eyebrow]:[transform:translateX(-50%)]! [&_.om-eyebrow]:text-xs! [&_.om-eyebrow]:[color:var(--om-text)]! [&_.om-eyebrow]:leading-5! [&_.om-eyebrow]:tracking-[0.24em]! [&_.om-eyebrow]:w-max! [&_.om-eyebrow]:whitespace-pre-line! [&_.om-eyebrow]:text-center!',
  'max-sm:[&_.om-copy]:top-[7.25rem]! sm:[&_.om-copy]:top-[max(14%,6.5rem)]!',
  WORD_HALO,
  LIGHT_SAFE,
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
 * The card's top and foot sink into the page's ground, so it has no edge:
 * a veil of the ground over its first tenth and its last sixth, above the
 * flood, the backdrop, the vignette and the grain (all at the stage's own
 * level) and below the statue, the word and the interface, and the statue
 * itself fading out over the same stretches. The word and the interface
 * stand clear of both.
 */
const EDGES = [
  "[&_.om-stage]:after:pointer-events-none [&_.om-stage]:after:absolute [&_.om-stage]:after:inset-0 [&_.om-stage]:after:z-[1] [&_.om-stage]:after:content-['']",
  '[&_.om-stage]:after:bg-[linear-gradient(to_bottom,var(--om-ground),transparent_10%,transparent_84%,var(--om-ground))]',
  '[&_.om-cast]:[mask-image:linear-gradient(to_bottom,transparent,#000_10%,#000_84%,transparent)]',
].join(' ')

/**
 * The share of a card in view that starts its load: by then its word, which
 * stands in the middle of the card through the load, is on screen, so the
 * whole fill is seen. (Or the card fills the screen, where it is taller.)
 */
const ARRIVE_AT = 0.6

/**
 * The load: the word's outline is up well before the card arrives (it rises
 * in over the first two seconds after mounting), so the load waits at least
 * this long after mounting, for a card that mounts as it arrives (a fast
 * scroll, a page opened there). Then it is handed its full progress and the
 * component fills the word towards it, eased, within about 0.9 s.
 */
const OUTLINE_MS = 900

/** After the photographs have loaded, a moment for the component to read their sizes. */
const SETTLE_MS = 120

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
  // Where the card is: on screen at all (its light runs only then), and
  // arrived (its load starts, once; it unmounts after leaving).
  const [onScreen, setOnScreen] = useState(false)
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const watch = new IntersectionObserver(
      (entries) => {
        // The last entry is the card's current state.
        const entry = entries[entries.length - 1]
        setOnScreen(entry.isIntersecting)
        const fills = entry.rootBounds ? entry.intersectionRect.height >= 0.9 * entry.rootBounds.height : false
        if (entry.isIntersecting && (entry.intersectionRatio >= ARRIVE_AT || fills)) setArrived(true)
      },
      { threshold: [0, 0.25, 0.5, ARRIVE_AT] },
    )
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  // Settled: the photographs' sizes place them (the component reads them as
  // they load) and the card's width places a statue that reaches out. Until
  // both are known a still card is not shown (it would land, then shift),
  // and a playing card does not start its load (its unveil would show them
  // moving into place).
  const backdrop = product.preview?.desktop.src ?? null
  const statue = STATUES[product.id]?.photo.src ?? null
  const measured = stage.w > 0
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!measured) return
    let live = true
    let timer = 0
    const srcs = [statue, backdrop].filter((src): src is string => !!src)
    const loaded = (src: string) =>
      new Promise<void>((done) => {
        const img = new Image()
        img.onload = img.onerror = () => done()
        img.src = src
      })
    Promise.all(srcs.map(loaded)).then(() => {
      if (live) timer = window.setTimeout(() => setSettled(true), SETTLE_MS)
    })
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [measured, statue, backdrop])
  // The load starts on arrival, settled, and never before the outline has had OUTLINE_MS.
  const mountedAt = useRef(0)
  useEffect(() => {
    mountedAt.current = performance.now()
  }, [])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!arrived || !settled || still || loading) return
    const t = setTimeout(() => setLoading(true), Math.max(0, mountedAt.current + OUTLINE_MS - performance.now()))
    return () => clearTimeout(t)
  }, [arrived, settled, still, loading])
  const figure = titleCardFigure(product, index, phone, stage)
  const where = product.url ? domain(product.url) : 'Private'
  const n = toRoman(index + 1)
  // The light (shafts and dust on the component's canvas) runs while the
  // card is on screen; under reduced motion the component draws it once.
  const lit = still || (arrived && onScreen)
  return (
    <div ref={box} className="h-full" data-load={still ? undefined : loading ? 'started' : 'held'} style={still && !settled ? { opacity: 0 } : undefined}>
      <OldMastersPreloader
        // The load's progress is the card's own: nothing until it has
        // arrived, then all of it, which the component fills towards.
        progress={still ? undefined : loading ? 100 : 0}
        durationMs={900}
        minLoadMs={0}
        skippable={false}
        skipIntro={still}
        figures={figure ? [figure] : []}
        backdrop={backdrop}
        duotone
        rays={lit}
        dust={lit}
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
        className={`${LOOK} ${EDGES} ${product.title.length > LONG_TITLE ? WORD.long : WORD.short}`}
      />
    </div>
  )
}
