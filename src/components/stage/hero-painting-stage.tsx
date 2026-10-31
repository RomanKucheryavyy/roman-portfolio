'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import OldMastersPreloader, { type OldMastersFigure } from '@/components/ui/old-masters-preloader'
import { CAST } from './cast'
import { IMPERIAL } from './imperial'

/**
 * The stage inside the hero's painting (hero-painting.tsx loads it):
 * kedhareswer/old-masters-preloader as published, configured from outside,
 * painting one statue exactly as the intro paints its cast (the same
 * pre-keyed photograph, the same two-ink print in the imperial palette, the
 * same light and dust), on the hero's violet curtain instead of the intro's
 * flood.
 *
 * The composition is the hero's own, so it never repeats the landing a
 * visitor may have just seen lift away (Hercules and Apollo standing either
 * side of ROMAN on the floor) nor a product's title card (one statue to one
 * side of the product's word): Apollo alone, in the middle, a colossal
 * marble head (as the Romans carved their colossi) rising out of the dark
 * beneath the name, his face turned up to it and to the light falling from
 * above, in a pool of the intro's violet. He is sized and placed from the
 * hero's own words: his curls rise behind the surname's lower half, his
 * chin stops short of the tagline, and his curls stay clear of either side
 * of the screen. The photograph cuts his arm off at its right edge; the
 * painting fades out into the curtain well before that edge, and below his
 * chin, so the tagline and the buttons stand on the curtain, and the name
 * stands above him in the light.
 *
 * Nothing of the component's own interface: no word, tagline, nav, labels,
 * asides, call to action, count or plate (each emptied, and the interface
 * hidden whole), no flood (the curtain is the ground), no meander, no
 * backdrop. The landing is still (skipIntro): no load, no unveil.
 *
 * It arrives once the statue has decoded: the first time, he rises from
 * below as it fades in (after the intro has lifted off, when there was one);
 * when the hero comes back on screen, it simply fades in. Under reduced
 * motion it only fades, and the component holds its light and dust still.
 */

const APOLLO = CAST.apollo

/**
 * Where his head is in the photograph, as fractions of its width and
 * height, measured from the file's alpha (scripts/fetch-cast.mjs keyed it):
 * the crown of his curls, his chin, the curls' left and right, and the
 * height of his eyes (the middle of the fade into the curtain).
 */
const HEAD = { top: 0.03, chin: 0.45, left: 0.03, right: 0.4, eyes: 0.27 } as const

/** The middle of his head, curls and all, across the photograph. */
const HEAD_X = (HEAD.left + HEAD.right) / 2

/** The cast's files are pre-keyed (cast.ts): the component's own key only keeps their edge. */
const KEY = { threshold: 0.08, softness: 0.08 } as const

/** The first arrival rises; a return to the hero only fades in. */
let risen = false

/** Where the hero's words are, in px of the stage. */
export interface HeroWords {
  /** The surname's line: his curls may rise behind its lower part. */
  surname: { top: number; bottom: number }
  /** The top of the tagline: he fades out above it. */
  copy: number
}

interface Composition {
  figure: OldMastersFigure
  /** In px of the stage: the middle of his head at the height of his eyes (the centre of the fade into the curtain, and of the ground behind him), and its height. */
  face: { x: number; y: number; head: number }
  /** The fade into the curtain: an ellipse round his face, and below his chin a fade to nothing above the tagline. */
  mask: { rx: number; ry: number; from: number; to: number }
}

/** Apollo for a stage of w × h around the hero's words. */
export function compose(w: number, h: number, { surname, copy }: HeroWords): Composition | null {
  if (!(w > 0) || !(h > 0)) return null
  const aspect = APOLLO.width / APOLLO.height
  const head = HEAD.chin - HEAD.top
  // His curls rise behind the surname's lower half; below his chin his neck
  // fades into the dark, gone at the latest a few px above the tagline.
  const crown = surname.top + (surname.bottom - surname.top) * 0.4
  const to = copy - 6
  const chin = to - Math.max(36, h * 0.06)
  const room = Math.max(h * 0.18, chin - crown)
  // As tall as the room allows, with his curls clear of either side of the screen.
  const ph = Math.min(room / head, (w * 0.46) / ((HEAD_X - HEAD.left) * aspect))
  const pw = ph * aspect
  const top = chin - HEAD.chin * ph
  // His head in the middle of the stage (his face just right of it, turned up to the name).
  const left = w / 2 - HEAD_X * pw
  return {
    figure: {
      src: APOLLO.src,
      alt: APOLLO.alt,
      x: ((left + pw / 2) / w) * 100,
      y: ((top + ph) / h) * 100,
      h: (ph / h) * 100,
      depth: 0.85,
      ...KEY,
    },
    face: { x: w / 2, y: top + HEAD.eyes * ph, head: head * ph },
    // Gone soon below the chin: the cloak over his arm starts just under it.
    mask: { rx: pw * 0.4, ry: ph * 0.56, from: chin - ph * 0.02, to: Math.min(to, chin + Math.max(24, ph * 0.05)) },
  }
}

/**
 * From outside, by descendant classes (the component as published; its own
 * CSS is unlayered, so whatever it sets is overridden with !):
 * - its root and its stage are transparent, and its flood hidden, so the
 *   painting stands on the hero's curtain;
 * - none of its interface (the word, the chrome with its nav, pills, stars,
 *   asides, copy, call to action, count, plate and hint), no meander, no
 *   flash, no spotlight (it follows a pointer this box never gets), no
 *   shadow under the figure (his feet are far below the floor), no grain
 *   or vignette (the curtain has its own folds and shade);
 * - its light twice as strong (its shafts drawn a second time over
 *   themselves, by a drop shadow of their own colour): on the curtain the
 *   intro's strength barely showed;
 * - the cast fades into the curtain (the CSS variables set on the box, from
 *   compose()): an ellipse round his face, well inside the photograph's
 *   edges (it cuts his arm off at the right), and a fade below his chin
 *   that is gone above the tagline, so no word below the name stands on
 *   marble;
 * - the first time, he rises into place as the box fades in (RISE).
 */
const LOOK = [
  'bg-transparent! [&_.om-stage]:bg-transparent!',
  '[&_.om-flood]:hidden! [&_.om-ring]:hidden! [&_.om-wordlayer]:hidden! [&_.om-chrome]:hidden! [&_.om-flash]:hidden! [&_.om-spot]:hidden! [&_.om-fig-shadow]:hidden!',
  '[&_.om-grain]:hidden! [&_.om-vignette]:hidden!',
  '[&_.om-light]:[filter:blur(4px)_drop-shadow(0_0_0_var(--stage-glow))]!',
  '[&_.om-cast]:[mask-image:radial-gradient(var(--hp-rx)_var(--hp-ry)_at_var(--hp-x)_var(--hp-y),#000_42%,transparent),linear-gradient(to_bottom,#000_var(--hp-from),transparent_var(--hp-to))]',
  '[&_.om-cast]:[mask-composite:intersect]',
].join(' ')

/**
 * The rise: the statue only (the light is there already), from below,
 * through the cast's fade (the mask stays where it is, on the cast, while
 * the figure moves inside it), so he comes up out of the dark rather than
 * sliding in with his fade.
 */
const RISE = '[&_.om-tilt]:transition-[translate] [&_.om-tilt]:duration-[2600ms] [&_.om-tilt]:ease-[cubic-bezier(0.16,1,0.3,1)]'
const RISE_FROM = '[&_.om-tilt]:translate-y-[16%]'

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
  const [layout, setLayout] = useState<Composition | null>(null)
  const [decoded, setDecoded] = useState(false)
  const [shown, setShown] = useState(false)
  const [rise] = useState(() => !risen)

  // The hero's size and where its words are, whenever either moves.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const stage = el.getBoundingClientRect()
      const surname = document.querySelector('#hero-title > span:last-child')?.getBoundingClientRect()
      const copy = document.querySelector('[data-hero-copy]')?.getBoundingClientRect()
      if (!surname || !copy) return
      const next = compose(stage.width, stage.height, {
        surname: { top: surname.top - stage.top, bottom: surname.bottom - stage.top },
        copy: copy.top - stage.top,
      })
      setLayout((prev) => (prev && next && JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    measure()
    const watch = new ResizeObserver(measure)
    watch.observe(el)
    for (const words of document.querySelectorAll('#hero-title, [data-hero-copy]')) watch.observe(words)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => watch.disconnect()
  }, [])

  // The statue, decoded before it is shown (the component paints it as an <img>).
  useEffect(() => {
    let live = true
    const img = new Image()
    img.src = APOLLO.src
    img
      .decode()
      .catch(() => {})
      .then(() => live && setDecoded(true))
    return () => {
      live = false
    }
  }, [])

  // In: once decoded and laid out, after the component's first frames (it
  // opens without transitions, and sizes the figure from the photograph
  // once it has it).
  useEffect(() => {
    if (!decoded || !layout || shown) return
    const t = window.setTimeout(() => {
      setShown(true)
      risen = true
    }, 160)
    return () => window.clearTimeout(t)
  }, [decoded, layout, shown])

  const px = (n: number) => `${Math.round(n)}px`
  const vars = layout
    ? ({
        '--hp-x': px(layout.face.x),
        '--hp-y': px(layout.face.y),
        '--hp-rx': px(layout.mask.rx),
        '--hp-ry': px(layout.mask.ry),
        '--hp-from': px(layout.mask.from),
        '--hp-to': px(layout.mask.to),
      } as React.CSSProperties)
    : undefined

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
      style={vars}
    >
      {layout ? (
        // The ground he is painted on: a pool of the intro's flood (the
        // imperial violet, lifted warm at its heart) behind his head, so his
        // shadows read as the print's violet ink rather than the curtain's
        // folds, fading into the curtain at its edge.
        <div
          className="absolute rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--stage-accent)_86%,var(--stage-glow)),var(--stage-accent)_48%,color-mix(in_srgb,var(--stage-accent)_72%,transparent)_68%,transparent)]"
          style={{
            left: layout.face.x - layout.face.head * 1.35,
            top: layout.face.y - layout.face.head * 1.35,
            width: layout.face.head * 2.7,
            height: layout.face.head * 2.7,
          }}
        />
      ) : null}
      {layout ? (
        <OldMastersPreloader
          skipIntro
          skippable={false}
          figures={[layout.figure]}
          backdrop={null}
          duotone
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
