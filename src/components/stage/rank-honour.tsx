'use client'

import { useEffect, useRef } from 'react'
import { Awards } from '@/components/ui/award'
import { RANK } from '@/lib/content'
import { cn } from '@/lib/utils'
import { GILT, PALETTE } from './imperial'

/**
 * Act IV's crowning honour: his Trailhead rank, before the frieze of
 * certification seals and above them in rank. designali-in/award's laurel
 * award, as published but for the element its title and subtitle are set
 * in (`[site edit]` titleAs and subtitleAs: the page has its h1, and the
 * act's h2 is its eight certifications, so the rank must not be filed
 * under that h2 as a heading of its own), configured by props and by
 * descendant classes from outside: the rank's name in the wreath in gold
 * Cinzel capitals, the component's rule in gold, then his standing in
 * Cormorant italic; the laurel struck in gold (a gradient of the palette's
 * golds, LAUREL); no level pill (its word, "GOLD", is the component's, not
 * the record's). The platform's name, "Trailhead", stands in the crown's
 * opening above the name, the page's own line. Behind it all, the page's
 * own glory: a violet halo and fine gold rays. The seals are small violet
 * discs with a laurel struck in them; Act I's plaques are rectangles with
 * rivets; this is the one gold wreath, and the largest mark in the act.
 *
 * Its words are the record's (RANK, content.ts), real text in reading
 * order (the platform, the name, the standing), none of them a heading.
 * The drawing is decoration (the component's laurel and the glory are
 * hidden from screen readers here), and nothing in it takes focus.
 *
 * The entrance, once, when a third of it is in view: the glory, the laurel
 * growing up from its stems to the crown, the words one after another and
 * the rule drawn out between them, then a sheen of light across the name.
 * After that the rays turn slowly and the sheen comes round every few
 * seconds, only while it is on screen. If any of it is already on screen
 * when the page starts (a link to #credentials, a restored scroll), there
 * is no entrance: nothing seen is hidden to be brought in again. Under
 * reduced motion all of it stands still and whole, and so it does without
 * scripts: the server's HTML is the finished honour.
 */

/** The laurel's gold, the component's fill re-pointed at it from outside. */
const LAUREL = 'rk-laurel'

/** A plain class on the component's root (it takes no other attribute), for the entrance to find its parts. */
const AWARD = 'rk-award'

/**
 * The component's award, from outside. Its parts, from its root: `>svg`
 * the laurel (two branches, `path`s), `>div` the words: `>div>:nth-child(1)`
 * the level pill, `(2)` the title, `(3)` the rule, `(4)` the subtitle and
 * `:last-child` the date (none given: empty). Its own classes are set here
 * with `!` where they collide.
 */
const AWARD_LOOK = cn(
  // The wreath's own proportions (892.77 x 688.08), so the laurel fills the box, and no padding.
  'aspect-[892.77/688.08] w-[min(22rem,92vw)] p-0! md:w-[26rem] xl:w-[28rem]',
  // The laurel in struck gold, a fine dark edge, and a shadow on the dark.
  // (Literal, so Tailwind finds the class: url(#rk-laurel) is LAUREL.)
  '[&>svg]:[fill:url(#rk-laurel)]! [&>svg]:[filter:drop-shadow(0_0_0.5px_var(--rk-shadow))_drop-shadow(0_6px_14px_rgb(7_5_15/0.7))]',
  // The words: a column down the wreath's middle, a little below its centre (the crown's opening holds "Trailhead").
  '[&>div]:flex! [&>div]:flex-col [&>div]:items-center [&>div]:px-0! [&>div]:pt-[9%]',
  // No pill, and no empty date.
  '[&>div>:nth-child(1)]:hidden! [&>div>:last-child]:hidden!',
  // The name: gold Cinzel capitals, the sheen parked off them (background-position 100%, the gradient's gold right third).
  '[&>div>:nth-child(2)]:max-w-[11ch] [&>div>:nth-child(2)]:font-roman [&>div>:nth-child(2)]:font-semibold! [&>div>:nth-child(2)]:uppercase [&>div>:nth-child(2)]:leading-[1.06] [&>div>:nth-child(2)]:tracking-[0.08em]! [&>div>:nth-child(2)]:text-balance',
  '[&>div>:nth-child(2)]:text-[1.625rem]! min-[360px]:[&>div>:nth-child(2)]:text-[1.875rem]! md:[&>div>:nth-child(2)]:text-[2.25rem]! xl:[&>div>:nth-child(2)]:text-[2.5rem]!',
  '[&>div>:nth-child(2)]:text-gold [&>div>:nth-child(2)]:bg-clip-text [&>div>:nth-child(2)]:[-webkit-text-fill-color:transparent]',
  '[&>div>:nth-child(2)]:[background-image:linear-gradient(100deg,var(--rk-gold)_0%,var(--rk-gold)_40%,var(--rk-sheen)_50%,var(--rk-gold)_60%,var(--rk-gold)_100%)] [&>div>:nth-child(2)]:[background-size:300%_100%] [&>div>:nth-child(2)]:[background-position:100%_0]',
  'forced-colors:[&>div>:nth-child(2)]:bg-none forced-colors:[&>div>:nth-child(2)]:[-webkit-text-fill-color:currentColor]',
  // The rule in gold, shorter.
  '[&>div>:nth-child(3)]:bg-gold/75! [&>div>:nth-child(3)]:my-3! [&>div>:nth-child(3)]:w-16! md:[&>div>:nth-child(3)]:my-4! md:[&>div>:nth-child(3)]:w-24!',
  // His standing: Cormorant italic, marble.
  '[&>div>:nth-child(4)]:mb-0! [&>div>:nth-child(4)]:w-auto! [&>div>:nth-child(4)]:max-w-[13rem] [&>div>:nth-child(4)]:font-serif [&>div>:nth-child(4)]:font-normal! [&>div>:nth-child(4)]:italic [&>div>:nth-child(4)]:leading-snug [&>div>:nth-child(4)]:text-foreground/90 [&>div>:nth-child(4)]:text-balance',
  '[&>div>:nth-child(4)]:text-[1.0625rem]! min-[360px]:[&>div>:nth-child(4)]:text-[1.1875rem]! md:[&>div>:nth-child(4)]:max-w-[16rem] md:[&>div>:nth-child(4)]:text-[1.375rem]!',
)

/** The glory's rays start clear of the words, are brightest round the wreath, and are gone well inside the glory's edge. */
const RAYS_MASK = 'radial-gradient(circle, transparent 18%, black 30%, rgb(0 0 0 / 0.45) 44%, transparent 64%)'

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

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

    const one = (selector: string) => box.querySelector(selector)
    const award = one(`.${AWARD}`)
    const laurel = award?.querySelector(':scope > svg') ?? null
    const name = award?.querySelector(':scope > div > :nth-child(2)') ?? null
    const rule = award?.querySelector(':scope > div > :nth-child(3)') ?? null
    const standing = award?.querySelector(':scope > div > :nth-child(4)') ?? null

    // Already on screen as the page starts (a link to #credentials, a
    // restored scroll): no entrance, only what keeps going.
    const rect = box.getBoundingClientRect()
    const seen = rect.top < window.innerHeight && rect.bottom > 0

    // The entrance: made now, held at its first frame (the honour is off
    // screen as the page starts), played once it is in view.
    const entrance: Animation[] = []
    const enter = (el: Element | null, frames: Keyframe[], delay: number, duration: number, easing = EASE_OUT) => {
      if (!el || seen) return
      const a = el.animate(frames, { delay, duration, easing, fill: 'both' })
      a.pause()
      // Each ends where the markup already stands, so once done it lets go.
      a.finished.then(() => a.cancel(), () => {})
      entrance.push(a)
    }

    enter(one('[data-glory]'), [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], 0, 2200)
    // The laurel grows up from the stems at its foot to the leaves at the crown.
    enter(laurel, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], 150, 1900, 'cubic-bezier(0.45, 0, 0.25, 1)')
    const word = (el: Element | null, delay: number) =>
      enter(el, [{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], delay, 1100)
    word(one('[data-platform]'), 900)
    // No blur on the name: Chrome draws a filter on text-clipped type from its whole box.
    enter(name, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 1150, 1100)
    enter(rule, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }], 1500, 900)
    word(standing, 1650)

    // What keeps going while it is on screen: the glory turning, and the
    // sheen coming round across the rank's name.
    const loops: Animation[] = []
    const loop = (el: Element | null, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      if (!el) return
      const a = el.animate(frames, { iterations: Infinity, ...options })
      a.pause()
      loops.push(a)
    }
    loop(one('[data-rays]'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 160_000 })
    const cross = SHEEN_CROSS / SHEEN_EVERY
    loop(name, [
      { backgroundPosition: '100% 0', easing: 'cubic-bezier(0.45, 0, 0.3, 1)' },
      { backgroundPosition: '0% 0', offset: cross },
      { backgroundPosition: '0% 0' },
    ], { duration: SHEEN_EVERY, delay: seen ? 600 : 2600 })

    let entered = seen
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
    <div
      ref={root}
      data-rank
      className={cn('relative isolate flex flex-col items-center text-center', className)}
      style={{ '--rk-gold': PALETTE.gold, '--rk-sheen': GILT.sheen, '--rk-shadow': GILT.shadow } as React.CSSProperties}
    >
      {/* The laurel's gold: a gradient down each branch, from the glow at
          the crown to the deep gold at the stems. */}
      <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0 overflow-hidden">
        <defs>
          <linearGradient id={LAUREL} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={GILT.light} />
            <stop offset="0.45" stopColor={GILT.gold} />
            <stop offset="1" stopColor={GILT.deep} />
          </linearGradient>
        </defs>
      </svg>

      {/* The glory behind the wreath: a violet halo, a gold core, and fine
          gold rays fading out from it, centred on the wreath. Wider than the
          column, so it can spread; the section clips it, so the page never
          widens. */}
      <div
        aria-hidden="true"
        data-glory
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(620px,150vw)] -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, color-mix(in oklab, ${PALETTE.gold} 14%, transparent) 0%, color-mix(in oklab, ${PALETTE.violet} 80%, transparent) 22%, color-mix(in oklab, ${PALETTE.violet} 52%, transparent) 36%, color-mix(in oklab, ${PALETTE.violet} 20%, transparent) 52%, transparent 70%)`,
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

      {/* The platform, in the crown's opening (placed over the wreath's top,
          first in reading order). */}
      <p
        data-platform
        className="absolute left-1/2 top-[7%] z-20 -translate-x-1/2 whitespace-nowrap font-serif text-[1.25rem] italic leading-none text-muted-foreground md:text-[1.5rem]"
      >
        {RANK.platform}
      </p>
      <Awards variant="award" title={RANK.name} subtitle={RANK.standing} titleAs="p" subtitleAs="p" className={cn(AWARD, AWARD_LOOK)} />
    </div>
  )
}
