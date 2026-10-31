'use client'

import { useEffect, useRef } from 'react'
import { RANK } from '@/lib/content'
import { cn } from '@/lib/utils'
import { GILT, PALETTE } from './imperial'

/**
 * Act IV's crowning honour: his Trailhead rank, before the frieze of
 * certification seals and above them in rank. Its own Roman idea, so it
 * never reads as a seal or a plaque: a phalera (the gold disc Rome struck
 * for a soldier's honours) with a faceted star in its field for the "All
 * Star", inside a laurel crown tied with an imperial ribbon, a gold star
 * set in the crown's opening, all on a slow glory of gold rays. The seals
 * are small violet discs with a laurel struck in them; Act I's plaques are
 * rectangles with rivets; this is the one gold medal, and the largest mark
 * in the act.
 *
 * Its words are the record's (RANK, content.ts), real text under the act's
 * h2: an h3 naming the platform and the rank, then the standing, in his
 * words. The drawing is decoration (aria-hidden), and nothing in it takes
 * focus.
 *
 * The entrance, once, when a third of it is in view: the glory and the
 * ribbon, the medal struck in, the laurel growing leaf by leaf from the
 * ribbon to the crown, the words, the crown's star, then a sheen of light
 * across the medal and the rank's name. After that the rays turn slowly
 * and the sheen comes round every few seconds, only while it is on screen.
 * Under reduced motion all of it stands still and whole, and so it does
 * without scripts: the server's HTML is the finished honour, and the
 * entrance only hides what it is about to bring in once the page runs,
 * while the honour is still off screen.
 */

// The drawing's geometry, in its 320 x 328 view box (the ribbon's tails take
// the last 8). Computed once at load, the same on the server and in the
// browser, rounded so the markup is short.
const CX = 160
const CY = 168
const MEDAL = 76
const WREATH = 114
/** The branch runs from beside the ribbon (just left of straight down) to the crown's opening, in degrees from +x, clockwise on screen. */
const FROM = 96
const TO = 236
const PAIRS = 9
const LEAF_ANGLE = (40 * Math.PI) / 180

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = (x: number, y: number) => `${r2(x)} ${r2(y)}`
const rad = (deg: number) => (deg * Math.PI) / 180
const onArc = (deg: number, radius = WREATH) => [CX + radius * Math.cos(rad(deg)), CY + radius * Math.sin(rad(deg))] as const

interface Leaf {
  d: string
  rib: string
  /** Its base, which it grows from. */
  x: number
  y: number
  /** Its place in the growth, from the ribbon up. */
  step: number
}

/** A laurel leaf: an almond from its base `b` along `d` (a unit vector), `length` long. */
function leaf(bx: number, by: number, dx: number, dy: number, length: number, width: number, step: number): Leaf {
  const nx = -dy
  const ny = dx
  const at = (along: number, across: number) => pt(bx + dx * length * along + nx * width * across, by + dy * length * along + ny * width * across)
  return {
    d: `M${pt(bx, by)}C${at(0.22, 1)} ${at(0.72, 0.75)} ${at(1, 0)}C${at(0.72, -0.75)} ${at(0.22, -1)} ${pt(bx, by)}Z`,
    rib: `M${pt(bx, by)}L${at(0.82, 0)}`,
    x: r2(bx),
    y: r2(by),
    step,
  }
}

/** The left branch's leaves, in pairs (one outward, one inward) up the stem, then one at its tip. The right branch is this one mirrored. */
const LEAVES: Leaf[] = (() => {
  const leaves: Leaf[] = []
  for (let i = 0; i < PAIRS; i++) {
    const deg = FROM + 6 + ((i + 0.4) * (TO - FROM - 6)) / PAIRS
    const [bx, by] = onArc(deg)
    const a = rad(deg)
    // Along the stem toward the crown, and out from the medal.
    const [tx, ty] = [-Math.sin(a), Math.cos(a)]
    const [ox, oy] = [Math.cos(a), Math.sin(a)]
    const size = 1 - (0.36 * i) / (PAIRS - 1)
    for (const side of [1, -1]) {
      const dx = tx * Math.cos(LEAF_ANGLE) + side * ox * Math.sin(LEAF_ANGLE)
      const dy = ty * Math.cos(LEAF_ANGLE) + side * oy * Math.sin(LEAF_ANGLE)
      leaves.push(leaf(bx, by, dx, dy, 31 * size, 8.5 * size, i * 2 + (side === 1 ? 0 : 1)))
    }
  }
  const [bx, by] = onArc(TO)
  const a = rad(TO)
  leaves.push(leaf(bx, by, -Math.sin(a), Math.cos(a), 21, 6, PAIRS * 2))
  return leaves
})()

/** Laurel berries, on the outside of the stem between pairs. */
const BERRIES = [1.5, 4.5, 7.2].map((i, step) => {
  const deg = FROM + 6 + ((i + 0.4) * (TO - FROM - 6)) / PAIRS
  const [x, y] = onArc(deg, WREATH + 7.5)
  return { x: r2(x), y: r2(y), step: Math.round(i * 2) + step }
})

const STEM = (() => {
  const [sx, sy] = onArc(FROM)
  const [ex, ey] = onArc(TO)
  return `M${pt(sx, sy)}A${WREATH} ${WREATH} 0 0 1 ${pt(ex, ey)}`
})()

/** A five-pointed star's facets, point up: each point split down its ridge into a lit half and a shaded half. */
function starFacets(cx: number, cy: number, outer: number, inner: number) {
  const at = (deg: number, radius: number) => pt(cx + radius * Math.cos(rad(deg)), cy + radius * Math.sin(rad(deg)))
  const lit: string[] = []
  const shade: string[] = []
  for (let k = 0; k < 5; k++) {
    const tip = -90 + k * 72
    lit.push(`M${pt(cx, cy)}L${at(tip - 36, inner)}L${at(tip, outer)}Z`)
    shade.push(`M${pt(cx, cy)}L${at(tip, outer)}L${at(tip + 36, inner)}Z`)
  }
  const outline = `M${Array.from({ length: 10 }, (_, i) => at(-90 + i * 36, i % 2 ? inner : outer)).join('L')}Z`
  return { lit: lit.join(''), shade: shade.join(''), outline }
}

const STAR = starFacets(CX, CY, 44, 17.5)
const CROWN = starFacets(CX, 47, 15, 6)

/** The beaded rim's beads, and the field's engraved rays. */
const BEADS = Array.from({ length: 56 }, (_, i) => onArc((i * 360) / 56, MEDAL - 6.5))
const ENGRAVING = Array.from({ length: 72 }, (_, i) => {
  const [x1, y1] = onArc((i * 360) / 72, 20)
  const [x2, y2] = onArc((i * 360) / 72, MEDAL - 14)
  return `M${pt(x1, y1)}L${pt(x2, y2)}`
}).join('')

/** The words' gold, with the sheen parked off them (background-position 100%: the gradient's right third, all gold). */
const NAME_STYLE = {
  backgroundImage: `linear-gradient(100deg, ${PALETTE.gold} 0%, ${PALETTE.gold} 40%, ${GILT.sheen} 50%, ${PALETTE.gold} 60%, ${PALETTE.gold} 100%)`,
  backgroundSize: '300% 100%',
  backgroundPosition: '100% 0',
} as React.CSSProperties

/** The rays start clear of the medal, are brightest just outside it, and are gone well inside the glory's edge. */
const RAYS_MASK = 'radial-gradient(circle, transparent 15%, black 21%, rgb(0 0 0 / 0.45) 37%, transparent 60%)'

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_POP = 'cubic-bezier(0.34, 1.4, 0.64, 1)'

/** How long the sheen takes to come round again, and the part of that it spends crossing. */
const SHEEN_EVERY = 7000
const SHEEN_CROSS = 1600

export function RankHonour({ className }: { className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = root.current
    if (!box) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    const all = <T extends Element>(selector: string) => [...box.querySelectorAll<T>(selector)]
    const one = (selector: string) => box.querySelector(selector)

    // The entrance: made now, held at its first frame (the honour is off
    // screen as the page starts), played once it is in view.
    const entrance: Animation[] = []
    const enter = (el: Element | null, frames: Keyframe[], delay: number, duration: number, easing = EASE_OUT) => {
      if (!el) return
      const a = el.animate(frames, { delay, duration, easing, fill: 'both' })
      a.pause()
      // Each ends where the markup already stands, so once done it lets go.
      a.finished.then(() => a.cancel(), () => {})
      entrance.push(a)
    }

    enter(one('[data-glory]'), [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], 0, 2200)
    enter(one('[data-ribbon]'), [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], 150, 900)
    enter(one('[data-medal]'), [{ opacity: 0, transform: 'scale(0.78)' }, { opacity: 1, transform: 'scale(1)' }], 250, 1300)
    for (const stem of all('[data-stem]'))
      enter(stem, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 300, 2000, 'cubic-bezier(0.45, 0, 0.25, 1)')
    for (const el of all<SVGElement>('[data-grow]')) {
      const step = Number(el.dataset.grow)
      enter(el, [{ opacity: 0, transform: 'scale(0.15)' }, { opacity: 1, transform: 'scale(1)' }], 380 + step * 85, 620, EASE_POP)
    }
    enter(one('[data-crown]'), [
      { opacity: 0, transform: 'scale(0) rotate(-144deg)' },
      { opacity: 1, transform: 'scale(1.3) rotate(0deg)', offset: 0.7 },
      { opacity: 1, transform: 'scale(1) rotate(0deg)' },
    ], 2050, 1000)
    all('[data-word]').forEach((el, i) =>
      enter(el, [{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], 1200 + i * 260, 1100),
    )
    for (const glint of all<SVGElement>('[data-glint]'))
      enter(glint, [
        { opacity: 0, transform: 'scale(0.2) rotate(0deg)' },
        { opacity: 1, transform: 'scale(1) rotate(45deg)', offset: 0.4 },
        { opacity: 0, transform: 'scale(0.2) rotate(90deg)' },
      ], Number(glint.dataset.glint), 1100, 'ease-in-out')

    // What keeps going while it is on screen: the glory turning, and the
    // sheen coming round, across the medal and then the rank's name.
    const loops: Animation[] = []
    const loop = (el: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!el) return
      const a = el.animate(frames, { iterations: Infinity, ...options })
      a.pause()
      loops.push(a)
    }
    loop(one('[data-rays]'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 160_000 })
    const cross = SHEEN_CROSS / SHEEN_EVERY
    loop(one('[data-sheen]'), [
      { transform: 'translateX(-190px)', easing: 'cubic-bezier(0.45, 0, 0.3, 1)' },
      { transform: 'translateX(190px)', offset: cross },
      { transform: 'translateX(190px)' },
    ], { duration: SHEEN_EVERY, delay: 2600 })
    loop(one('[data-name]'), [
      { backgroundPosition: '100% 0', easing: 'cubic-bezier(0.45, 0, 0.3, 1)' },
      { backgroundPosition: '100% 0', offset: cross * 0.45 },
      { backgroundPosition: '0% 0', offset: cross * 1.35 },
      { backgroundPosition: '0% 0' },
    ], { duration: SHEEN_EVERY, delay: 2600 })

    let entered = false
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entered && entry.intersectionRatio >= 0.33) {
          entered = true
          for (const a of entrance) a.play()
        }
        for (const a of loops) {
          if (entered && entry.isIntersecting) a.play()
          else a.pause()
        }
      },
      { threshold: [0, 0.33] },
    )
    io.observe(box)

    // Reduced motion switched on while the page is open: everything to its
    // end, and nothing more moves.
    const still = () => {
      if (!reduce.matches) return
      for (const a of entrance) if (a.playState !== 'idle') a.finish()
      for (const a of loops) a.cancel()
      io.disconnect()
    }
    reduce.addEventListener('change', still)

    return () => {
      io.disconnect()
      reduce.removeEventListener('change', still)
      for (const a of [...entrance, ...loops]) a.cancel()
    }
  }, [])

  return (
    <div ref={root} data-rank className={cn('relative isolate flex flex-col items-center text-center', className)}>
      {/* The glory behind the medal: a violet halo, a gold core, and fine
          gold rays fading out from it, centred on the medal (its centre sits
          at 168/320 of the drawing's width down). Wider than the column, so
          it can spread; the section clips it, so the page never widens. */}
      <div
        aria-hidden="true"
        data-glory
        className="pointer-events-none absolute left-1/2 top-[min(143px,41vw)] -z-10 size-[min(620px,150vw)] -translate-x-1/2 -translate-y-1/2 md:top-[160px] lg:top-[176px]"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, color-mix(in oklab, ${PALETTE.gold} 24%, transparent) 0%, color-mix(in oklab, ${PALETTE.violet} 80%, transparent) 19%, color-mix(in oklab, ${PALETTE.violet} 52%, transparent) 33%, color-mix(in oklab, ${PALETTE.violet} 20%, transparent) 50%, transparent 70%)`,
          }}
        />
        <div
          data-rays
          className="absolute inset-0 rounded-full"
          style={{
            background: [
              `repeating-conic-gradient(from 0deg, color-mix(in oklab, ${PALETTE.gold} 26%, transparent) 0deg 0.8deg, transparent 0.8deg 6deg)`,
              `repeating-conic-gradient(from 2.5deg, color-mix(in oklab, ${PALETTE.gold} 14%, transparent) 0deg 2.4deg, transparent 2.4deg 15deg)`,
            ].join(', '),
            maskImage: RAYS_MASK,
            WebkitMaskImage: RAYS_MASK,
          }}
        />
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 320 328"
        className="h-auto w-[min(17rem,78vw)] overflow-visible md:w-[19rem] lg:w-[21rem]"
      >
        <defs>
          <linearGradient id="rk-rim" x1="0.15" y1="0.05" x2="0.85" y2="0.95">
            <stop offset="0" stopColor={GILT.light} />
            <stop offset="0.38" stopColor={GILT.gold} />
            <stop offset="0.75" stopColor={GILT.deep} />
            <stop offset="1" stopColor={GILT.shadow} />
          </linearGradient>
          <radialGradient id="rk-field" cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor={GILT.light} />
            <stop offset="0.45" stopColor={GILT.gold} />
            <stop offset="1" stopColor={GILT.deep} />
          </radialGradient>
          <linearGradient id="rk-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={GILT.light} />
            <stop offset="0.55" stopColor={GILT.gold} />
            <stop offset="1" stopColor={GILT.deep} />
          </linearGradient>
          <linearGradient id="rk-ribbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALETTE.rule} />
            <stop offset="1" stopColor={PALETTE.violet} />
          </linearGradient>
          <linearGradient id="rk-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GILT.sheen} stopOpacity="0" />
            <stop offset="0.5" stopColor={GILT.sheen} stopOpacity="0.75" />
            <stop offset="1" stopColor={GILT.sheen} stopOpacity="0" />
          </linearGradient>
          <clipPath id="rk-medal-clip">
            <circle cx={CX} cy={CY} r={MEDAL} />
          </clipPath>
        </defs>

        {/* The ribbon that ties the crown: two notched tails and a knot, in imperial violet edged with gold. */}
        <g data-ribbon stroke={GILT.gold} strokeWidth="0.9" strokeLinejoin="round">
          {[false, true].map((mirror) => (
            <path
              key={String(mirror)}
              d="M153 278.5 163.5 283.5 145 324 141.6 316.6 134.5 319Z"
              transform={mirror ? `matrix(-1 0 0 1 ${CX * 2} 0)` : undefined}
              fill="url(#rk-ribbon)"
            />
          ))}
          <path d="M150.5 274.5Q160 271 169.5 274.5L168.5 286Q160 289 151.5 286Z" fill={PALETTE.violet} />
          <path d="M160 273v15" stroke={GILT.gold} strokeOpacity="0.45" />
        </g>

        {/* The laurel crown: the left branch, and the same mirrored for the right. */}
        {[false, true].map((mirror) => (
          <g key={String(mirror)} transform={mirror ? `matrix(-1 0 0 1 ${CX * 2} 0)` : undefined}>
            <path data-stem d={STEM} pathLength={1} strokeDasharray="1" fill="none" stroke={GILT.deep} strokeWidth="2.2" strokeLinecap="round" />
            {LEAVES.map((l, i) => (
              <g key={i} data-grow={l.step} style={{ transformOrigin: `${l.x}px ${l.y}px`, transformBox: 'view-box' }}>
                <path d={l.d} fill="url(#rk-leaf)" stroke={GILT.shadow} strokeOpacity="0.55" strokeWidth="0.6" />
                <path d={l.rib} fill="none" stroke={GILT.deep} strokeWidth="0.8" strokeLinecap="round" />
              </g>
            ))}
            {BERRIES.map((b, i) => (
              <circle key={i} data-grow={b.step} cx={b.x} cy={b.y} r="2.6" fill={GILT.light} stroke={GILT.deep} strokeWidth="0.6" style={{ transformOrigin: `${b.x}px ${b.y}px`, transformBox: 'view-box' }} />
            ))}
          </g>
        ))}

        {/* The medal: a beaded gold rim, a groove, a field engraved with
            rays, and the faceted star; the sheen crosses it, clipped to it. */}
        <g data-medal style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box' }}>
          <circle cx={CX} cy={CY + 3} r={MEDAL + 1} fill={PALETTE.ground} opacity="0.55" />
          <circle cx={CX} cy={CY} r={MEDAL} fill="url(#rk-rim)" />
          <circle cx={CX} cy={CY} r={MEDAL - 0.75} fill="none" stroke={GILT.light} strokeOpacity="0.5" strokeWidth="1.5" />
          {BEADS.map(([x, y], i) => (
            <circle key={i} cx={r2(x)} cy={r2(y)} r="1.7" fill={GILT.shadow} fillOpacity="0.5" />
          ))}
          <circle cx={CX} cy={CY} r={MEDAL - 12} fill="url(#rk-field)" stroke={GILT.shadow} strokeWidth="2" />
          <path d={ENGRAVING} stroke={GILT.deep} strokeOpacity="0.55" strokeWidth="0.7" />
          <circle cx={CX} cy={CY} r={MEDAL - 14.5} fill="none" stroke={GILT.light} strokeOpacity="0.4" strokeWidth="0.8" />
          <path d={STAR.outline} transform="translate(1.6 2.4)" fill={GILT.shadow} opacity="0.6" />
          <path d={STAR.lit} fill={GILT.light} />
          <path d={STAR.shade} fill={GILT.deep} />
          <path d={STAR.outline} fill="none" stroke={GILT.shadow} strokeWidth="1" strokeLinejoin="round" />
          <g clipPath="url(#rk-medal-clip)">
            <rect data-sheen x={CX - 22} y={CY - MEDAL - 20} width="44" height={MEDAL * 2 + 40} transform="translate(-190 0)" fill="url(#rk-sheen)" style={{ transformBox: 'view-box' }} />
          </g>
        </g>

        {/* The star in the crown's opening. */}
        <g data-crown style={{ transformOrigin: `${CX}px 47px`, transformBox: 'view-box' }}>
          <path d={CROWN.lit} fill={GILT.light} />
          <path d={CROWN.shade} fill={GILT.gold} />
          <path d={CROWN.outline} fill="none" stroke={GILT.deep} strokeWidth="0.8" strokeLinejoin="round" />
        </g>

        {/* Glints the sheen leaves on the star's points (entrance only). */}
        {[
          [CX + 2, CY - 44, 2300],
          [CX + 42, CY - 14, 2650],
          [CX, 47 - 15, 2950],
        ].map(([x, y, delay]) => (
          <path
            key={delay}
            data-glint={delay}
            opacity="0"
            d={`M${x} ${y - 9}C${x + 0.6} ${y - 1.5} ${x + 1.5} ${y - 0.6} ${x + 9} ${y}C${x + 1.5} ${y + 0.6} ${x + 0.6} ${y + 1.5} ${x} ${y + 9}C${x - 0.6} ${y + 1.5} ${x - 1.5} ${y + 0.6} ${x - 9} ${y}C${x - 1.5} ${y - 0.6} ${x - 0.6} ${y - 1.5} ${x} ${y - 9}Z`}
            fill={GILT.sheen}
            style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
          />
        ))}
      </svg>

      <h3 id="credentials-rank" className="mt-4 md:mt-5">
        <span data-word className="block font-serif text-[1.375rem] italic leading-none text-muted-foreground md:text-2xl">
          {RANK.platform}
        </span>{' '}
        <span data-word className="mt-3 block">
          <span
            data-name
            style={NAME_STYLE}
            className={cn(
              'block font-roman text-[1.875rem] font-semibold uppercase leading-[1.05] tracking-[0.08em] text-balance text-gold min-[360px]:text-[2.125rem] md:text-[2.5rem] xl:text-[2.75rem]',
              // No filter here: Chrome draws a filter on text-clipped type from its whole box.
              'bg-clip-text [-webkit-text-fill-color:transparent]',
              'forced-colors:bg-none forced-colors:[-webkit-text-fill-color:currentColor]',
            )}
          >
            {RANK.name}
          </span>
        </span>
      </h3>
      <span data-word aria-hidden="true" className="mt-4 flex items-center justify-center gap-3 text-gold">
        <span className="h-px w-12 bg-linear-to-r from-transparent to-gold/75 md:w-16" />
        <svg viewBox="0 0 20 20" className="size-2.5 shrink-0" fill="currentColor">
          <path d={starFacets(10, 10.6, 10, 4).outline} />
        </svg>
        <span className="h-px w-12 bg-linear-to-l from-transparent to-gold/75 md:w-16" />
      </span>
      <p data-word className="mt-3 font-serif text-xl italic leading-snug text-foreground/90 md:text-[1.625rem]">
        {RANK.standing}
      </p>
    </div>
  )
}
