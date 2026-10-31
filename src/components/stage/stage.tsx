'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Github, Linkedin, Mail } from 'lucide-react'
import DrapeBackground from '@/components/ui/kokonut-drape-background'
import type { PortfolioBadge } from '@/components/ui/portfolio-hero-physics'
import { PERSON, ROLES, SKILLS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { TopBar, SECTIONS } from './top-bar'
import { Container, Ornament, SectionHeader } from './section-header'
import { Work } from './work'
import { Products } from './products'
import { Experience } from './experience'
import { Credentials } from './credentials'
import { STAGE_FOCUS, STAGE_STYLE, stageButton } from './look'

const EMAIL_HREF = `mailto:${PERSON.links.email}`

/* ---------------------------------------------------------- lazy parts -- */

/**
 * The heavy pieces below the first screen load after the page is up, not
 * before it: the About template (matter-js), the contact card (d3 and
 * topojson for the globe, and the message box with its motion parts:
 * contact-card.tsx) and the footer (the paper shaders' fluted glass).
 * Experience's Lifeline is the fourth (experience.tsx). Each is fetched as
 * soon as the page hydrates, so it is in place long before anyone scrolls or
 * Tabs to it; until then a block of the same height holds its place, so
 * nothing below moves when it lands. The heights are the components' own,
 * measured at 390, 640, 768, 1024, 1152 (About's wide layout starts there),
 * 1280 and 1440 wide (exact there, and within a few lines of text between),
 * so a visitor who arrives at /#contact stays on it.
 * Visitors without scripts get the page's <noscript> summary (app/page.tsx).
 */
const hold = (className: string) =>
  function Holding() {
    return <div aria-hidden="true" className={className} />
  }

const PortfolioTemplate = dynamic(() => import('@/components/ui/portfolio-hero-physics').then((m) => m.PortfolioTemplate), {
  ssr: false,
  loading: hold('h-[802px] sm:h-[640px] md:h-[606px] lg:h-[572px] min-[72rem]:h-[686px] xl:h-[637px]'),
})
// The card and the message box inside it, one module (contact-card.tsx).
const ContactWithGlobe = dynamic(() => import('./contact-card'), {
  ssr: false,
  // Its own height plus the mt-12 / md:mt-16 CONTACT_LOOK gives it.
  loading: hold('h-[1184px] sm:h-[1058px] md:h-[1090px] lg:h-[648px] min-[72rem]:h-[616px]'),
})
const FooterSection5 = dynamic(() => import('@/components/ui/footer-section-5'), {
  ssr: false,
  // With its wordmark hidden (Footer, below), a fixed height at each width.
  loading: hold('h-[813px] bg-background sm:h-[779px] md:h-[912px] lg:h-[581px]'),
})

/* ---------------------------------------------------------------- hero -- */

/**
 * The curtain dyed imperial, from outside: the component reads its two
 * shader colours from two hidden spans' text colour (the lit face, then the
 * deepest fold), so descendant classes re-point them: the lit fold in the
 * intro's imperial violet, the deepest in the ground. Its own ground is the
 * page's.
 */
const DRAPE_LOOK = cn(
  'min-h-svh dark:bg-background',
  '[&>span:nth-child(1)]:text-imperial! [&>span:nth-child(2)]:text-background!',
)

/**
 * The intro's landing, lifted onto the page: the curtain in its violet,
 * lit warm from above as its stage is; a small gold crest; the name in
 * Cinzel capitals, ROMAN large as the intro sets it and the surname spaced
 * out beneath to the same measure, as an inscription; the tagline in
 * Cormorant italic, as the intro sets it; and its ENTER button's style for
 * the two ways in.
 */
function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title">
      <DrapeBackground className={DRAPE_LOOK} wind={0.9} pleat={36}>
        {/* Warm light on the stage, behind the name. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_44%_at_50%_42%,color-mix(in_oklab,var(--stage-glow)_17%,transparent),color-mix(in_oklab,var(--stage-accent-ink)_6%,transparent)_45%,transparent_76%)] mix-blend-screen"
        />
        <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 pb-10 pt-24 text-center md:px-12">
          <Ornament />
          <h1 id="hero-title" className="mt-7 font-roman font-medium uppercase text-foreground md:mt-9">
            <span className="block text-[clamp(3.5rem,18.5vw,12rem)] leading-[0.92] tracking-[0.05em] [padding-left:0.05em]">
              {PERSON.first}
            </span>{' '}
            <span className="mt-[0.45em] block text-[clamp(1.25rem,7.1vw,4.6rem)] leading-none tracking-[0.32em] [padding-left:0.32em] text-(--stage-text)">
              {PERSON.last}
            </span>
          </h1>
          <p className="mt-9 max-w-[24ch] font-serif text-[clamp(1.375rem,6vw,1.75rem)] italic leading-[1.18] text-(--stage-text) text-balance sm:max-w-[34ch] md:mt-11 md:max-w-[40ch] md:text-[clamp(1.75rem,2.7vw,2.5rem)]">
            {PERSON.tagline}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:mt-11 md:gap-4">
            <a href="#work" className={cn(stageButton('primary'), 'min-w-40')}>
              See the work
            </a>
            <a href="#contact" className={cn(stageButton('secondary'), 'min-w-40 backdrop-blur-sm')}>
              Get in touch
            </a>
          </div>
        </div>
        {/* The stage floor: the curtain's hem fades into the page (under the words, which stay on top). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
      </DrapeBackground>
    </section>
  )
}

/* --------------------------------------------------------------- about -- */

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
  bg: 'linear-gradient(168deg, var(--foreground) 0%, var(--foreground) 46%, color-mix(in oklab, var(--foreground) 80%, var(--stage-accent-ink)) 100%)',
  border: 'color-mix(in oklab, var(--stage-accent-ink) 85%, transparent)',
  color: 'var(--background)',
}
const BADGES: PortfolioBadge[] = SKILLS.map((label) => ({ label, ...TILE }))

/**
 * The template, re-pointed from outside (descendant classes on its own
 * className; `!` where it sets the value inline) so it sits in the page's
 * column, ground and type. About's own Roman idea is the portrait in an
 * arched niche and the skills as mosaic tiles:
 * - its #060606 ground and white ink give way to the page's ground and
 *   marble, and its blue glow becomes the imperial violet's, starting at the
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
 *   running text in a dimmed lavender (5.6:1 on the ground, 4.6:1 at the
 *   glow's brightest, at 28px and up),
 *   the phrases he would underline in gold (10:1);
 * - his links take the Stage's Geist capitals, with gold arrows.
 */
const ABOUT_LOOK = [
  'bg-transparent! text-foreground!',
  '[&_section>div:first-child]:top-0',
  '[&_section>div:first-child]:[background:radial-gradient(closest-side,color-mix(in_oklab,var(--stage-rule)_62%,transparent),color-mix(in_oklab,var(--stage-accent)_45%,transparent)_55%,transparent)]!',
  '[&_section]:pt-[276px] @6xl:[&_section]:pt-[244px]',
  '[&_[aria-label=Keywords]]:h-[260px] @6xl:[&_[aria-label=Keywords]]:h-[220px]',
  '[&_[aria-label=Keywords]>div]:[touch-action:pan-y_pinch-zoom]',
  '[&_[aria-label=Keywords]>div]:rounded-[3px] [&_[aria-label=Keywords]>div]:font-medium [&_[aria-label=Keywords]>div]:text-[15px] [&_[aria-label=Keywords]>div]:tracking-[0.01em]',
  '[&_[aria-label=Keywords]>div]:shadow-[inset_0_1px_0_rgb(255_255_255/0.7),0_10px_18px_-10px_rgb(0_0_0/0.9)]',
  '[&>div]:max-w-[1280px] [&_section>div.relative]:px-4 md:[&_section>div.relative]:px-12',
  // The portrait, in its niche.
  '[&_section>div.relative>div:first-child>div:first-child]:rounded-[30px_30px_2px_2px]',
  '[&_section>div.relative>div:first-child>div:first-child]:border-gold/80!',
  '[&_section>div.relative>div:first-child>div:first-child]:shadow-[0_0_0_4px_var(--background),0_0_0_5px_color-mix(in_oklab,var(--stage-accent-ink)_35%,transparent)]',
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

function About() {
  const ref = useRef<HTMLElement>(null)
  // The badges are shuffled on the client, so they mount empty (no server /
  // client mismatch) and drop when the zone is in place (below).
  const [badges, setBadges] = useState<PortfolioBadge[]>([])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const drop = () => setBadges(BADGES)
    // The template loads after the page (see "lazy parts"), so its zone may
    // not be there yet: wait for it, then watch it.
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
    <section ref={ref} id="about" aria-labelledby="about-title" className="scroll-mt-14 py-16 md:py-24">
      <Container>
        <SectionHeader
          id="about-title"
          act="Act V"
          kicker="About"
          title="In my own words"
          intro="Music, family, and the tools I build with."
        />
      </Container>
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
    </section>
  )
}

/* ------------------------------------------------------------- contact -- */

/**
 * The component's own header (a centred pill and a 60px h2) is hidden in
 * favour of the page's SectionHeader, and its 1024px centred grid widens to
 * the page column, so Contact reads like every other act. Contact's own
 * Roman idea is the globe: the world in gold on an imperial violet sphere
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
  '[&_.h-52>div:first-child]:bg-[radial-gradient(circle_farthest-side_at_50%_50%,transparent_88%,color-mix(in_oklab,var(--stage-accent-ink)_16%,transparent)_90%,transparent_97%),radial-gradient(circle_farthest-side_at_50%_50%,color-mix(in_oklab,var(--stage-accent)_70%,var(--background))_0%,var(--stage-accent)_72%,color-mix(in_oklab,var(--stage-accent)_70%,var(--stage-rule))_89.4%,transparent_90%)]',
)

function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="scroll-mt-14 border-t border-rule/40 pt-16 md:pt-24"
      style={
        {
          // The component's own palette, re-pointed rather than rewritten:
          // its rose accent becomes the page's gold; its white the marble;
          // its zinc greys the imperial inks: zinc-950 (the globe's fade) the
          // page's ground, so the fade has no edge; zinc-400 and -500 (its
          // notes, its channels and their icons) the lavender; zinc-700 and
          // -800 (the icon tiles) the violet rule.
          '--color-rose-50': 'color-mix(in oklab, var(--stage-accent-ink) 12%, transparent)',
          '--color-rose-300': 'var(--stage-accent-ink)',
          '--color-rose-400': 'var(--stage-accent-ink)',
          '--color-rose-500': 'var(--stage-accent-ink)',
          '--color-white': 'var(--foreground)',
          '--color-zinc-400': 'var(--muted-foreground)',
          '--color-zinc-500': 'var(--muted-foreground)',
          '--color-zinc-700': 'color-mix(in oklab, var(--stage-rule) 80%, transparent)',
          '--color-zinc-800': 'color-mix(in oklab, var(--stage-accent) 60%, var(--background))',
          '--color-zinc-950': 'var(--background)',
        } as React.CSSProperties
      }
    >
      <Container>
        <SectionHeader
          id="contact-title"
          act="Act VI"
          kicker="Contact"
          title="Let’s talk"
          intro="Write to me directly, or leave a note below."
        />
      </Container>
      <ContactWithGlobe
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
    </section>
  )
}

/* -------------------------------------------------------------- footer -- */

/**
 * The curtain's last fall: the fluted glass over the imperial violet, lit
 * gold from its top edge, which is a gilt line. The footer closes quietly:
 * his monogram as the panel's mark, his manifesto in Cormorant italic, the
 * columns' titles in gold Geist capitals, and a closing line in Cinzel with
 * his name. The component's giant wordmark is hidden: his name already
 * stands full-width in the intro and the hero, and the products' names on
 * their title cards, so a fifth giant word would only repeat them. On the
 * violet: gold 7.9:1, the links (the text ink at 84%) over 9:1.
 */
const FOOTER_LOOK = cn(
  'bg-background [&_.max-w-7xl]:px-4 md:[&_.max-w-7xl]:px-12',
  '[&>div:nth-child(2)]:border-t [&>div:nth-child(2)]:border-gold/55',
  '[&>div:nth-child(2)]:bg-[radial-gradient(60%_42%_at_50%_0%,color-mix(in_oklab,var(--stage-accent-ink)_14%,transparent),transparent),linear-gradient(to_bottom,transparent_55%,color-mix(in_oklab,var(--background)_45%,transparent))]',
  '[&_.max-w-sm]:max-w-md',
  '[&_h2]:font-serif [&_h2]:text-[1.75rem] [&_h2]:font-normal [&_h2]:italic [&_h2]:leading-[1.2] [&_h2]:text-foreground [&_h2]:text-pretty md:[&_h2]:text-[2rem]',
  '[&_h3]:text-xs [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.24em] [&_h3]:text-gold md:[&_h3]:text-xs',
  '[&_li_a]:text-(--stage-text)/84 [&_li_a]:hover:text-glow',
)

function Footer() {
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
      panelColor="var(--stage-accent)"
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

/* --------------------------------------------------------------- stage -- */

/**
 * Direction C, "Stage": the page opens on a curtain, then the programme
 * (client work, own products), the career, the credentials, the performer in
 * his own words, and a way to get in touch. `children` lands at the end of
 * the page's <main> (app/page.tsx passes its <noscript> summary).
 */
export function Stage({ children }: { children?: React.ReactNode }) {
  return (
    <div
      // The imperial ground, inks and gold and the page's one focus ring
      // (look.ts). The Roman faces' variables are on <html> (layout.tsx).
      className={cn('relative min-h-svh overflow-x-clip bg-background font-sans text-foreground antialiased', STAGE_FOCUS)}
      style={STAGE_STYLE}
    >
      <TopBar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Work />
        <Products />
        <Experience />
        <Credentials />
        <About />
        <Contact />
        {/* The server page's <noscript> summary, inside the one <main>. */}
        {children}
      </main>
      <Footer />
    </div>
  )
}
