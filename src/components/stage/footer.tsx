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
 * The colophon: the fluted glass over the ground, quiet. The glass is
 * softened from outside (the shader's layer at 40%, so its highlights and
 * shadows are faint, and faded out at its top and foot, so it grows out of
 * the ground and goes back into it; on a phone, where its flutes would
 * read as pinstripes, drawn 1.8 times as wide), with the wash as a soft
 * tone in it, graded into the ground on every side: no line along its
 * edge, no lit field. The component's giant wordmark and the block it
 * stands in are gone: his name already stands full-width in the intro and
 * the hero.
 *
 * It closes on his monogram, his manifesto in Cormorant italic, the links
 * and a closing line in Cinzel with his name. From lg, as a page's foot:
 * the monogram, manifesto and closing line on the left, the links in two
 * columns on the right under gold Geist capitals. Below lg, as a
 * colophon, in that order down one column: the links in one row parted by
 * gold interpuncts (the column titles kept for screen readers), each a
 * 44px target, a gold ↗ after those that leave the site. Even where the
 * wash is fullest: gold 7.5:1, the links (the text ink at 84%) over 8.5:1.
 *
 * The component's parts, from its root: `>div:first-child` the wordmark's
 * block, `>div:nth-child(2)` the panel and its first child the glass; in
 * the content (.max-w-7xl), `>div:first-child` the left side (the mark and
 * manifesto, then the closing line) and `>div:last-child` the columns.
 */
const FOOTER_LOOK = cn(
  'bg-background [&>div:first-child]:hidden',
  '[&>div:nth-child(2)]:min-h-0 [&>div:nth-child(2)]:bg-[linear-gradient(var(--background),transparent_30%,transparent_70%,var(--background)),radial-gradient(85%_60%_at_50%_42%,color-mix(in_oklab,var(--stage-wash)_60%,transparent),transparent_80%)]',
  '[&>div:nth-child(2)>div:first-child]:opacity-40 [&>div:nth-child(2)>div:first-child]:[mask-image:linear-gradient(transparent,black_30%,black_65%,transparent)]',
  'max-lg:[&>div:nth-child(2)>div:first-child]:origin-left max-lg:[&>div:nth-child(2)>div:first-child]:scale-x-[1.8]',
  '[&_.max-w-7xl]:px-4 [&_.max-w-7xl]:py-12 max-lg:[&_.max-w-7xl]:gap-8 md:[&_.max-w-7xl]:px-12 lg:[&_.max-w-7xl]:py-24',
  // Below lg, one column in the colophon's order: the mark and manifesto, the links, the closing line.
  'max-lg:[&_.max-w-7xl>div:first-child]:contents max-lg:[&_.max-w-7xl>div:first-child>div:first-child]:order-1 max-lg:[&_.max-w-7xl>div:last-child]:order-2',
  'max-lg:[&_.max-w-7xl>div:first-child>div:last-child]:order-3 max-lg:[&_.max-w-7xl>div:first-child>div:last-child]:mt-0 max-lg:[&_.max-w-7xl>div:first-child>div:last-child]:pt-0',
  '[&_.max-w-sm]:max-w-md',
  '[&_h2]:font-serif [&_h2]:text-[1.75rem] [&_h2]:font-normal [&_h2]:italic [&_h2]:leading-[1.2] [&_h2]:text-foreground [&_h2]:text-pretty md:[&_h2]:text-[2rem]',
  '[&_h3]:text-xs [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.24em] [&_h3]:text-gold md:[&_h3]:text-xs max-lg:[&_h3]:sr-only',
  // The links: one row below lg, every item led by a gold interpunct (drawn, and silent to screen
  // readers) in a 20px slot. The row starts 20px left of the column and is clipped 16px in from
  // there (and 8px clear of it on the other sides, for the focus ring), so the interpunct that
  // would lead each line is out of sight.
  'max-lg:[&_.max-w-7xl>div:last-child]:-ml-5 max-lg:[&_.max-w-7xl>div:last-child]:flex-wrap max-lg:[&_.max-w-7xl>div:last-child]:gap-0 max-lg:[&_.max-w-7xl>div:last-child]:[clip-path:inset(-8px_-8px_-8px_16px)] max-lg:[&_.max-w-7xl>div:last-child>div]:contents max-lg:[&_ul]:contents',
  "max-lg:[&_li]:inline-flex max-lg:[&_li]:items-center max-lg:[&_li]:before:inline-block max-lg:[&_li]:before:w-5 max-lg:[&_li]:before:text-center max-lg:[&_li]:before:text-gold max-lg:[&_li]:before:content-['·'_/_'']",
  '[&_li_a]:inline-block [&_li_a]:py-3 [&_li_a]:leading-5 max-lg:[&_li_a]:pr-2 max-lg:[&_li_a]:text-[13px] lg:[&_li_a]:py-0.5 [&_li_a]:text-(--stage-text)/84 [&_li_a]:underline-offset-[5px] [&_li_a]:decoration-gold/70 [&_li_a]:hover:text-glow [&_li_a]:hover:underline',
  "[&_li_a[href^=http]]:after:ml-1 [&_li_a[href^=http]]:after:inline-block [&_li_a[href^=http]]:after:text-gold [&_li_a[href^=http]]:after:content-['↗'_/_'']",
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
      // No wordmark, nor its block (above).
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
