'use client'

import { useEffect, useRef } from 'react'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'
import ContactCard from './contact-card'

/**
 * Act VI's card, configured: the Contact section's own glue, in a module of
 * its own so it loads after the page with the card it styles (stage.tsx
 * loads it with next/dynamic, behind a block of its height). The section,
 * its id and its header stay in the page's own HTML, so /#contact lands on
 * it before any of this arrives.
 */

const EMAIL_HREF = `mailto:${PERSON.links.email}`

/**
 * The component's own header (a centred pill and a 60px h2) is hidden in
 * favour of the page's SectionHeader, and its 1024px centred grid widens to
 * the page column, so Contact reads like every other act. Contact's own
 * Roman idea is the globe: the world in gold on a sphere of the wash (its
 * lines draw in currentColor; the sphere is a disc behind them, sized to
 * the projection's 0.9 radius, so it sits exactly inside the outline),
 * with a faint gold halo at the limb. On a phone it is larger, a horizon
 * across the whole screen between the channels and the message box.
 *
 * "Get in touch" takes Cinzel; on a phone, where the act's h2 ("Let's
 * talk") stands just above it, it is kept for screen readers only, so one
 * heading shows. The channels are plain lines, no icon tiles and no
 * labels: each address alone (it names its channel: an email address,
 * linkedin.com/..., github.com/...) at 16px, the Stage's text link (marble
 * under a gold line), 44px tall. The component's icon slot is left empty
 * and its tile hidden.
 */
const CONTACT_LOOK = cn(
  'mt-12 pb-8 pt-0 dark:bg-background md:mt-16 md:pb-12',
  '[&>div>div:first-child]:hidden [&>div]:px-4 md:[&>div]:px-12 [&_.max-w-5xl]:max-w-none lg:[&_.max-w-5xl]:gap-16',
  // The fields' gold ring. (The message box draws its own, round the whole box with its accept bar: composer.tsx.)
  '[&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-solid [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-gold',
  '[&_.max-w-5xl>div:first-child_h3]:font-roman [&_.max-w-5xl>div:first-child_h3]:text-[1.375rem] [&_.max-w-5xl>div:first-child_h3]:font-medium [&_.max-w-5xl>div:first-child_h3]:tracking-[0.02em] max-md:[&_.max-w-5xl>div:first-child_h3]:sr-only',
  '[&_.max-w-5xl>div:first-child_h3+p]:text-[15px]',
  // The channels.
  '[&_.max-w-5xl>div:first-child>div:nth-child(2)]:gap-1',
  '[&_.max-w-5xl>div:first-child_a]:py-2.5 [&_.max-w-5xl>div:first-child_a]:text-base [&_.max-w-5xl>div:first-child_a]:leading-6 [&_.max-w-5xl>div:first-child_a]:text-foreground! [&_.max-w-5xl>div:first-child_a]:hover:text-glow!',
  '[&_.max-w-5xl>div:first-child_a]:underline [&_.max-w-5xl>div:first-child_a]:decoration-gold/60 [&_.max-w-5xl>div:first-child_a]:decoration-1 [&_.max-w-5xl>div:first-child_a]:underline-offset-[5px] [&_.max-w-5xl>div:first-child_a]:hover:decoration-glow [&_.max-w-5xl>div:first-child_a]:hover:decoration-2',
  '[&_.max-w-5xl>div:first-child_a>div]:hidden',
  // Under reduced motion the card's columns and channels arrive without sliding: the component's
  // entrances (whileInView, inline transforms) keep only their fade.
  'motion-reduce:[&_.max-w-5xl>div]:transform-none! motion-reduce:[&_.max-w-5xl_a]:transform-none!',
  // The globe: a horizon across a phone, the column's own width from md.
  '[&_.h-52]:mt-2 max-md:[&_.h-52]:-mx-4 max-md:[&_.h-52]:h-60 [&_.h-52>div:first-child]:text-gold',
  '[&_.h-52>div:first-child]:bg-[radial-gradient(circle_farthest-side_at_50%_50%,transparent_88%,color-mix(in_oklab,var(--stage-gold)_16%,transparent)_90%,transparent_97%),radial-gradient(circle_farthest-side_at_50%_50%,color-mix(in_oklab,var(--stage-wash)_70%,var(--background))_0%,var(--stage-wash)_72%,color-mix(in_oklab,var(--stage-wash)_70%,var(--stage-rule))_89.4%,transparent_90%)]',
)

/** The component's icon slot, left empty: the address names its channel. */
const NoIcon = () => null

/**
 * The component's own palette, re-pointed rather than rewritten: its rose
 * accent becomes the page's gold; its white the marble; its zinc greys the
 * Stage's inks: zinc-950 (the globe's fade) the page's ground, so the fade
 * has no edge; zinc-400 and -500 (its notes) the muted ink.
 */
const INKS = {
  '--color-rose-50': 'color-mix(in oklab, var(--stage-gold) 12%, transparent)',
  '--color-rose-300': 'var(--stage-gold)',
  '--color-rose-400': 'var(--stage-gold)',
  '--color-rose-500': 'var(--stage-gold)',
  '--color-white': 'var(--foreground)',
  '--color-zinc-400': 'var(--muted-foreground)',
  '--color-zinc-500': 'var(--muted-foreground)',
  '--color-zinc-950': 'var(--background)',
} as React.CSSProperties

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * Contact's own motion: the globe rises over its horizon as it comes into
 * view, once (it turns all the while it is on screen, the component's
 * own). Only if it starts below the screen; the animation ends where the
 * markup stands and lets go, so under reduced motion (where the globe
 * also holds still) or without scripts it is simply there.
 */
function riseGlobe(root: HTMLElement): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const horizon = root.querySelector('.h-52')
  const globe = horizon?.firstElementChild
  if (reduce.matches || !horizon || !globe || horizon.getBoundingClientRect().top < innerHeight) return () => {}
  const a = globe.animate([{ opacity: 0, transform: 'translateY(38%)' }, { opacity: 1, transform: 'none' }], { duration: 1800, easing: EASE, fill: 'both' })
  a.pause()
  a.finished.then(() => a.cancel(), () => {})
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries[entries.length - 1].isIntersecting) return
      io.disconnect()
      // Landed on by the intro's nav as it lifts: there already, whole.
      if (document.documentElement.hasAttribute('data-intro')) a.cancel()
      else a.play()
    },
    { rootMargin: '0px 0px -12% 0px' },
  )
  io.observe(horizon)
  return () => {
    io.disconnect()
    a.cancel()
  }
}

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? riseGlobe(ref.current) : undefined), [])
  return (
    // A plain block: the card's own top margin passes through it, as it did
    // when the card sat straight in the section.
    <div ref={ref} style={INKS}>
      <ContactCard
        className={CONTACT_LOOK}
        subtitle="Contact"
        title="Let’s talk"
        channelsNote="Each of these goes straight to me."
        links={[
          { icon: NoIcon, label: PERSON.links.email, href: EMAIL_HREF },
          { icon: NoIcon, label: 'linkedin.com/in/romakuch', href: PERSON.links.linkedin },
          { icon: NoIcon, label: 'github.com/RomanKucheryavyy', href: PERSON.links.github },
        ]}
      />
    </div>
  )
}
