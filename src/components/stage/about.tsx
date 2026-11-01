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
 * Every skill in one style, since they are one list: marble tesserae,
 * through the template's own per-badge colours (its `bg`, `border` and
 * `color`, which it sets inline), so the pile reads as a handful of mosaic
 * tiles thrown on the stage. No gilt edge: the edge is the marble's own
 * (a transparent border over the tile's ground), and a soft shadow under
 * each gives it its weight. Ground ink on marble is 17:1.
 */
const TILE = {
  bg: 'linear-gradient(168deg, var(--foreground) 0%, var(--foreground) 46%, color-mix(in oklab, var(--foreground) 80%, var(--stage-gold)) 100%)',
  border: 'transparent',
  color: 'var(--background)',
}
const BADGES: PortfolioBadge[] = SKILLS.map((label) => ({ label, ...TILE }))

/**
 * The template, re-pointed from outside (descendant classes on its own
 * className; `!` where it sets the value inline) so it sits in the page's
 * column, ground and type. About's own Roman idea is the portrait in an
 * arched niche and the skills as mosaic tiles:
 * - its #060606 ground and white ink give way to the page's ground and
 *   marble, and its blue glow becomes a quiet glow of the wash behind the
 *   tiles, starting at the block's top instead of 160-200px above it;
 * - the badge zone is what the pile needs and no more (212px, 220px from
 *   the template's wide layout), 8px in from either edge, and it clips
 *   only above and below (the tiles falling in from above it), so the
 *   square corner of a tile tipped against a side wall, a few px past the
 *   physics body's rounded one, is never cut off; the words start 24px
 *   below it;
 * - on a phone the tiles are a little smaller (30px, 14px type) so the
 *   pile fits that zone, and none is narrower than 52px, so the shortest
 *   ("C", "Git") is as steady as the rest and lands the right way up;
 * - a vertical swipe that starts on a badge scrolls the page (pan-y; the
 *   browser's pointercancel ends the grab), a sideways drag still throws it;
 *   the tiles' corners are a mosaic's, not a pill's;
 * - its column is the page's 1280px with the 16px / 48px gutter;
 * - the portrait stands above his name in an arched niche, 112 x 150, with
 *   no frame: the arch is its edge, and a shadow sets it into the dark;
 *   his name is in Cinzel, as every name on the page; the role line takes
 *   the page's muted ink (the template's #767676 is 4.46:1 on its black);
 * - his words are in Cormorant italic, his voice everywhere on the page,
 *   24px on a phone and 42px from the wide layout: the running text in a
 *   dimmed muted ink (5.65:1 on the ground), the phrases he would underline
 *   in gold (10:1);
 * - his links are the Stage's text links (Geist 13px in marble under a gold
 *   line, 44px tall), the template's arrows in gold.
 */
const ABOUT_LOOK = [
  'bg-transparent! text-foreground!',
  '[&_section>div:first-child]:top-0',
  '[&_section>div:first-child]:[background:radial-gradient(closest-side,color-mix(in_oklab,var(--stage-rule)_45%,transparent),color-mix(in_oklab,var(--stage-wash)_35%,transparent)_55%,transparent)]!',
  '[&_section]:pt-[236px] @6xl:[&_section]:pt-[244px]',
  '[&_[aria-label=Keywords]]:inset-x-2 [&_[aria-label=Keywords]]:h-[212px] @6xl:[&_[aria-label=Keywords]]:h-[220px]',
  '[&_[aria-label=Keywords]]:[overflow:visible_clip] [&_[aria-label=Keywords]]:[overflow-clip-margin:8px]',
  '[&_[aria-label=Keywords]>div]:[touch-action:pan-y_pinch-zoom]',
  '[&_[aria-label=Keywords]>div]:min-w-[3.25rem] [&_[aria-label=Keywords]>div]:justify-center [&_[aria-label=Keywords]>div]:rounded-[3px] [&_[aria-label=Keywords]>div]:font-medium [&_[aria-label=Keywords]>div]:tracking-[0.01em]',
  '[&_[aria-label=Keywords]>div]:h-[30px] [&_[aria-label=Keywords]>div]:px-3 [&_[aria-label=Keywords]>div]:text-[14px] @3xl:[&_[aria-label=Keywords]>div]:h-[34px] @3xl:[&_[aria-label=Keywords]>div]:px-3.5 @3xl:[&_[aria-label=Keywords]>div]:text-[15px]',
  '[&_[aria-label=Keywords]>div]:shadow-[0_10px_18px_-10px_color-mix(in_oklab,var(--stage-shadow)_90%,transparent)]',
  '[&>div]:max-w-[1280px] [&_section>div.relative]:px-4 md:[&_section>div.relative]:px-12',
  // The portrait, in its niche, above his name.
  '[&_section>div.relative>div:first-child]:flex-col [&_section>div.relative>div:first-child]:items-start [&_section>div.relative>div:first-child]:gap-5',
  '[&_section>div.relative>div:first-child>div:first-child]:h-[150px] [&_section>div.relative>div:first-child>div:first-child]:w-[112px] [&_section>div.relative>div:first-child>div:first-child]:rounded-[56px_56px_3px_3px] [&_section>div.relative>div:first-child>div:first-child]:border-0',
  '[&_section>div.relative>div:first-child>div:first-child]:shadow-[0_22px_36px_-20px_color-mix(in_oklab,var(--stage-shadow)_95%,transparent)]',
  // His name and role.
  '[&_section>div.relative>div:first-child>div:last-child>:first-child]:font-roman [&_section>div.relative>div:first-child>div:last-child>:first-child]:text-[25px] [&_section>div.relative>div:first-child>div:last-child>:first-child]:font-medium [&_section>div.relative>div:first-child>div:last-child>:first-child]:leading-[1.2] [&_section>div.relative>div:first-child>div:last-child>:first-child]:tracking-[0.02em]',
  '[&_p.m-0.text-lg]:mt-1 [&_p.m-0.text-lg]:text-base [&_p.m-0.text-lg]:leading-snug [&_p.m-0.text-lg]:tracking-normal [&_p.m-0.text-lg]:text-muted-foreground!',
  // His words.
  '[&_section>div.relative>p]:font-serif [&_section>div.relative>p]:italic [&_section>div.relative>p]:font-normal [&_section>div.relative>p]:tracking-normal',
  '[&_section>div.relative>p]:text-[24px] [&_section>div.relative>p]:leading-[1.25] @6xl:[&_section>div.relative>p]:text-[42px] @6xl:[&_section>div.relative>p]:leading-[1.17]',
  '[&_section>div.relative>p]:text-[color-mix(in_oklab,var(--muted-foreground)_78%,var(--background))]!',
  '[&_section>div.relative>p_b]:font-medium [&_section>div.relative>p_b]:text-gold!',
  // His links.
  '[&_section>div.relative>div:last-child]:mt-5 [&_section>div.relative>div:last-child]:gap-x-7 [&_section>div.relative>div:last-child]:gap-y-0 @6xl:[&_section>div.relative>div:last-child]:mt-3',
  '[&_section>div.relative>div:last-child_a]:py-3 [&_section>div.relative>div:last-child_a]:font-sans [&_section>div.relative>div:last-child_a]:text-[13px] [&_section>div.relative>div:last-child_a]:font-medium [&_section>div.relative>div:last-child_a]:leading-5 [&_section>div.relative>div:last-child_a]:tracking-normal',
  '[&_section>div.relative>div:last-child_a]:underline [&_section>div.relative>div:last-child_a]:decoration-gold/70 [&_section>div.relative>div:last-child_a]:decoration-1 [&_section>div.relative>div:last-child_a]:underline-offset-[5px] [&_section>div.relative>div:last-child_a]:transition-colors',
  '[&_section>div.relative>div:last-child_a]:text-foreground! [&_section>div.relative>div:last-child_a]:hover:text-glow! [&_section>div.relative>div:last-child_a]:hover:decoration-glow [&_section>div.relative>div:last-child_a]:hover:decoration-2',
  '[&_section>div.relative>div:last-child_path]:stroke-gold',
].join(' ')
/**
 * Calls `drop` once, as soon as a third of the badge zone is in view, so
 * the tiles fall while the reader is arriving rather than leaving an empty
 * glow to stare at; returns what stops watching.
 */
function watchZone(zone: Element, drop: () => void): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[entries.length - 1].intersectionRatio < 0.3) return
      io.disconnect()
      drop()
    },
    { threshold: [0, 0.3] },
  )
  io.observe(zone)
  return () => io.disconnect()
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * About's own motion beside the drop: the portrait unveiled in its niche,
 * once, as half of its row comes into view: the arch opens from its crown down
 * while the photograph settles from a little closer. Only if it starts
 * below the screen; each animation ends where the markup stands and lets
 * go, so under reduced motion or without scripts it is simply there.
 */
function unveil(portrait: HTMLElement): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  if (reduce.matches || portrait.getBoundingClientRect().top < innerHeight) return () => {}
  const anims = [
    portrait.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 1100, easing: EASE, fill: 'both' }),
  ]
  const photo = portrait.querySelector('img')
  if (photo) anims.push(photo.animate([{ transform: 'scale(1.14)' }, { transform: 'none' }], { duration: 1600, easing: EASE, fill: 'both' }))
  for (const a of anims) {
    a.pause()
    a.finished.then(() => a.cancel(), () => {})
  }
  // Watched through its row (the portrait and his name): the clip it is
  // held under would hide it from an observer of its own.
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[entries.length - 1].intersectionRatio < 0.5) return
      io.disconnect()
      for (const a of anims) a.play()
    },
    { threshold: [0, 0.5] },
  )
  io.observe(portrait.parentElement ?? portrait)
  return () => {
    io.disconnect()
    for (const a of anims) a.cancel()
  }
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
    // it, then watch it (and arm the portrait's unveiling with it).
    const zoneOf = () => root.querySelector('[aria-label="Keywords"]')
    let stops: (() => void)[] = []
    const start = (zone: Element) => {
      stops = [watchZone(zone, drop)]
      const portrait = root.querySelector<HTMLElement>('section > div.relative > div:first-child > div:first-child')
      if (portrait) stops.push(unveil(portrait))
    }
    const appear = new MutationObserver(() => {
      const found = zoneOf()
      if (!found) return
      appear.disconnect()
      start(found)
    })
    const zone = zoneOf()
    if (zone) start(zone)
    else appear.observe(root, { childList: true, subtree: true })
    return () => {
      appear.disconnect()
      for (const stop of stops) stop()
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
