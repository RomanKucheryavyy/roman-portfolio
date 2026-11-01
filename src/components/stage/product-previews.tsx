'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import { Pause, Play } from 'lucide-react'
import { Iphone16Pro } from '@/components/ui/iphone-16-pro'
import { Safari } from '@/components/ui/safari'
import type { FlowNode, Product, Shot } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { monthYear } from '@/lib/site-facts'
import { cn } from '@/lib/utils'
import { PALETTE } from './imperial'
import { KICKER } from './look'
import { CAPTION_ROW, flowBox, LIVE_BOX } from './preview-box'

/**
 * The Products act's previews (products.tsx draws the act and loads these
 * after the page, behind blocks of the same size): a public product's live
 * site in a browser and a phone, a private product's parts set as an
 * inscription, in its description's words.
 */

const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/* ------------------------------------------------------------- motion -- */

const watch = (query: string) => (change: () => void) => {
  const list = window.matchMedia(query)
  list.addEventListener('change', change)
  return () => list.removeEventListener('change', change)
}

const CALM = '(prefers-reduced-motion: reduce)'
const watchCalm = watch(CALM)
/**
 * Whether the visitor asks for less motion. Until the browser has said (the
 * first render), assume they do, so nothing moves and no Pause button is
 * drawn for a moment rather than the other way round.
 */
function useCalm() {
  return useSyncExternalStore(watchCalm, () => window.matchMedia(CALM).matches, () => true)
}

/**
 * Where an element is: `off` screen, at the `edge` (some of it showing), or
 * `in` view (at least 60% of it, or of the screen when it is the taller).
 */
type View = 'off' | 'edge' | 'in'
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)
function useView(ref: RefObject<Element | null>) {
  const [view, setView] = useState<View>('off')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const watcher = new IntersectionObserver(
      (entries) => {
        // One batch can hold an older entry for the same element (observed,
        // then scrolled to, in one frame): the last one is where it is now.
        const entry = entries[entries.length - 1]
        if (!entry.isIntersecting) return setView('off')
        const screen = entry.rootBounds?.height ?? window.innerHeight
        const enough = 0.6 * Math.min(entry.boundingClientRect.height, screen)
        setView(entry.intersectionRect.height >= enough - 1 ? 'in' : 'edge')
      },
      { threshold: STEPS },
    )
    watcher.observe(el)
    return () => watcher.disconnect()
  }, [ref])
  return view
}

/**
 * The visitor's own Pause / Play, which every looping preview has (WCAG
 * 2.2.2: anything that moves by itself for more than five seconds can be
 * stopped). Its name says what it will do, as the WAI carousel pattern's
 * does. No box: its icon and its word in the Stage's Geist capitals, quiet
 * until hovered, in a 44px-tall tap target.
 */
function Toggle({ stopped, onToggle, what }: { stopped: boolean; onToggle: () => void; what: string }) {
  const Icon = stopped ? Play : Pause
  const verb = stopped ? 'Play' : 'Pause'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${verb} the ${what}`}
      className="-mr-2 inline-flex h-11 shrink-0 items-center gap-2 px-2 font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-300 hover:text-glow"
    >
      <Icon aria-hidden="true" className="size-3" />
      {verb}
    </button>
  )
}

/**
 * The act's glow behind a preview: the Act II header's wash (the same
 * --stage-wash), reaching past the frames so it shows around them.
 */
function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -z-10 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--stage-wash)_85%,transparent),transparent)]',
        className,
      )}
    />
  )
}

/* ------------------------------------------------------------ screens -- */

/** Scroll speed in CSS px a second, how long it rests at the top and the bottom, and the easing of each pass. */
const SPEED = 42
const REST = 2200
const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)'

/** Puts an animation back at the start of its loop. */
const toStart = (animation: Animation) => {
  animation.currentTime = 0
}

/** One loop of a shot `distance` px taller than its screen, in a loop of `total` ms whose passes take `leg`. */
function scrollFrames(distance: number, leg: number, total: number): Keyframe[] {
  const top = 'translate3d(0, 0, 0)'
  const end = `translate3d(0, ${-distance}px, 0)`
  return [
    { transform: top, offset: 0 },
    { transform: top, offset: REST / total, easing: EASE },
    { transform: end, offset: (REST + leg) / total },
    { transform: end, offset: (2 * REST + leg) / total, easing: EASE },
    { transform: top, offset: 1 },
  ]
}

/**
 * A preview's screenshots scrolling in their screens: each down to the end of
 * its shot and back up, slowly, resting at each end, as one transform
 * animation per shot (Web Animations, which the compositor runs, so the
 * page's own scroll never waits on it). The shots share one loop, its length
 * set by the longer pass, so the browser and the phone reach the bottom of
 * their pages, and the top again, together. Rebuilt from where it was when a
 * screen changes size (one that is not shown, the browser below md, is left
 * out). It runs while `play`, and goes back to the start of its loop (the
 * top of the page) whenever `rewind` turns true. Under reduced motion it is
 * never built, and the shots show their top.
 */
function useScrolling(
  screens: RefObject<(HTMLDivElement | null)[]>,
  shots: RefObject<(HTMLImageElement | null)[]>,
  { play, rewind, calm }: { play: boolean; rewind: boolean; calm: boolean },
) {
  const scrolls = useRef<Animation[]>([])
  const playing = useRef(play)

  useEffect(() => {
    playing.current = play
    for (const a of scrolls.current) {
      if (play) a.play()
      else a.pause()
    }
  }, [play])

  useEffect(() => {
    if (rewind) for (const a of scrolls.current) toStart(a)
  }, [rewind])

  useEffect(() => {
    if (calm) return
    const pairs = screens.current.flatMap((screen, i) => {
      const shot = shots.current[i]
      return screen && shot ? [{ screen, shot }] : []
    })
    if (!pairs.length) return
    let current: Animation[] = []
    const build = () => {
      const shown = pairs
        .map(({ screen, shot }) => ({ shot, height: screen.clientHeight, distance: Math.round(shot.offsetHeight - screen.clientHeight) }))
        .filter((s) => s.height > 0 && s.distance > 0)
      // Where the loop was, as a share of it, so a rebuild carries on from there.
      const was = current[0]
      const timing = was?.effect?.getTiming()
      const at = was && timing ? (Number(was.currentTime ?? 0) % Number(timing.duration)) / Number(timing.duration) : 0
      for (const a of current) a.cancel()
      current = []
      if (shown.length) {
        const leg = Math.min(Math.max((Math.max(...shown.map((s) => s.distance)) / SPEED) * 1000, 9000), 42_000)
        const total = 2 * leg + 2 * REST
        current = shown.map(({ shot, distance }) => shot.animate(scrollFrames(distance, leg, total), { duration: total, iterations: Infinity }))
        for (const a of current) {
          a.currentTime = at * total
          if (!playing.current) a.pause()
        }
      }
      scrolls.current = current
    }
    const resize = new ResizeObserver(build)
    for (const { screen, shot } of pairs) {
      resize.observe(screen)
      resize.observe(shot)
    }
    return () => {
      resize.disconnect()
      for (const a of current) a.cancel()
      scrolls.current = []
    }
  }, [screens, shots, calm])
}

/** A real screenshot, as tall as the stretch of page it shows, in a frame's screen. */
function Screen({
  shot,
  alt,
  style,
  screenRef,
  shotRef,
}: {
  shot: Shot
  alt: string
  style: CSSProperties
  screenRef: (el: HTMLDivElement | null) => void
  shotRef: (el: HTMLImageElement | null) => void
}) {
  return (
    <div ref={screenRef} data-preview-screen="" className="absolute overflow-hidden bg-neutral-100" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={shotRef}
        src={shot.src}
        width={shot.width}
        height={shot.height}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-auto w-full max-w-none select-none"
      />
    </div>
  )
}

/**
 * Where each frame's screen is, as a share of the frame: the published
 * frames' own geometry, so the shot sits exactly in the glass.
 * - Safari (dillionverma/safari), 1203×753: the page area at (1, 52),
 *   1200×700, with 11px bottom corners. The shot is laid over the frame.
 * - iPhone 16 Pro (designali-in/iphone-16-pro), 200×400: the screen at
 *   (14.08, 12.81), 171.98×374.37, 24.62px corners. The frame is drawn over
 *   the shot, its screen (`currentColor`) made transparent from outside, so
 *   the Dynamic Island sits on the page as on a phone (over the status-bar
 *   band each phone shot starts with: scripts/capture-products.mjs).
 */
const SAFARI_SCREEN: CSSProperties = {
  left: `${(1 / 1203) * 100}%`,
  top: `${(52 / 753) * 100}%`,
  width: `${(1200 / 1203) * 100}%`,
  height: `${(700 / 753) * 100}%`,
  borderRadius: `0 0 ${(11 / 1200) * 100}% ${(11 / 1200) * 100}% / 0 0 ${(11 / 700) * 100}% ${(11 / 700) * 100}%`,
}
const PHONE_SCREEN: CSSProperties = {
  left: `${(14.08 / 200) * 100}%`,
  top: `${(12.81 / 400) * 100}%`,
  width: `${(171.98 / 200) * 100}%`,
  height: `${(374.37 / 400) * 100}%`,
  borderRadius: `${(24.62 / 171.98) * 100}% / ${(24.62 / 374.37) * 100}%`,
}

/**
 * A public product's live preview: its site in a browser frame, and the same
 * site on a phone overlapping its lower corner, each scrolling its real
 * screenshot, at every width (on a phone, the desktop's composition at a
 * phone's scale). The preview links to the site. It moves only while it is
 * in view (most of it on screen), and starts from the top of the page each
 * time it comes back after leaving the screen, so every visit begins on
 * the site's first screen. It holds still while the pointer is over it or
 * the link has focus, after Pause, and always under reduced motion. Under
 * it, one quiet line: the site and when the shots were taken.
 */
export function LivePreview({ product, flip }: { product: Product; flip: boolean }) {
  const figure = useRef<HTMLElement>(null)
  const screens = useRef<(HTMLDivElement | null)[]>([null, null])
  const shots = useRef<(HTMLImageElement | null)[]>([null, null])
  const view = useView(figure)
  const calm = useCalm()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [stopped, setStopped] = useState(false)
  useScrolling(screens, shots, {
    play: view === 'in' && !hovered && !focused && !stopped,
    // Off screen, back to the top of the page (unless the visitor stopped it
    // where it was), so the next visit starts on the site's first screen.
    rewind: view === 'off' && !stopped,
    calm,
  })

  const preview = product.preview
  if (!preview || !product.url) return null
  const site = domain(product.url)

  return (
    <figure ref={figure} data-preview="live" data-product={product.id} data-view={view} className="relative">
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${site}`}
        className={cn('group relative isolate block rounded-[4px]', LIVE_BOX)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <Glow className="-inset-x-[10%] -inset-y-[12%] md:-inset-x-[6%] md:-inset-y-[16%]" />
        <div className={cn('absolute top-0 aspect-[1203/753] w-[90%] md:w-[88%]', flip ? 'left-0' : 'right-0')}>
          <Safari url={site} aria-hidden="true" focusable="false" className="absolute inset-0 size-full" />
          <Screen
            shot={preview.desktop}
            alt={`Screenshot of ${site} in a desktop browser`}
            style={SAFARI_SCREEN}
            screenRef={(el) => void (screens.current[0] = el)}
            shotRef={(el) => void (shots.current[0] = el)}
          />
        </div>
        <div
          className={cn(
            'absolute bottom-0 z-10 aspect-[1/2] w-[31%] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 md:w-[27%]',
            flip ? 'right-0' : 'left-0',
          )}
        >
          <Screen
            shot={preview.phone}
            alt={`Screenshot of ${site} on a phone`}
            style={PHONE_SCREEN}
            screenRef={(el) => void (screens.current[1] = el)}
            shotRef={(el) => void (shots.current[1] = el)}
          />
          <Iphone16Pro
            aria-hidden="true"
            focusable="false"
            className="absolute inset-0 size-full text-transparent drop-shadow-[0_18px_32px_color-mix(in_oklab,var(--stage-shadow)_80%,transparent)]"
          />
        </div>
      </a>
      <figcaption className={CAPTION_ROW}>
        <span className="min-w-0 truncate">
          {site} <span aria-hidden="true">·</span> {monthYear(preview.captured)}
        </span>
        {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} preview`} />}
      </figcaption>
    </figure>
  )
}

/* --------------------------------------------------- the inscriptions -- */

/**
 * A private product, which has no public screens, set as an inscription
 * of its parts: no boxes, no lines, no icons; only its description's words
 * (the flow in constants.ts), in the Stage's type. Names in Cinzel, what
 * each does in his voice's Cormorant italic, a count the description spells
 * out as a gold numeral, and the links it states carried by the reading
 * order alone (and listed for screen readers):
 *
 * - a desk (parts working into the product, the product working through
 *   another): its parts, the counted one first and set large, then where
 *   it works through, after the description's own words that lead there
 *   (the product's own line, the description's first sentence, is not set:
 *   the description beside it opens with it);
 * - a chain (each part passing to the next): its steps numbered I, II, III
 *   in the links' order, the product among them with its own line.
 */

/** A part's whole name, as the description gives it ("Eighteen investor personas"). */
const nameOf = (node: FlowNode) => (node.count ? `${node.count.word} ${node.label}` : node.label)

/** The ids of a chain's steps in the order its links run, the product among them; null if the links are not one chain. */
function chainOf(productId: string, flow: NonNullable<Product['flow']>): string[] | null {
  const next = new Map(flow.links.map(([from, to]) => [from, to]))
  const takes = new Set(flow.links.map(([, to]) => to))
  if (next.size !== flow.links.length || takes.size !== flow.links.length) return null
  const first = [...next.keys()].find((id) => !takes.has(id))
  const order: string[] = []
  for (let id = first; id && !order.includes(id); id = next.get(id)) order.push(id)
  return order.length === flow.links.length + 1 && order.includes(productId) ? order : null
}

/** The inscription's type: names in Cinzel, marble; notes in Cormorant italic (18px and up on a phone), in the body ink. */
const NAME = 'font-roman text-[1.0625rem] font-medium leading-snug tracking-[0.04em] text-foreground md:text-xl lg:text-[1.375rem]'
const NOTE = 'font-serif text-[1.1875rem] italic leading-snug text-(--stage-text) text-pretty md:text-[1.375rem]'

function Desk({ product, flow }: { product: Product; flow: NonNullable<Product['flow']> }) {
  const into = (n: FlowNode) => flow.links.some(([from, to]) => from === n.id && to === product.id)
  const out = (n: FlowNode) => flow.links.some(([from, to]) => from === product.id && to === n.id)
  const parts = flow.nodes.filter(into)
  return (
    <div className="flex flex-col items-center text-center">
      {parts
        .filter((n) => n.count)
        .map((n) => (
          <div key={n.id} data-line="">
            <p aria-hidden="true" data-strike="" className="font-roman text-[clamp(4.5rem,24vw,5.5rem)] font-medium leading-[0.86] tracking-[0.04em] text-gold md:text-[8rem] lg:text-[9rem]">
              {toRoman(n.count!.value)}
            </p>
            <p className="mt-3 text-balance md:mt-4">
              <span className="sr-only">{n.count!.word} </span>
              {/* The interpunct stays with the name, so a line that breaks breaks after it. */}
              <span className="whitespace-nowrap">
                <span className={NAME}>{n.label}</span> <span aria-hidden="true" className="text-gold">·</span>
              </span>{' '}
              <span className={NOTE}>{n.note}</span>
            </p>
          </div>
        ))}
      <div className="mt-8 grid w-full max-w-[40rem] gap-6 md:mt-12 md:grid-cols-2 md:gap-x-10">
        {parts
          .filter((n) => !n.count)
          .map((n) => (
            <div key={n.id} data-line="">
              <p className={cn(NAME, 'text-balance')}>{n.label}</p>
              <p className={cn('mt-1', NOTE)}>{n.note}</p>
            </div>
          ))}
      </div>
      {flow.nodes.filter(out).map((n) => (
        <div key={n.id} data-line="" className="mt-9 md:mt-12">
          {n.lead ? <p className={KICKER}>{n.lead}</p> : null}
          <p className="mt-2 font-roman text-[1.75rem] font-medium leading-tight tracking-[0.04em] text-foreground md:text-[2.25rem]">{n.label}</p>
          <p className={NOTE}>{n.note}</p>
        </div>
      ))}
    </div>
  )
}

function Chain({ product, flow, order }: { product: Product; flow: NonNullable<Product['flow']>; order: string[] }) {
  return (
    <ol className="mx-auto grid w-full max-w-[34rem] gap-y-7 md:gap-y-10 lg:gap-y-12">
      {order.map((id, i) => {
        const node = flow.nodes.find((n) => n.id === id)
        const own = id === product.id
        return (
          <li key={id} data-line="" data-pulse="" className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-4 md:grid-cols-[4.5rem_minmax(0,1fr)] md:gap-x-7 lg:grid-cols-[5.25rem_minmax(0,1fr)]">
            <span aria-hidden="true" className="text-right font-roman text-[2rem] font-medium leading-none tracking-[0.04em] text-gold md:text-5xl lg:text-[3.5rem]">
              {toRoman(i + 1)}
            </span>
            <div>
              <p className={cn(NAME, 'lg:text-2xl')}>{own ? product.title : node && nameOf(node)}</p>
              <p className={cn('mt-1', NOTE, 'lg:text-2xl')}>{own ? flow.hub : node?.note}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const RISE_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const RISE: Keyframe[] = [
  { opacity: 0, transform: 'translateY(1.25rem)' },
  { opacity: 1, transform: 'none' },
]
/** The count's numeral strikes in: from a little large and lit, to its place. */
const STRIKE: Keyframe[] = [
  { opacity: 0, transform: 'scale(1.08)', textShadow: `0 0 36px ${PALETTE.glow}` },
  { opacity: 1, transform: 'none', textShadow: `0 0 0 ${PALETTE.glow}00` },
]

/**
 * The inscription's entrance: its lines rise in one after another as it
 * arrives, and a counted numeral strikes in, once. Only an inscription that
 * starts below the screen is held (each line at its first frame) until it
 * enters; one on screen or above it gets none, one jumped past is let go
 * whole, and nothing moves under reduced motion. Each animation ends where
 * the markup stands and lets go. Returns whether the entrance is over (or
 * there was none), for what moves after it.
 */
function useEntrance(ref: RefObject<HTMLElement | null>, calm: boolean): boolean {
  const [over, setOver] = useState(false)
  useEffect(() => {
    const box = ref.current
    if (!box) return
    let frame = 0
    if (calm || box.getBoundingClientRect().top < innerHeight) {
      frame = requestAnimationFrame(() => setOver(true))
      return () => cancelAnimationFrame(frame)
    }
    const lines = [...box.querySelectorAll<HTMLElement>('[data-line]')]
    const anims = lines.map((el, i) => el.animate(RISE, { duration: 800, delay: i * 90, easing: RISE_EASE, fill: 'both' }))
    lines.forEach((el, i) => {
      const numeral = el.querySelector<HTMLElement>('[data-strike]')
      if (numeral) anims.push(numeral.animate(STRIKE, { duration: 1200, delay: i * 90 + 90, easing: RISE_EASE, fill: 'both' }))
    })
    for (const a of anims) a.pause()
    Promise.all(anims.map((a) => a.finished)).then(
      () => {
        for (const a of anims) a.cancel()
        setOver(true)
      },
      () => {},
    )
    // It goes as its first line comes onto the screen (the block's own room
    // above the words is no arrival), so the lines rise where they are seen,
    // with no wait; one jumped past is let go whole.
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry.isIntersecting) return
        io.disconnect()
        // Passed unseen, or landed on by the intro's nav as it lifts: whole.
        if (entry.boundingClientRect.bottom > 0 && !document.documentElement.hasAttribute('data-intro')) for (const a of anims) a.play()
        else {
          for (const a of anims) a.cancel()
          setOver(true)
        }
      },
      { rootMargin: '100000px 0px 0px 0px' },
    )
    io.observe(lines[0] ?? box)
    return () => {
      io.disconnect()
      for (const a of anims) a.cancel()
    }
  }, [ref, calm])
  return over
}

/** How lit a chain's step stands while another's turn runs: dim, and still clear of AA for its words (5.5:1 on the ground). */
const DIM = 0.55
/** Each step's turn, and the rest after the last. */
const TURN = 900
const PAUSE = 700

/**
 * A chain's pulse: while it runs, its steps stand dim and light up one
 * after another, top to bottom, as a capture passes down it. When it stops
 * (Pause, off screen) every step comes back to full.
 */
function usePulse(ref: RefObject<HTMLElement | null>, run: boolean) {
  useEffect(() => {
    const box = ref.current
    if (!box || !run) return
    const steps = [...box.querySelectorAll<HTMLElement>('[data-pulse]')]
    const total = steps.length * TURN + PAUSE
    const at = (ms: number) => Math.min(1, Math.max(0, ms / total))
    const anims = steps.flatMap((el, i) => {
      // The first step starts lit, its peak at the loop's seam; the others settle to dim first.
      const frames: Keyframe[] =
        i === 0
          ? [
              { opacity: 1, offset: 0 },
              { opacity: DIM, offset: at(TURN), easing: 'ease-in-out' },
              { opacity: DIM, offset: at(total - TURN / 2), easing: 'ease-in-out' },
              { opacity: 1, offset: 1 },
            ]
          : [
              { opacity: DIM, offset: 0 },
              { opacity: DIM, offset: at(i * TURN - TURN / 2), easing: 'ease-in-out' },
              { opacity: 1, offset: at(i * TURN), easing: 'ease-in-out' },
              { opacity: DIM, offset: at(i * TURN + TURN), easing: 'ease-in-out' },
              { opacity: DIM, offset: 1 },
            ]
      const settle = i === 0 ? [] : [el.animate([{ opacity: 1 }, { opacity: DIM }], { duration: 600, easing: 'ease', fill: 'forwards' })]
      return [...settle, el.animate(frames, { duration: total, delay: 600, iterations: Infinity })]
    })
    return () => {
      // Back to full from wherever each step stood.
      for (const el of steps) {
        const now = getComputedStyle(el).opacity
        for (const a of el.getAnimations()) a.cancel()
        el.animate([{ opacity: now }, { opacity: 1 }], { duration: 400, easing: 'ease' })
      }
      for (const a of anims) a.cancel()
    }
  }, [ref, run])
}

/**
 * A private product's inscription (above), in a block of fixed height
 * (preview-box.ts) with its words in the middle. A chain pulses while it is
 * on screen, and has its Pause; a desk only moves as it arrives, so it has
 * none. Screen readers get the links as a list.
 */
export function ProductParts({ product }: { product: Product }) {
  const figure = useRef<HTMLElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const view = useView(figure)
  const calm = useCalm()
  const [stopped, setStopped] = useState(false)
  const flow = product.flow
  const chain = flow ? chainOf(product.id, flow) : null
  const over = useEntrance(box, calm)
  usePulse(box, !!chain && over && view !== 'off' && !stopped && !calm)
  if (!flow) return null
  const name = (id: string) => {
    const node = flow.nodes.find((n) => n.id === id)
    return node ? nameOf(node) : product.title
  }
  return (
    <figure ref={figure} data-preview="flow" data-product={product.id} className="relative">
      <div className="relative isolate">
        <Glow className="-inset-x-[8%] inset-y-[6%] md:-inset-x-[6%] md:inset-y-0" />
        <div
          ref={box}
          role="group"
          aria-label={`The parts of ${product.title}`}
          data-inscription={chain ? 'chain' : 'desk'}
          className={cn('flex flex-col justify-center', flowBox(flow))}
        >
          {chain ? <Chain product={product} flow={flow} order={chain} /> : <Desk product={product} flow={flow} />}
          <ul className="sr-only">
            {flow.links.map(([from, to]) => (
              <li key={`${from}-${to}`}>
                From {name(from)} to {name(to)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {chain ? (
        <div className={cn(CAPTION_ROW, 'justify-end')}>
          {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} pulse`} />}
        </div>
      ) : null}
    </figure>
  )
}
