'use client'

import { useEffect, useRef, useState } from 'react'
import { PortfolioTemplate, type PortfolioBadge } from '@/components/ui/portfolio-hero-physics'
import { PERSON, ROLES, SKILLS } from '@/lib/content'

/**
 * Act V's template, configured: the About section's own glue, in a module
 * of its own so it loads after the page with the template it styles
 * (stage.tsx loads it with next/dynamic, behind a block of its height).
 * The section, its id and its header stay in the page's own HTML.
 */

const EMAIL_HREF = `mailto:${PERSON.links.email}`

// PERSON.about, word for word; the ** only mark the template's highlights
// (it draws **…** in its bright ink). A phrase no longer in his words simply
// goes unmarked.
const HIGHLIGHTS = [
  'Music and code run on the same engine',
  'with intention and a little audacity.',
  'The best things I build serve people I love.',
]
const BIO = HIGHLIGHTS.reduce((text, phrase) => text.replace(phrase, `**${phrase}**`), PERSON.about.join(' '))

/**
 * Every skill in one style, since they are one list: marble tesserae with a
 * gilt edge, through the template's own per-badge colours (its `bg`,
 * `border` and `color`, which it sets inline), so the pile reads as a
 * handful of mosaic tiles thrown on the stage. Ground ink on marble is
 * 17:1.
 */
const TILE = {
  bg: 'linear-gradient(168deg, var(--foreground) 0%, var(--foreground) 46%, color-mix(in oklab, var(--foreground) 80%, var(--stage-gold)) 100%)',
  border: 'color-mix(in oklab, var(--stage-gold) 85%, transparent)',
  color: 'var(--background)',
}
const BADGES: PortfolioBadge[] = SKILLS.map((label) => ({ label, ...TILE }))

/**
 * The template, re-pointed from outside (descendant classes on its own
 * className; `!` where it sets the value inline) so it sits in the page's
 * column, ground and type. About's own Roman idea is the portrait in an
 * arched niche and the skills as mosaic tiles:
 * - its #060606 ground and white ink give way to the page's ground and
 *   marble, and its blue glow becomes the wash's, starting at the
 *   block's top instead of 160-200px above it;
 * - the badge zone and the space above the name shrink to what the pile
 *   needs (260px on phones, 220px from the template's wide layout);
 * - a vertical swipe that starts on a badge scrolls the page (pan-y; the
 *   browser's pointercancel ends the grab), a sideways drag still throws it;
 *   the tiles' corners are a mosaic's, not a pill's;
 * - its column is the page's 1280px with the 16px / 48px gutter;
 * - the portrait stands in an arched niche with a gilt edge; his name is in
 *   Cinzel, as every name on the page; the role line takes the page's muted
 *   ink (the template's #767676 is 4.46:1 on its black);
 * - his words are in Cormorant italic, his voice everywhere on the page: the
 *   running text in a dimmed muted ink (5.65:1 on the ground, about 3.9:1
 *   at the glow's brightest, where it is large text, 28px and up),
 *   the phrases he would underline in gold (10:1);
 * - his links take the Stage's Geist capitals, with gold arrows.
 */
const ABOUT_LOOK = [
  'bg-transparent! text-foreground!',
  '[&_section>div:first-child]:top-0',
  '[&_section>div:first-child]:[background:radial-gradient(closest-side,color-mix(in_oklab,var(--stage-rule)_62%,transparent),color-mix(in_oklab,var(--stage-wash)_45%,transparent)_55%,transparent)]!',
  '[&_section]:pt-[276px] @6xl:[&_section]:pt-[244px]',
  '[&_[aria-label=Keywords]]:h-[260px] @6xl:[&_[aria-label=Keywords]]:h-[220px]',
  '[&_[aria-label=Keywords]>div]:[touch-action:pan-y_pinch-zoom]',
  '[&_[aria-label=Keywords]>div]:rounded-[3px] [&_[aria-label=Keywords]>div]:font-medium [&_[aria-label=Keywords]>div]:text-[15px] [&_[aria-label=Keywords]>div]:tracking-[0.01em]',
  '[&_[aria-label=Keywords]>div]:shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_10px_18px_-10px_rgb(0_0_0/0.9)]',
  '[&>div]:max-w-[1280px] [&_section>div.relative]:px-4 md:[&_section>div.relative]:px-12',
  // The portrait, in its niche.
  '[&_section>div.relative>div:first-child>div:first-child]:rounded-[30px_30px_2px_2px]',
  '[&_section>div.relative>div:first-child>div:first-child]:border-gold/80!',
  '[&_section>div.relative>div:first-child>div:first-child]:shadow-[0_0_0_4px_var(--background),0_0_0_5px_color-mix(in_oklab,var(--stage-gold)_35%,transparent)]',
  // His name and role.
  '[&_section>div.relative>div:first-child>div:last-child>:first-child]:font-roman [&_section>div.relative>div:first-child>div:last-child>:first-child]:text-[25px] [&_section>div.relative>div:first-child>div:last-child>:first-child]:font-medium [&_section>div.relative>div:first-child>div:last-child>:first-child]:leading-[1.2] [&_section>div.relative>div:first-child>div:last-child>:first-child]:tracking-[0.02em]',
  '[&_p.m-0.text-lg]:mt-1 [&_p.m-0.text-lg]:text-base [&_p.m-0.text-lg]:leading-snug [&_p.m-0.text-lg]:tracking-normal [&_p.m-0.text-lg]:text-muted-foreground!',
  // His words.
  '[&_section>div.relative>p]:font-serif [&_section>div.relative>p]:italic [&_section>div.relative>p]:font-normal [&_section>div.relative>p]:tracking-normal',
  '[&_section>div.relative>p]:text-[28px] [&_section>div.relative>p]:leading-[1.2] @6xl:[&_section>div.relative>p]:text-[42px] @6xl:[&_section>div.relative>p]:leading-[1.17]',
  '[&_section>div.relative>p]:text-[color-mix(in_oklab,var(--muted-foreground)_78%,var(--background))]!',
  '[&_section>div.relative>p_b]:font-medium [&_section>div.relative>p_b]:text-gold!',
  // His links.
  '[&_section>div.relative>div:last-child_a]:font-sans [&_section>div.relative>div:last-child_a]:text-xs [&_section>div.relative>div:last-child_a]:font-medium [&_section>div.relative>div:last-child_a]:uppercase [&_section>div.relative>div:last-child_a]:tracking-[0.2em] [&_section>div.relative>div:last-child_a]:transition-colors',
  '[&_section>div.relative>div:last-child_a]:text-(--stage-text)! [&_section>div.relative>div:last-child_a]:hover:text-glow!',
  '[&_section>div.relative>div:last-child_path]:stroke-gold',
].join(' ')

/**
 * Calls `drop` once, when the badge zone is in place; returns what stops
 * watching. Normally that is once the zone's top is in the upper part of the
 * screen, so the badges fall out from under the heading rather than
 * appearing at a line low on the screen. A visitor who stops with the whole
 * zone in view (say, after the About link) gets the drop after a beat rather
 * than an empty glow.
 */
function watchZone(zone: Element, drop: () => void): () => void {
  let timer = 0
  const stop = () => {
    near.disconnect()
    whole.disconnect()
    window.clearTimeout(timer)
  }
  const fire = () => {
    stop()
    drop()
  }
  const near = new IntersectionObserver(([e]) => e.isIntersecting && fire(), { rootMargin: '-56px 0px -55% 0px' })
  const whole = new IntersectionObserver(
    ([e]) => {
      window.clearTimeout(timer)
      if (e.isIntersecting) timer = window.setTimeout(fire, 1200)
    },
    { threshold: 1 },
  )
  near.observe(zone)
  whole.observe(zone)
  return stop
}

export default function About() {
  const ref = useRef<HTMLDivElement>(null)
  // The badges are shuffled on the client, so they mount empty (no server /
  // client mismatch) and drop when the zone is in place (below).
  const [badges, setBadges] = useState<PortfolioBadge[]>([])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const drop = () => setBadges(BADGES)
    // The zone may not be drawn on the template's first render: wait for
    // it, then watch it.
    const zoneOf = () => root.querySelector('[aria-label="Keywords"]')
    const zone = zoneOf()
    if (zone) return watchZone(zone, drop)
    let unwatch = () => {}
    const appear = new MutationObserver(() => {
      const found = zoneOf()
      if (!found) return
      appear.disconnect()
      unwatch = watchZone(found, drop)
    })
    appear.observe(root, { childList: true, subtree: true })
    return () => {
      appear.disconnect()
      unwatch()
    }
  }, [])

  return (
    <div ref={ref}>
      <PortfolioTemplate
        theme="dark"
        mainElement="div"
        nameAs="p"
        name={PERSON.name}
        role={`${ROLES[0].title} · ${ROLES[0].company}`}
        bio={BIO}
        avatar={PERSON.photo}
        links={[
          { label: 'LinkedIn', href: PERSON.links.linkedin },
          { label: 'GitHub', href: PERSON.links.github },
          { label: 'Email', href: EMAIL_HREF },
        ]}
        badges={badges}
        // Its "grab a badge" pill would ask keyboard and screen-reader users
        // for something they cannot do; the grab cursor says it to a mouse.
        dragHint={false}
        // Small tilt and little spin, so no badge lands upside down.
        calmDrop
        // Its case carousel would repeat the nine projects of Act I.
        cases={[]}
        className={ABOUT_LOOK}
      />
    </div>
  )
}
