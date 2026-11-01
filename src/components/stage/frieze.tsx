'use client'

import { useEffect, useRef, useState } from 'react'
import ToolchainMarquee, { type ToolchainItem } from '@/components/ui/toolchain-marquee'
import { CERTIFICATIONS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { Container } from './section-header'

/**
 * Act IV's frieze, configured: the eight certifications, with their own
 * glue, in a module of their own so it loads after the page with the
 * component it styles (credentials.tsx loads it with next/dynamic, ssr:
 * false, behind RESERVE, a block of its height). The marquee reads
 * prefers-reduced-motion during its first render, so it is drawn in the
 * browser only: the server's HTML and the browser's would disagree for
 * anyone who has it on.
 */

/**
 * Act IV's own Roman idea: each certification is an honour won, marked by
 * a laurel wreath (Rome's mark of one) struck in gold before its
 * inscription. The left branch is drawn and mirrored for the right.
 * Decoration only: hidden from screen readers, and the words say it all.
 */
const LAUREL_STEM = 'M10.2 19.7A7.6 7.6 0 0 1 6.9 6.7'
const LAUREL_LEAVES =
  'M8.4 19Q7.2 20.6 4.9 19.9Q6.6 18.2 8.4 19ZM6.1 17.1Q4.3 18.1 2.5 16.5Q4.7 15.6 6.1 17.1ZM6.1 17.1Q4.6 15.7 5.5 13.5Q7.1 15.3 6.1 17.1ZM4.7 14.4Q2.7 14.6 1.6 12.5Q4 12.5 4.7 14.4ZM4.7 14.4Q3.9 12.5 5.6 10.9Q6.3 13.1 4.7 14.4ZM4.5 11.4Q2.5 10.8 2.4 8.4Q4.6 9.3 4.5 11.4ZM4.5 11.4Q4.4 9.3 6.6 8.5Q6.4 10.8 4.5 11.4ZM5.4 8.5Q3.9 7.2 4.7 5Q6.3 6.7 5.4 8.5ZM5.4 8.5Q6.2 6.6 8.5 6.7Q7.4 8.8 5.4 8.5ZM6.9 6.7Q7.1 4.6 9.3 4Q8.9 6.3 6.9 6.7Z'

function Branch() {
  return (
    <>
      <path d={LAUREL_STEM} fill="none" stroke="currentColor" strokeWidth={0.6} strokeLinecap="round" />
      <path d={LAUREL_LEAVES} />
    </>
  )
}

function Laurel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <Branch />
      <g transform="matrix(-1 0 0 1 24 0)">
        <Branch />
      </g>
    </svg>
  )
}

// One accent for every laurel: these are all the same kind of thing.
const items: ToolchainItem[] = CERTIFICATIONS.map((c) => ({
  label: `${c.name} · ${c.date}`,
  icon: <Laurel />,
  accent: 'var(--stage-gold)',
}))

const pairs = Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => items.slice(i * 2, i * 2 + 2))

/**
 * How the eight are laid out (RESERVE in credentials.tsx holds each one's
 * height while this loads, so nothing moves when it arrives):
 *
 * - `row`, from md: all eight run in one slow row, full-bleed so the
 *   module's own edge fade sits at the screen edge. Its track (about
 *   2,700px) is wider than any screen up to 1920, so none shows twice at
 *   once. A 52px row (a 36px line, 8px above and below), then the pause
 *   control, 44px, 12px below it: 108px.
 * - `still`, from md under reduced motion: the marquee holding still, two
 *   to a row in the page column, four rows: 208px.
 * - `list`, below md, whatever the motion setting: no marquee (rows that
 *   cut every inscription mid-word at both edges of a phone), but a still
 *   inscription of all eight in the page column, each on its own line, so
 *   nothing loops and no pause is needed.
 */
type Layout = 'row' | 'still' | 'list'

const layoutNow = (): Layout =>
  matchMedia('(max-width: 767.98px)').matches ? 'list' : matchMedia('(prefers-reduced-motion: reduce)').matches ? 'still' : 'row'

function useLayout(): Layout {
  // Drawn in the browser only (ssr: false), so the first render can ask.
  const [layout, setLayout] = useState<Layout>(layoutNow)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const belowMd = window.matchMedia('(max-width: 767.98px)')
    const update = () => setLayout(layoutNow())
    update()
    for (const q of [reduce, belowMd]) q.addEventListener('change', update)
    return () => {
      for (const q of [reduce, belowMd]) q.removeEventListener('change', update)
    }
  }, [])
  return layout
}

/**
 * The marquee as a frieze, from outside (descendant classes; the module's
 * own CSS is unlayered, so whatever it sets is set here with `!`). No
 * rules, no band and no boxes: each badge loses its box and its icon's
 * tile, leaving the gold laurel alone before its words in Cinzel (13px,
 * 15px from lg), and space between one honour and the next; the row's edge
 * fade widened to an eighth of the screen each side, so no inscription is
 * cut off at the screen's edge but sinks into the dark. The pause control
 * loses its disc and says what it does, as Act II's do: its icon and
 * "Pause" (or "Play") in Geist capitals at 12px, muted, on a 44px target
 * (the word drawn by CSS with empty alternative text: the button keeps the
 * component's own name).
 *
 * The module's parts, from its root: `>div` the rows, `>div>div` each row,
 * `>div>div>div` a row's track and `>div>div>div>div` its groups;
 * `div>span` a badge, `span[aria-hidden]` its icon, `span>span+span` its
 * words, `span svg` the icon's drawing; `>button` the pause control.
 */
const FRIEZE = [
  'grid-cols-1! [&>div]:gap-0! [&>div>div]:py-2! [&>div>div]:[mask-image:linear-gradient(to_right,transparent,#000_12.5%,#000_87.5%,transparent)]!',
  '[&_div>span]:h-9! [&_div>span]:gap-3! [&_div>span]:rounded-none! [&_div>span]:border-0! [&_div>span]:bg-transparent! [&_div>span]:pl-0! [&_div>span]:pr-12! [&_div>span]:shadow-none! [&_div>span]:backdrop-blur-none! [&_div>span]:hover:transform-none!',
  '[&_span[aria-hidden]]:size-6! [&_span[aria-hidden]]:rounded-none! [&_span[aria-hidden]]:bg-transparent! [&_span_svg]:size-6!',
  '[&_span>span+span]:font-roman [&_span>span+span]:text-[13px] [&_span>span+span]:font-medium [&_span>span+span]:tracking-[0.05em] lg:[&_span>span+span]:text-[15px]',
  '[&>button]:flex! [&>button]:h-11! [&>button]:w-auto! [&>button]:gap-2 [&>button]:px-2 [&>button]:bg-transparent! [&>button]:text-muted-foreground! [&>button]:shadow-none! [&>button]:hover:text-glow! [&>button]:hover:transform-none! [&>button_svg]:size-3!',
  "[&>button]:font-sans [&>button]:text-xs [&>button]:font-medium [&>button]:uppercase [&>button]:tracking-[0.18em] [&>button[aria-pressed=false]]:after:content-['Pause'_/_''] [&>button[aria-pressed=true]]:after:content-['Play'_/_'']",
].join(' ')

/** Moving: the pause control under the row, its word ending on the page column's right edge. */
const FRIEZE_ROW = '[&>button]:justify-self-end [&>button]:mr-[max(2.5rem,calc((100%_-_1280px)/2_+_2.5rem))]'

/**
 * Still, two to a row in the page column: the second of each pair on one
 * line down the middle (the module's 10px gap between the halves), and no
 * trailing space on any, so nothing can scroll sideways.
 */
const FRIEZE_STILL =
  '[&>div>div]:px-0! [&>div>div>div]:w-full! [&>div>div>div>div]:w-full! [&>div>div>div>div]:grid! [&>div>div>div>div]:grid-cols-2! [&>div>div>div>div]:pr-0! [&_div>span]:pr-0!'

/**
 * The inscription on a phone: each honour on its own line, the laurel in
 * gold, the name in Cinzel at 15px (14px below 375px wide), the date in
 * Geist at 12px in the muted ink, set to the right as in a ledger. Below
 * 360px wide the date stands under its name instead: beside it, the
 * longest names wrapped onto a second line at widths that moved with the
 * browser's text rendering by a pixel or two, so the list's height (which
 * credentials.tsx holds while it loads) could not be known; one name line
 * and one date line each, it always can. From 360 the longest name still
 * has more than 15px to spare beside its date. No rule between lines:
 * space does it. A screen reader hears "Platform Developer I, Jul 2025".
 */
const LINE =
  'grid grid-cols-[1.375rem_minmax(0,1fr)_auto] items-baseline gap-x-2.5 py-2.5 max-[359.98px]:grid-cols-[1.375rem_minmax(0,1fr)] max-[359.98px]:gap-y-0.5'
const NAME = 'font-roman text-[14px] font-medium leading-snug tracking-[0.04em] text-foreground min-[375px]:text-[15px]'
const DATE = 'font-sans text-xs font-medium uppercase tabular-nums tracking-[0.08em] text-muted-foreground max-[359.98px]:col-start-2'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * The list's own motion: as it rises into view its lines are set one after
 * another, each laurel struck in (from a little larger, as a die strikes)
 * and its words rising after it. Only lines below the screen when this
 * runs are held; each animation ends where the markup stands and lets go,
 * so under reduced motion, without scripts or if it is jumped past, the
 * list is simply whole.
 */
function armLines(list: HTMLElement): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  if (reduce.matches) return () => {}
  const held = new Map<Element, Animation[]>()
  for (const li of list.querySelectorAll('li')) {
    if (li.getBoundingClientRect().top < innerHeight) continue
    const anims: Animation[] = []
    const make = (el: Element | null, frames: Keyframe[], delay: number) => {
      if (!el) return
      const a = el.animate(frames, { duration: 800, delay, easing: EASE, fill: 'both' })
      a.pause()
      a.finished.then(() => a.cancel(), () => {})
      anims.push(a)
    }
    make(li.querySelector('svg'), [{ opacity: 0, transform: 'scale(1.6) rotate(-8deg)' }, { opacity: 1, transform: 'none' }], 0)
    for (const el of li.querySelectorAll(':scope > span:not([aria-hidden])')) make(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], 120)
    held.set(li, anims)
  }
  if (!held.size) return () => {}

  const io = new IntersectionObserver(
    (entries) => {
      let k = 0
      for (const entry of entries) {
        const anims = held.get(entry.target)
        if (!anims || !entry.isIntersecting) continue
        held.delete(entry.target)
        io.unobserve(entry.target)
        // Passed unseen, or landed on by the intro's nav as it lifts: whole.
        const passed = entry.boundingClientRect.bottom <= 0 || document.documentElement.hasAttribute('data-intro')
        for (const a of anims) {
          if (passed) a.cancel()
          else {
            a.effect?.updateTiming({ delay: Number(a.effect.getTiming().delay ?? 0) + k * 90 })
            a.play()
          }
        }
        if (!passed) k++
      }
    },
    { rootMargin: '100000px 0px -10% 0px' },
  )
  for (const li of held.keys()) io.observe(li)

  const still = () => {
    if (!reduce.matches) return
    io.disconnect()
    for (const anims of held.values()) for (const a of anims) a.cancel()
    held.clear()
  }
  reduce.addEventListener('change', still)
  return () => {
    io.disconnect()
    reduce.removeEventListener('change', still)
    for (const anims of held.values()) for (const a of anims) a.cancel()
  }
}

function Inscription() {
  const ref = useRef<HTMLUListElement>(null)
  useEffect(() => (ref.current ? armLines(ref.current) : undefined), [])
  return (
    <Container>
      <div role="group" aria-label="Salesforce certifications">
        <ul ref={ref}>
          {CERTIFICATIONS.map((c) => (
            <li key={c.id} className={LINE}>
              <Laurel className="size-[22px] self-center text-gold" />
              <span className={NAME}>{c.name}</span>
              <span className={DATE}>
                <span className="sr-only">, </span>
                {c.date}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  )
}

const INKS = {
  '--text': 'var(--foreground)',
  '--surface': 'var(--background)',
  '--focus-ring': 'var(--stage-gold)',
} as React.CSSProperties

/** The frieze: always mounted, off screen too (see credentials.tsx). */
export default function Frieze() {
  const layout = useLayout()
  if (layout === 'list') return <Inscription />

  const still = layout === 'still'
  const marquee = (
    <ToolchainMarquee
      role="group"
      aria-label="Salesforce certifications"
      stacks={still ? pairs.map((s) => [...s]) : [items]}
      rows={still ? pairs.length : 1}
      // The module moves a row by its own width in `duration` seconds: the
      // one long row at about 30px a second, slow enough to read.
      duration={90}
      showControl
      className={cn(FRIEZE, still ? FRIEZE_STILL : FRIEZE_ROW)}
    />
  )

  return (
    // The module's own inks, re-pointed at the Stage's: marble words, the
    // ground for its surface and the gold focus ring.
    <div style={INKS}>{still ? <Container>{marquee}</Container> : marquee}</div>
  )
}
