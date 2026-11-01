'use client'

import FooterSection5 from '@/components/ui/footer-section-5'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'
import { SECTIONS } from './top-bar'

/**
 * The footer, configured: its own glue, in a module of its own so it loads
 * after the page with the fluted glass it styles (stage.tsx loads it with
 * next/dynamic, behind a block of its height).
 */

const EMAIL_HREF = `mailto:${PERSON.links.email}`

/**
 * The curtain's last fall: the fluted glass over the ground, with the wash
 * as light falling into it from above and a breath of gold at its top
 * (graded, so it is never a flat field of the wash, and no line drawn
 * along its edge). The footer closes quietly:
 * his monogram as the panel's mark, his manifesto in Cormorant italic, the
 * columns' titles in gold Geist capitals, and a closing line in Cinzel with
 * his name. The component's giant wordmark is hidden: his name already
 * stands full-width in the intro and the hero, and the products' names on
 * their title cards, so a fifth giant word would only repeat them. Even
 * where the wash is fullest: gold 7.5:1, the links (the text ink at 84%)
 * over 8.5:1.
 */
const FOOTER_LOOK = cn(
  'bg-background [&_.max-w-7xl]:px-4 md:[&_.max-w-7xl]:px-12',
  '[&>div:nth-child(2)]:bg-[linear-gradient(var(--background),transparent_28%),radial-gradient(60%_42%_at_50%_12%,color-mix(in_oklab,var(--stage-gold)_10%,transparent),transparent),radial-gradient(90%_70%_at_50%_14%,color-mix(in_oklab,var(--stage-wash)_85%,transparent),transparent)]',
  '[&_.max-w-sm]:max-w-md',
  '[&_h2]:font-serif [&_h2]:text-[1.75rem] [&_h2]:font-normal [&_h2]:italic [&_h2]:leading-[1.2] [&_h2]:text-foreground [&_h2]:text-pretty md:[&_h2]:text-[2rem]',
  '[&_h3]:text-xs [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.24em] [&_h3]:text-gold md:[&_h3]:text-xs',
  '[&_li_a]:text-(--stage-text)/84 [&_li_a]:hover:text-glow',
)

export default function Footer() {
  return (
    <FooterSection5
      wordmarkAs="p"
      brand={PERSON.first}
      logo={
        // The intro's monogram, as the panel's mark (his name is in the closing line).
        <span aria-hidden="true" className="mb-5 font-roman text-lg font-medium tracking-[0.08em] text-gold">
          R<span className="text-glow">·</span>K
        </span>
      }
      socials={null}
      tagline={PERSON.manifesto}
      copyright={
        <span className="font-roman text-[13px] font-medium tracking-[0.12em] text-(--stage-text) md:text-sm">
          © {new Date().getFullYear()} {PERSON.name}
        </span>
      }
      panelColor="var(--background)"
      // Its content column moves onto the page's gutter (16px, 48px from md).
      className={FOOTER_LOOK}
      // No wordmark (above); its block keeps its top padding, a breath of
      // the ground between the contact card and the glass.
      wordmarkClassName="hidden"
      columns={[
        { title: 'On this page', links: SECTIONS.map((s) => ({ name: s.label, href: `#${s.id}` })) },
        {
          title: 'Elsewhere',
          links: [
            { name: 'LinkedIn', href: PERSON.links.linkedin },
            { name: 'GitHub', href: PERSON.links.github },
            { name: 'Email', href: EMAIL_HREF },
          ],
        },
      ]}
    />
  )
}
