'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import OldMastersPreloader, { type OldMastersFigure } from '@/components/ui/old-masters-preloader'
import { CAST } from './cast'
import { IMPERIAL } from './imperial'

/**
 * The stage inside the hero's painting (hero-painting.tsx loads it):
 * kedhareswer/old-masters-preloader as published, configured from outside,
 * painting the hero's page of the intro's print: the same pre-keyed
 * photographs, the same two-ink print of the marble in the palette, the
 * same blurred David behind (CAST.david, as the intro has him), still.
 *
 * Its figure is Hercules, so the page never repeats the landing a visitor
 * may have just seen lift away (Apollo on a phone; Hercules and Apollo at the
 * sides of ROMAN wider) nor the first product's title card (Apollo again):
 * a statue standing in the print, cut at the page's foot as the intro's
 * Apollo is, his head bowed, his words above him and his name across his
 * chest. He is placed from where the hero's words are (compose, below): on
 * a phone or a tall screen in the middle, his crown just under the two ways
 * in; on a wide screen on the right, beside the words, his chin at the
 * name's top.
 *
 * Nothing of the component's own interface, loading or ornament: no word,
 * tagline, nav, pills, stars, asides, call to action, count, barcode or
 * plate (each emptied, and the interface hidden whole), no meander. No
 * light of any kind: no shafts, no dust, no spotlight, no flash. The
 * flood, the vignette and the grain are the hero's own (stage.tsx), so they
 * are there before this lands and without it, and lie under and over it
 * exactly as the component's would. The landing is still (skipIntro): no
 * load, no unveil, and the figure does not bob.
 *
 * It arrives once the statue has decoded: the first time, he rises from
 * below as it fades in (after the intro has lifted off, when there was one);
 * when the hero comes back on screen, it simply fades in. Under reduced
 * motion it only fades.
 */

const HERCULES = CAST.hercules

/**
 * Where his head is in the photograph, as fractions of its width and
 * height, measured from the file's alpha (scripts/fetch-cast.mjs keyed it):
 * the crown of his curls, the foot of his beard, the curls' left and right.
 */
export const HEAD = { top: 0.046, chin: 0.44, left: 0.369, right: 0.594 } as const

/** The middle of his head, curls and all, across the photograph. */
const HEAD_X = (HEAD.left + HEAD.right) / 2

/** The cast's files are pre-keyed (cast.ts): the component's own key only keeps their edge. */
const KEY = { threshold: 0.08, softness: 0.08 } as const

/** On a phone or a tall screen: his head and the chest under it take this share of his room; the rest of his chest stands behind the name. */
const TALL_SHARE = 0.66

/** His head at most this wide, as a share of the page's width: centred, and beside the words on a wide screen. */
const MAX_HEAD_W = { tall: 0.56, wide: 0.25 } as const

/** The first arrival rises; a return to the hero only fades in. */
let risen = false

/** Where the hero's words are, in px of the stage. */
export interface HeroWords {
  /** The tagline and the two ways in. */
  copy: { left: number; right: number; top: number; bottom: number }
  /** The top of the name (its capitals). */
  name: number
}

/** Hercules for a stage of w × h around the hero's words, or nothing before there is a stage. */
export function compose(w: number, h: number, { copy, name }: HeroWords): OldMastersFigure | null {
  if (!(w > 0) || !(h > 0)) return null
  const aspect = HERCULES.width / HERCULES.height
  const head = HEAD.chin - HEAD.top
  const headWidth = (ph: number) => (HEAD.right - HEAD.left) * ph * aspect
  // A wide screen sets the words at the left (stage.tsx), and him beside them.
  const wide = (copy.left + copy.right) / 2 < w * 0.4
  let crown: number
  let ph: number
  let cx: number
  if (wide) {
    // From the words' top to the name's: his chin at the name, his chest behind it.
    crown = Math.max(copy.top - h * 0.02, 72)
    ph = Math.min(((name - crown) * 0.96) / head, (w * MAX_HEAD_W.wide) / headWidth(1))
    const hw = headWidth(ph)
    cx = Math.min(Math.max(w * 0.68, copy.right + 32 + hw / 2), w - hw * 0.8)
  } else {
    // His crown under the two ways in; his head and the top of his chest in
    // his room, the rest of him behind the name and past the page's foot.
    const top = copy.bottom + Math.max(14, h * 0.022)
    const room = Math.max(h * 0.2, name - top)
    ph = Math.min((room * TALL_SHARE) / head, (w * MAX_HEAD_W.tall) / headWidth(1))
    // Any room left over goes half above him, half to his chest.
    crown = top + Math.max(0, room - (head * ph) / TALL_SHARE) / 2
    cx = w / 2
  }
  const pw = ph * aspect
  const top = crown - HEAD.top * ph
  const left = cx - HEAD_X * pw
  return {
    src: HERCULES.src,
    alt: HERCULES.alt,
    x: ((left + pw / 2) / w) * 100,
    y: ((top + ph) / h) * 100,
    h: (ph / h) * 100,
    depth: 0.85,
    ...KEY,
  }
}

/**
 * From outside, by descendant classes (the component as published; its own
 * CSS is unlayered, so whatever it sets is overridden with !): its root and
 * stage transparent and its flood, vignette and grain hidden (the hero's
 * own are beneath and above); none of its interface, meander, word, flash,
 * spotlight or light canvas; no shadow under the figure (his feet are far
 * below the page); the figure still. The first time, he rises into place as
 * the box fades in (RISE).
 */
const LOOK = [
  'bg-transparent! [&_.om-stage]:bg-transparent!',
  '[&_.om-flood]:hidden! [&_.om-vignette]:hidden! [&_.om-grain]:hidden!',
  '[&_.om-ring]:hidden! [&_.om-wordlayer]:hidden! [&_.om-chrome]:hidden! [&_.om-flash]:hidden! [&_.om-spot]:hidden! [&_.om-light]:hidden! [&_.om-fig-shadow]:hidden!',
  '[&_.om-fig-in]:animate-none!',
].join(' ')

/**
 * The rise: the statue only (the backdrop is there already), from below,
 * so he comes up out of the print's foot rather than sliding in whole.
 */
const RISE = '[&_.om-tilt]:transition-[translate] [&_.om-tilt]:duration-[2600ms] [&_.om-tilt]:ease-[cubic-bezier(0.16,1,0.3,1)]'
const RISE_FROM = '[&_.om-tilt]:translate-y-[12%]'

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

export default function HeroPaintingStage() {
  const still = useMedia('(prefers-reduced-motion: reduce)')
  const box = useRef<HTMLDivElement>(null)
  const [figure, setFigure] = useState<OldMastersFigure | null>(null)
  const [decoded, setDecoded] = useState(false)
  const [shown, setShown] = useState(false)
  const [rise] = useState(() => !risen)

  // The hero's size and where its words are, whenever either moves.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const stage = el.getBoundingClientRect()
      const copy = document.querySelector('[data-hero-copy]')?.getBoundingClientRect()
      const name = document.querySelector('#hero-title')?.getBoundingClientRect()
      if (!copy || !name) return
      const next = compose(stage.width, stage.height, {
        copy: { left: copy.left - stage.left, right: copy.right - stage.left, top: copy.top - stage.top, bottom: copy.bottom - stage.top },
        name: name.top - stage.top,
      })
      setFigure((prev) => (prev && next && JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    for (const words of document.querySelectorAll('#hero-title, [data-hero-copy]')) watch.observe(words)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => watch.disconnect()
  }, [])

  // The statue and the backdrop, decoded before they are shown (the component paints them as <img>s).
  useEffect(() => {
    let live = true
    const decode = (src: string) => {
      const img = new Image()
      img.src = src
      return img.decode().catch(() => {})
    }
    Promise.all([decode(HERCULES.src), decode(CAST.david.src)]).then(() => live && setDecoded(true))
    return () => {
      live = false
    }
  }, [])

  // In: once decoded and laid out, after the component's first frames (it
  // opens without transitions, and sizes the figure from the photograph
  // once it has it).
  useEffect(() => {
    if (!decoded || !figure || shown) return
    const t = window.setTimeout(() => {
      setShown(true)
      risen = true
    }, 160)
    return () => window.clearTimeout(t)
  }, [decoded, figure, shown])

  const rising = rise && !still
  return (
    <div
      ref={box}
      data-shown={shown ? 'true' : 'false'}
      className={[
        'absolute inset-0 transition-opacity ease-out',
        rising ? 'duration-[1800ms]' : 'duration-500',
        shown ? 'opacity-100' : 'opacity-0',
        rising ? RISE : '',
        rising && !shown ? RISE_FROM : '',
      ].join(' ')}
    >
      {figure ? (
        <OldMastersPreloader
          skipIntro
          skippable={false}
          figures={[figure]}
          backdrop={CAST.david.src}
          duotone
          rays={false}
          dust={false}
          tone="noir"
          palette={IMPERIAL}
          tilt={0}
          fontHref={null}
          wordmark=""
          wordAs="p"
          tagline=""
          eyebrow=""
          brand=""
          nav={[]}
          labels={[]}
          asides={[]}
          annotations={[]}
          plate=""
          loadingLabel=""
          cta={{ label: '' }}
          height="100%"
          className={LOOK}
        />
      ) : null}
    </div>
  )
}
