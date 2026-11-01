'use client'

import { createRef, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import {
  CalendarClock,
  ChartCandlestick,
  MessagesSquare,
  Pause,
  Play,
  Radar,
  Route,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Iphone16Pro } from '@/components/ui/iphone-16-pro'
import { AnimatedBeam } from '@/components/ui/klyv-animated-beam'
import { Safari } from '@/components/ui/safari'
import type { FlowNode, Product, Shot } from '@/lib/content'
import { monthYear } from '@/lib/site-facts'
import { cn } from '@/lib/utils'
import { CAPTION_ROW, FLOW_BOX, LIVE_BOX } from './preview-box'

/**
 * The Products act's previews (products.tsx draws the act and loads these
 * after the page, behind blocks of the same size): a public product's live
 * site in a browser and a phone, a private product's parts around it.
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

/** Tailwind's md, where the diagrams turn from rows into columns. */
const WIDE = '(min-width: 48rem)'
const watchWide = watch(WIDE)
function useWide() {
  return useSyncExternalStore(watchWide, () => window.matchMedia(WIDE).matches, () => true)
}

/**
 * Whether an element is at least `min` px wide, as it resizes: the diagram
 * panel, whose columns from md fit their notes only from 40rem (at lg, where
 * the act's split leaves it narrower, they go without).
 */
function useRoomy(ref: RefObject<HTMLElement | null>, min: number) {
  const [roomy, setRoomy] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = new ResizeObserver(() => setRoomy(el.offsetWidth >= min))
    resize.observe(el)
    return () => resize.disconnect()
  }, [ref, min])
  return roomy
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
 * The visitor's own Pause / Play, which every moving preview has (WCAG 2.2.2:
 * anything that moves by itself for more than five seconds can be stopped).
 * Its name says what it will do, as the WAI carousel pattern's does. Drawn as
 * the Stage's buttons are (look.ts: rectangular, Geist capitals), but quiet:
 * a quiet rule that turns gold on hover, so it never competes with the
 * row's own link.
 */
function Toggle({ stopped, onToggle, what }: { stopped: boolean; onToggle: () => void; what: string }) {
  const Icon = stopped ? Play : Pause
  const verb = stopped ? 'Play' : 'Pause'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${verb} the ${what}`}
      className="inline-flex h-8 shrink-0 items-center gap-2 rounded-[2px] border border-border px-3 font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-colors duration-300 hover:border-gold/70 hover:text-foreground"
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

/**
 * A caption's words, after a short gold hairline (what the section headers
 * drew before they lost theirs, in small): from sm, where the line has room
 * for it beside Pause without the words taking a third line.
 */
const CAPTION_TEXT = 'flex min-w-0 items-center gap-3'
const CAPTION_RULE = 'hidden h-px w-6 shrink-0 bg-gold/65 sm:block'

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
 * site on a phone overlapping it, each scrolling its real screenshot. The
 * preview links to the site. It moves only while it is in view (most of it
 * on screen), and starts from the top of the page each time it comes back
 * after leaving the screen, so every visit begins on the site's first
 * screen. It holds still while the pointer is over it or the link has
 * focus, after Pause, and always under reduced motion. Below md the phone
 * shows alone.
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
        <Glow className="-inset-x-[18%] -inset-y-[14%] md:-inset-x-[6%] md:-inset-y-[16%]" />
        <div className={cn('absolute top-0 hidden aspect-[1203/753] w-[88%] md:block', flip ? 'left-0' : 'right-0')}>
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
            'absolute inset-0 z-10 transition-transform duration-500 ease-out group-hover:-translate-y-1.5 md:inset-auto md:bottom-0 md:aspect-[1/2] md:w-[27%]',
            flip ? 'md:right-0' : 'md:left-0',
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
            className="absolute inset-0 size-full text-transparent drop-shadow-[0_24px_40px_color-mix(in_oklab,var(--background)_75%,transparent)]"
          />
        </div>
      </a>
      <figcaption className={CAPTION_ROW}>
        <span className={CAPTION_TEXT}>
          <span aria-hidden="true" className={CAPTION_RULE} />
          <span className="text-pretty">
            Screenshots from {site} <span className="whitespace-nowrap">· {monthYear(preview.captured)}</span>
          </span>
        </span>
        {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} preview`} />}
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------- the diagrams -- */

/** Generic icons for the parts a private product's description names. */
const ICONS: Record<string, LucideIcon> = {
  personas: Users,
  discovery: Radar,
  manager: Scale,
  alpaca: ChartCandlestick,
  slack: MessagesSquare,
  claude: Route,
  digests: CalendarClock,
}

/**
 * The diagram's three places: its first parts (`a`), the product at the
 * centre (`hub`), the rest (`b`). Below md they are rows, top to bottom;
 * from md, columns, left to right.
 */
type Group = 'a' | 'hub' | 'b'
const ORDER: Record<Group, number> = { a: 0, hub: 1, b: 2 }
interface Slot {
  group: Group
  index: number
  count: number
}
type Side = 'top' | 'bottom' | 'left' | 'right'

/** Where a beam meets a card: the middle of one of its edges, below md and from md. */
const AT: Record<Side, string> = { top: 'left-1/2 top-0', bottom: 'left-1/2 top-full', left: 'left-0 top-1/2', right: 'left-full top-1/2' }
const MD_AT: Record<Side, string> = {
  top: 'md:left-1/2 md:top-0',
  bottom: 'md:left-1/2 md:top-full',
  left: 'md:left-0 md:top-1/2',
  right: 'md:left-full md:top-1/2',
}

/** The edge of `self` that faces `other`: [below md, from md]. */
function sidesOf(self: Slot, other: Slot): [Side, Side] {
  if (self.group === other.group) return self.index < other.index ? ['right', 'bottom'] : ['left', 'top']
  return ORDER[self.group] < ORDER[other.group] ? ['bottom', 'right'] : ['top', 'left']
}

/** How far a beam bows, in px: less where the columns are closest. */
const BOW = 26
const TIGHT_BOW = 12
/**
 * A beam's bow, signed so that it meets the product at the centre square
 * on (across, from md; downward, below md), as the converging and diverging
 * links of a drawn diagram do. Links that run straight (a part level with
 * the centre, or two parts beside each other) stay straight.
 */
function bowOf(from: Slot, to: Slot, wide: boolean): number {
  if (from.group !== 'hub' && to.group !== 'hub') return 0
  const across = (s: Slot) => (s.group === 'hub' ? 0 : (s.index + 0.5) / s.count - 0.5)
  const offCentre = across(from.group === 'hub' ? to : from)
  if (offCentre === 0) return 0
  // AnimatedBeam moves the curve's control point `curvature` px off the
  // line's middle, along its normal (-dy, dx); this sign moves it toward the
  // centre's own line.
  const forward = Math.sign(ORDER[to.group] - ORDER[from.group])
  return (wide ? -1 : 1) * Math.sign(offCentre) * forward * BOW
}

interface Port {
  key: string
  narrow: Side
  wide: Side
}
interface Layout {
  a: readonly FlowNode[]
  b: readonly FlowNode[]
  ports: Map<string, Port[]>
  links: { from: string; to: string; fromPort: string; toPort: string; bow: [number, number] }[]
}

/** Places a flow: its first half of parts before the centre, the rest after; and where each beam meets each card. */
function layOut(hubId: string, flow: NonNullable<Product['flow']>): Layout {
  const half = Math.ceil(flow.nodes.length / 2)
  const a = flow.nodes.slice(0, half)
  const b = flow.nodes.slice(half)
  const slots = new Map<string, Slot>([[hubId, { group: 'hub', index: 0, count: 1 }]])
  a.forEach((n, index) => slots.set(n.id, { group: 'a', index, count: a.length }))
  b.forEach((n, index) => slots.set(n.id, { group: 'b', index, count: b.length }))
  const ports = new Map<string, Port[]>()
  const portOf = (id: string, other: string) => {
    const [narrow, wide] = sidesOf(slots.get(id)!, slots.get(other)!)
    const key = `${id}:${narrow}:${wide}`
    const list = ports.get(id) ?? []
    if (!list.some((p) => p.key === key)) list.push({ key, narrow, wide })
    ports.set(id, list)
    return key
  }
  const links = flow.links
    .filter(([from, to]) => slots.has(from) && slots.has(to))
    .map(([from, to]) => ({
      from,
      to,
      fromPort: portOf(from, to),
      toPort: portOf(to, from),
      bow: [bowOf(slots.get(from)!, slots.get(to)!, false), bowOf(slots.get(from)!, slots.get(to)!, true)] as [number, number],
    }))
  return { a, b, ports, links }
}

/** The dots on a card's edges where its beams meet it. */
function Ports({ list, refs }: { list: Port[] | undefined; refs: Map<string, RefObject<HTMLSpanElement | null>> }) {
  return (list ?? []).map((port) => (
    <span
      key={port.key}
      ref={refs.get(port.key)}
      aria-hidden="true"
      data-port=""
      className={cn(
        'absolute z-20 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/75 bg-background',
        AT[port.narrow],
        MD_AT[port.wide],
      )}
    />
  ))
}

/** One of the parts: its icon, its name, and the description's words for what it does (from md, only where the panel has room). */
function Part({
  node,
  ports,
  refs,
  roomy,
  className,
}: {
  node: FlowNode
  ports: Port[] | undefined
  refs: Map<string, RefObject<HTMLSpanElement | null>>
  roomy: boolean
  className?: string
}) {
  const Icon = ICONS[node.id]
  return (
    <div
      data-flow-node=""
      className={cn(
        'relative z-10 rounded-[4px] border border-border bg-[color-mix(in_oklab,var(--stage-wash)_45%,var(--background))] p-3 shadow-[0_14px_30px_-14px_color-mix(in_oklab,var(--background)_95%,transparent)] md:w-full md:max-w-none',
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-7 items-center justify-center rounded-[2px] bg-gold/12 text-gold ring-1 ring-inset ring-gold/35">
          <Icon aria-hidden="true" className="size-3.5" />
        </span>
      ) : null}
      <p className="mt-2 text-sm font-medium leading-snug text-foreground">{node.label}</p>
      <p className={cn('mt-1 text-xs leading-snug text-muted-foreground', roomy ? null : 'md:hidden')}>{node.note}</p>
      <Ports list={ports} refs={refs} />
    </div>
  )
}

/**
 * A private product's diagram: the product at the centre, the parts its
 * description names around it, and the links the description states, drawn
 * with animated beams (klyv's AnimatedBeam, which re-measures as the layout
 * changes) between dots on the cards' edges, so each beam shows whole. No
 * screenshots and no made-up screens: only the description's own words. The
 * beams pulse while the diagram is on screen, stop on Pause, and hold still
 * under reduced motion (the beam's own rule). Screen readers get the links
 * as a list.
 */
export function ProductParts({ product }: { product: Product }) {
  const figure = useRef<HTMLElement>(null)
  const diagram = useRef<HTMLDivElement>(null)
  const view = useView(figure)
  const calm = useCalm()
  const wide = useWide()
  const panel = useRef<HTMLDivElement>(null)
  const roomy = useRoomy(panel, 640)
  const [stopped, setStopped] = useState(false)
  const flow = product.flow
  const layout = useMemo(() => (flow ? layOut(product.id, flow) : null), [product.id, flow])
  // One ref per port: the beams measure from them.
  const refs = useMemo(
    () => new Map([...(layout?.ports.values() ?? [])].flat().map((p) => [p.key, createRef<HTMLSpanElement>()] as const)),
    [layout],
  )
  if (!flow || !layout) return null
  const name = (id: string) => (id === product.id ? product.title : (flow.nodes.find((n) => n.id === id)?.label ?? id))
  // A group of parts: a row below md, a column a quarter of the diagram wide from md.
  const group = 'flex flex-row justify-between gap-x-10 md:h-full md:w-1/4 md:flex-col md:justify-around md:gap-x-0'
  const sized = (count: number) => (count > 1 ? 'w-[calc(50%-1.25rem)] max-w-[10rem]' : 'mx-auto w-full max-w-[12rem] md:mx-0')

  return (
    <figure ref={figure} data-preview="flow" data-product={product.id} className="relative">
      <div className="relative isolate">
        <Glow className="-inset-x-[4%] -inset-y-[8%] md:-inset-x-[6%] md:-inset-y-[16%]" />
        <div
          ref={panel}
          role="group"
          aria-label={`The parts of ${product.title}`}
          className={cn(
            'relative flex flex-col overflow-hidden rounded-[4px] border border-border bg-[color-mix(in_oklab,var(--stage-wash)_24%,var(--background))] bg-[radial-gradient(color-mix(in_oklab,var(--stage-gold)_16%,transparent)_1px,transparent_1px)] [background-size:18px_18px] px-5 py-6',
            roomy ? 'md:p-8' : 'md:p-5',
            FLOW_BOX,
          )}
        >
          {/* The drawing's border line, inside the panel's edge, as on a plan. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 rounded-[2px] border border-gold/16"
          />
          <div
            ref={diagram}
            data-flow-diagram=""
            className="relative mx-auto flex min-h-0 w-full max-w-[22rem] flex-1 flex-col justify-between md:max-w-[40rem] md:flex-row md:items-center"
          >
            <div className={cn(group, 'items-end md:items-stretch')}>
              {layout.a.map((node) => (
                <Part key={node.id} node={node} ports={layout.ports.get(node.id)} refs={refs} roomy={roomy} className={sized(layout.a.length)} />
              ))}
            </div>
            <div
              data-flow-node=""
              data-flow-hub=""
              className={cn(
                'relative z-10 mx-auto w-full max-w-[15rem] rounded-[4px] border border-gold/60 bg-[color-mix(in_oklab,var(--stage-wash)_75%,var(--background))] p-4 text-center shadow-[0_0_56px_-12px_color-mix(in_oklab,var(--stage-gold)_40%,transparent)] outline outline-1 outline-offset-[3px] outline-gold/22 md:mx-0',
                'md:w-[27%]',
                roomy ? null : 'md:p-3',
              )}
            >
              <p className="font-roman text-lg font-medium leading-tight tracking-[0.04em] text-foreground">{product.title}</p>
              <p className="mt-1.5 font-serif text-lg italic leading-snug text-(--stage-text) text-balance">{flow.hub}</p>
              <Ports list={layout.ports.get(product.id)} refs={refs} />
            </div>
            <div className={cn(group, 'items-start md:items-stretch')}>
              {layout.b.map((node) => (
                <Part key={node.id} node={node} ports={layout.ports.get(node.id)} refs={refs} roomy={roomy} className={sized(layout.b.length)} />
              ))}
            </div>
            {layout.links.map((link, i) => (
              <AnimatedBeam
                key={`${link.from}-${link.to}`}
                containerRef={diagram}
                fromRef={refs.get(link.fromPort)!}
                toRef={refs.get(link.toPort)!}
                curvature={!wide ? link.bow[0] : roomy ? link.bow[1] : (link.bow[1] / BOW) * TIGHT_BOW}
                duration={2.6}
                delay={i * 0.65}
                pathColor="var(--stage-gold)"
                pathOpacity={0.3}
                beamColor="var(--stage-glow)"
                beamLength={40}
                paused={view === 'off' || stopped}
                // Some links run straight across or straight down, which the
                // published pulse (lit along x) cannot draw.
                alongBeam
                className="z-0"
              />
            ))}
          </div>
          <ul className="sr-only">
            {layout.links.map((link) => (
              <li key={`${link.from}-${link.to}`}>
                From {name(link.from)} to {name(link.to)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className={CAPTION_ROW}>
        <span className={CAPTION_TEXT}>
          <span aria-hidden="true" className={CAPTION_RULE} />
          <span className="text-pretty">
            <span className="whitespace-nowrap">Private, so no screenshots.</span>{' '}
            <span className="whitespace-nowrap">Its parts, in its own words.</span>
          </span>
        </span>
        {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} diagram`} />}
      </figcaption>
    </figure>
  )
}
