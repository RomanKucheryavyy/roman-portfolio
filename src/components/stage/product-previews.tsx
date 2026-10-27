'use client'

import { createRef, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import {
  CalendarClock,
  ChartCandlestick,
  Library,
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
 * site in a browser and a phone, a private product's "how it works".
 */

const domain = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

/* ------------------------------------------------------------- motion -- */

const CALM = '(prefers-reduced-motion: reduce)'
const watchCalm = (change: () => void) => {
  const query = window.matchMedia(CALM)
  query.addEventListener('change', change)
  return () => query.removeEventListener('change', change)
}

/**
 * Whether the visitor asks for less motion. Until the browser has said (the
 * first render), assume they do, so nothing moves and no Pause button is
 * drawn for a moment rather than the other way round.
 */
function useCalm() {
  return useSyncExternalStore(watchCalm, () => window.matchMedia(CALM).matches, () => true)
}

/** Whether any part of the element is on screen. */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const watch = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    watch.observe(el)
    return () => watch.disconnect()
  }, [ref])
  return onScreen
}

/**
 * The visitor's own Pause / Play, which every moving preview has (WCAG 2.2.2:
 * anything that moves by itself for more than five seconds can be stopped).
 * Its name says what it will do, as the WAI carousel pattern's does.
 */
function Toggle({ stopped, onToggle, what }: { stopped: boolean; onToggle: () => void; what: string }) {
  const Icon = stopped ? Play : Pause
  const verb = stopped ? 'Play' : 'Pause'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${verb} the ${what}`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {verb}
    </button>
  )
}

/** The act's violet wash behind a preview. */
function Glow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--stage-accent-ink)_26%,transparent),transparent)] blur-2xl',
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

/**
 * A real screenshot, as tall as the stretch of page it shows, in a frame's
 * screen. While `play`, it scrolls itself down to the end of the shot and
 * back up, slowly, resting at each end: one transform animation (Web
 * Animations, which the compositor runs, so the page's own scroll never
 * waits on it), rebuilt from where it was when the frame changes size. Under
 * reduced motion it is never built, and the shot shows its top.
 */
function Screen({ shot, alt, play, calm, style }: { shot: Shot; alt: string; play: boolean; calm: boolean; style: CSSProperties }) {
  const screen = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const scroll = useRef<Animation | null>(null)
  const playing = useRef(play)

  useEffect(() => {
    const view = screen.current
    const img = image.current
    if (!view || !img || calm) return
    let current: Animation | null = null
    const build = () => {
      const distance = Math.round(img.offsetHeight - view.clientHeight)
      if (!view.clientHeight || distance <= 0) return
      const leg = Math.min(Math.max((distance / SPEED) * 1000, 9000), 42_000)
      const total = 2 * leg + 2 * REST
      const timing = current?.effect?.getTiming()
      const at = current && timing ? (Number(current.currentTime ?? 0) % Number(timing.duration)) / Number(timing.duration) : 0
      current?.cancel()
      const top = 'translate3d(0, 0, 0)'
      const end = `translate3d(0, ${-distance}px, 0)`
      current = img.animate(
        [
          { transform: top, offset: 0 },
          { transform: top, offset: REST / total, easing: EASE },
          { transform: end, offset: (REST + leg) / total },
          { transform: end, offset: (2 * REST + leg) / total, easing: EASE },
          { transform: top, offset: 1 },
        ],
        { duration: total, iterations: Infinity },
      )
      current.currentTime = at * total
      if (!playing.current) current.pause()
      scroll.current = current
    }
    const resize = new ResizeObserver(build)
    resize.observe(view)
    resize.observe(img)
    return () => {
      resize.disconnect()
      current?.cancel()
      scroll.current = null
    }
  }, [calm])

  useEffect(() => {
    playing.current = play
    if (play) scroll.current?.play()
    else scroll.current?.pause()
  }, [play])

  return (
    <div ref={screen} data-preview-screen="" className="absolute overflow-hidden bg-neutral-100" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={image}
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
 *   the Dynamic Island sits on the page as on a phone.
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
 * site on a phone overlapping it, each scrolling its real screenshot while
 * on screen. The preview links to the site. It holds still while the pointer
 * is over it or the link has focus, when it is off screen, after Pause, and
 * always under reduced motion. Below md the phone shows alone.
 */
export function LivePreview({ product, flip }: { product: Product; flip: boolean }) {
  const figure = useRef<HTMLElement>(null)
  const onScreen = useOnScreen(figure)
  const calm = useCalm()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const preview = product.preview
  if (!preview || !product.url) return null
  const play = onScreen && !hovered && !focused && !stopped
  const site = domain(product.url)

  return (
    <figure ref={figure} data-preview="live" data-product={product.id} className="relative">
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${site}`}
        className={cn('group relative isolate block rounded-[1.25rem]', LIVE_BOX)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <Glow className="inset-x-[6%] inset-y-[6%]" />
        <div className={cn('absolute top-0 hidden aspect-[1203/753] w-[88%] md:block', flip ? 'left-0' : 'right-0')}>
          <Safari url={site} aria-hidden="true" focusable="false" className="absolute inset-0 size-full" />
          <Screen shot={preview.desktop} alt={`Screenshot of ${site} in a desktop browser`} play={play} calm={calm} style={SAFARI_SCREEN} />
        </div>
        <div
          className={cn(
            'absolute inset-0 z-10 transition-transform duration-500 ease-out group-hover:-translate-y-1.5 md:inset-auto md:bottom-0 md:aspect-[1/2] md:w-[27%]',
            flip ? 'md:right-0' : 'md:left-0',
          )}
        >
          <Screen shot={preview.phone} alt={`Screenshot of ${site} on a phone`} play={play} calm={calm} style={PHONE_SCREEN} />
          <Iphone16Pro
            aria-hidden="true"
            focusable="false"
            className="absolute inset-0 size-full text-transparent drop-shadow-[0_24px_40px_rgba(0,0,0,0.7)]"
          />
        </div>
      </a>
      <figcaption className={CAPTION_ROW}>
        <span>
          Screenshots from {site} · {monthYear(preview.captured)}
        </span>
        {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} preview`} />}
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------- how it works -- */

/** Generic icons for the parts a private product's description names. */
const ICONS: Record<string, LucideIcon> = {
  personas: Users,
  discovery: Radar,
  manager: Scale,
  alpaca: ChartCandlestick,
  slack: MessagesSquare,
  claude: Route,
  vault: Library,
  digests: CalendarClock,
}

/** Columns the panel has room for, at its narrowest. */
const MAX_RANKS = 3

/**
 * The nodes in columns, left to right (top to bottom below md): each node in
 * the column after the furthest node that feeds it. A node that would land
 * past the third column sits in its feeder's column instead, under it (the
 * vault's digests, under the vault).
 */
function ranksOf(flow: NonNullable<Product['flow']>): FlowNode[][] {
  const rank = new Map<string, number>()
  const feeders = (id: string) => flow.links.filter(([, to]) => to === id).map(([from]) => from)
  const place = (id: string): number => {
    const known = rank.get(id)
    if (known !== undefined) return known
    const from = feeders(id)
    let r = from.length ? Math.max(...from.map(place)) + 1 : 0
    if (r >= MAX_RANKS) r = place(from[0])
    rank.set(id, r)
    return r
  }
  const ranks: FlowNode[][] = []
  for (const node of flow.nodes) (ranks[place(node.id)] ??= []).push(node)
  return ranks.filter(Boolean)
}

/**
 * A private product's "how it works": the parts its description names, in
 * the order they feed one another, wired with animated beams (klyv's
 * AnimatedBeam, which re-measures as the layout changes). No screenshots and
 * no made-up screens: only the description's own words. The beams pulse
 * while the diagram is on screen, stop on Pause, and hold still under
 * reduced motion (the beam's own rule).
 */
export function HowItWorks({ product }: { product: Product }) {
  const figure = useRef<HTMLElement>(null)
  const diagram = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(figure)
  const calm = useCalm()
  const [stopped, setStopped] = useState(false)
  const flow = product.flow
  const ranks = useMemo(() => (flow ? ranksOf(flow) : []), [flow])
  // One ref per node: the beams measure from the nodes' boxes.
  const nodes = useMemo(() => Object.fromEntries((flow?.nodes ?? []).map((n) => [n.id, createRef<HTMLDivElement>()])), [flow])
  if (!flow) return null

  return (
    <figure ref={figure} data-preview="flow" data-product={product.id} className="relative">
      <div className="relative isolate">
        <Glow className="inset-x-[10%] inset-y-[8%]" />
        <div
          role="group"
          aria-label={`How ${product.title} works`}
          className={cn(
            'relative flex flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#09090b] bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:18px_18px] p-5 md:p-8',
            FLOW_BOX,
          )}
        >
          <p aria-hidden="true" className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--stage-accent-ink)]">
            How it works
          </p>
          <div
            ref={diagram}
            data-flow-diagram=""
            className="relative mt-5 flex flex-1 flex-col justify-around gap-8 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-6"
          >
            {ranks.map((rank, r) => (
              <div key={r} className="flex flex-row justify-center gap-4 md:flex-1 md:flex-col md:gap-6">
                {rank.map((node) => {
                  const Icon = ICONS[node.id]
                  return (
                    <div
                      key={node.id}
                      ref={nodes[node.id]}
                      className="relative z-10 w-full max-w-[12rem] rounded-2xl border border-white/10 bg-[#0e0e12] p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)] md:mx-auto md:p-3.5"
                    >
                      {Icon ? (
                        <span className="flex size-8 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--stage-accent-ink)_14%,transparent)] text-[var(--stage-accent-ink)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--stage-accent-ink)_28%,transparent)]">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                      ) : null}
                      <p className="mt-2.5 text-sm font-medium leading-snug text-foreground">{node.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{node.note}</p>
                    </div>
                  )
                })}
              </div>
            ))}
            {flow.links.map(([from, to], i) => (
              <AnimatedBeam
                key={`${from}-${to}`}
                containerRef={diagram}
                fromRef={nodes[from]}
                toRef={nodes[to]}
                curvature={0}
                duration={2.8}
                delay={i * 0.7}
                pathColor="rgba(255,255,255,0.2)"
                beamColor="var(--stage-accent-ink)"
                beamLength={72}
                paused={!onScreen || stopped}
                // The links run straight across and straight down, which
                // the published pulse (lit along x) cannot draw.
                alongBeam
                className="z-0"
              />
            ))}
          </div>
        </div>
      </div>
      <figcaption className={CAPTION_ROW}>
        <span>Private, so no screenshots. Drawn from the description.</span>
        {calm ? null : <Toggle stopped={stopped} onToggle={() => setStopped((s) => !s)} what={`${product.title} diagram`} />}
      </figcaption>
    </figure>
  )
}
