'use client'

import { Github, Linkedin, Mail } from 'lucide-react'
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
 * Roman idea is the globe: the world in gold on a sphere of the wash
 * (its lines draw in currentColor; the sphere is a disc behind them, sized
 * to the projection's 0.9 radius, so it sits exactly inside the outline),
 * with a faint gold halo at the limb. "Get in touch" takes Cinzel, and the
 * channels' icon tiles the Stage's square corners.
 */
const CONTACT_LOOK = cn(
  'mt-12 pb-8 pt-0 dark:bg-background md:mt-16 md:pb-12',
  '[&>div>div:first-child]:hidden [&>div]:px-4 md:[&>div]:px-12 [&_.max-w-5xl]:max-w-none lg:[&_.max-w-5xl]:gap-16',
  // The fields' gold ring. (The message box draws its own, round the whole box with its accept bar: composer.tsx.)
  '[&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-solid [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-gold',
  '[&_.max-w-5xl>div:first-child_h3]:font-roman [&_.max-w-5xl>div:first-child_h3]:text-[1.375rem] [&_.max-w-5xl>div:first-child_h3]:font-medium [&_.max-w-5xl>div:first-child_h3]:tracking-[0.02em]',
  '[&_.max-w-5xl>div:first-child_a>div]:rounded-[2px]',
  '[&_.h-52>div:first-child]:text-gold',
  '[&_.h-52>div:first-child]:bg-[radial-gradient(circle_farthest-side_at_50%_50%,transparent_88%,color-mix(in_oklab,var(--stage-gold)_16%,transparent)_90%,transparent_97%),radial-gradient(circle_farthest-side_at_50%_50%,color-mix(in_oklab,var(--stage-wash)_70%,var(--background))_0%,var(--stage-wash)_72%,color-mix(in_oklab,var(--stage-wash)_70%,var(--stage-rule))_89.4%,transparent_90%)]',
)

/**
 * The component's own palette, re-pointed rather than rewritten: its rose
 * accent becomes the page's gold; its white the marble; its zinc greys the
 * Stage's inks: zinc-950 (the globe's fade) the page's ground, so the fade
 * has no edge; zinc-400 and -500 (its notes, its channels and their icons)
 * the muted ink; zinc-700 and -800 (the icon tiles) the rule and the wash.
 */
const INKS = {
  '--color-rose-50': 'color-mix(in oklab, var(--stage-gold) 12%, transparent)',
  '--color-rose-300': 'var(--stage-gold)',
  '--color-rose-400': 'var(--stage-gold)',
  '--color-rose-500': 'var(--stage-gold)',
  '--color-white': 'var(--foreground)',
  '--color-zinc-400': 'var(--muted-foreground)',
  '--color-zinc-500': 'var(--muted-foreground)',
  '--color-zinc-700': 'color-mix(in oklab, var(--stage-rule) 80%, transparent)',
  '--color-zinc-800': 'color-mix(in oklab, var(--stage-wash) 60%, var(--background))',
  '--color-zinc-950': 'var(--background)',
} as React.CSSProperties

export default function Contact() {
  return (
    // A plain block: the card's own top margin passes through it, as it did
    // when the card sat straight in the section.
    <div style={INKS}>
      <ContactCard
        className={CONTACT_LOOK}
        subtitle="Contact"
        title="Let’s talk"
        channelsNote="Each of these goes straight to me."
        links={[
          { icon: Mail, label: PERSON.links.email, href: EMAIL_HREF },
          { icon: Linkedin, label: 'linkedin.com/in/romakuch', href: PERSON.links.linkedin },
          { icon: Github, label: 'github.com/RomanKucheryavyy', href: PERSON.links.github },
        ]}
      />
    </div>
  )
}
