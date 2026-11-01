'use client'

import dynamic from 'next/dynamic'
import DrapeBackground from '@/components/ui/kokonut-drape-background'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'
import { TopBar } from './top-bar'
import { Container, SectionHeader } from './section-header'
import { Work } from './work'
import { Products } from './products'
import { Experience } from './experience'
import { Credentials } from './credentials'
import { STAGE_FOCUS, STAGE_STYLE, stageButton } from './look'
import { HeroPainting } from './hero-painting'

/* ---------------------------------------------------------- lazy parts -- */

/**
 * The heavy pieces below the first screen load after the page is up, not
 * before it, each with the glue that configures it in a module of its own
 * (so its class strings and its logic are not in the first load either):
 * the About template (matter-js; about.tsx), the contact card (d3 and
 * topojson for the globe, and the message box with its motion parts;
 * contact.tsx, around contact-card.tsx) and the footer (the paper shaders'
 * fluted glass; footer.tsx). Experience's Lifeline (experience-road.tsx)
 * and Act IV's frieze (frieze.tsx) are two more. Each is fetched as soon
 * as the page hydrates, so it is in place long before anyone scrolls or
 * Tabs to it; until then a block of the same height holds its place, so
 * nothing below moves when it lands. The sections, their ids and their
 * headers are the page's own HTML. The heights are the components' own,
 * measured at 390, 640, 768, 1024, 1152 (About's wide layout starts there),
 * 1280 and 1440 wide (exact there, and within a few lines of text between),
 * so a visitor who arrives at /#contact stays on it.
 * Visitors without scripts get the page's <noscript> summary (app/page.tsx).
 */
const hold = (className: string) =>
  function Holding() {
    return <div aria-hidden="true" className={className} />
  }

const AboutTemplate = dynamic(() => import('./about'), {
  ssr: false,
  loading: hold('h-[802px] sm:h-[640px] md:h-[606px] lg:h-[572px] min-[72rem]:h-[686px] xl:h-[637px]'),
})
const ContactBlock = dynamic(() => import('./contact'), {
  ssr: false,
  // Its own height plus the mt-12 / md:mt-16 its CONTACT_LOOK gives it.
  loading: hold('h-[1184px] sm:h-[1058px] md:h-[1090px] lg:h-[648px] min-[72rem]:h-[616px]'),
})
const Footer = dynamic(() => import('./footer'), {
  ssr: false,
  // With its wordmark hidden (footer.tsx), a fixed height at each width.
  loading: hold('h-[813px] bg-background sm:h-[779px] md:h-[912px] lg:h-[581px]'),
})

/* ---------------------------------------------------------------- hero -- */

/**
 * The curtain dyed in the palette, from outside: the component reads its
 * two shader colours from two hidden spans' text colour (the lit face, then
 * the deepest fold), so descendant classes re-point them: the lit fold in
 * the wash (the intro's flood), the deepest in the ground. Its own ground
 * is the page's.
 */
const DRAPE_LOOK = cn(
  'min-h-svh dark:bg-background',
  '[&>span:nth-child(1)]:text-wash! [&>span:nth-child(2)]:text-background!',
)

/**
 * The intro's landing, lifted onto the page: the curtain in the wash,
 * lit warm from above as its stage is; the name in
 * Cinzel capitals, ROMAN large as the intro sets it and the surname spaced
 * out beneath to the same measure, as an inscription; the tagline in
 * Cormorant italic, as the intro sets it; and its ENTER button's style for
 * the two ways in.
 *
 * And the intro's painting (Roman, 2026-10-31: "the hero can still have the
 * painting thingy", "make it epic"): Hercules, a colossal marble bust
 * painted as the intro paints its cast, rising out of a dark niche between
 * the name and the tagline, his head bowed beneath the name, in the gold
 * light falling on both (hero-painting.tsx). So the name stands at the top
 * of the stage and the tagline and the buttons at its foot, with his room
 * between. His curls start below the surname, so no letter stands on
 * marble; the name keeps a dark halo, a few px wide and invisible on the
 * curtain, for the gold light falling across it. The tagline and the
 * buttons stand on the curtain, where he has faded out. On a short
 * screen the name is capped by the height as well as the width (in vh,
 * which every browser knows), so name, room and buttons still fit one
 * screen 768 tall.
 */
const NAME_HALO =
  '[text-shadow:0_0_1px_var(--background),0_0_2px_var(--background),0_0_4px_color-mix(in_oklab,var(--background)_90%,transparent),0_0_18px_color-mix(in_oklab,var(--background)_55%,transparent)]'

function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title">
      <DrapeBackground className={DRAPE_LOOK} wind={0.9} pleat={36}>
        {/* Warm light on the stage, behind the name. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_44%_at_50%_42%,color-mix(in_oklab,var(--stage-glow)_17%,transparent),color-mix(in_oklab,var(--stage-gold)_6%,transparent)_45%,transparent_76%)] mix-blend-screen"
        />
        <HeroPainting />
        <div className="relative z-[1] mx-auto flex min-h-svh w-full max-w-[1280px] flex-col items-center px-4 pb-8 pt-20 text-center md:px-12">
          <h1 id="hero-title" className={cn('mt-6 font-roman font-medium uppercase text-foreground', NAME_HALO)}>
            <span className="block text-[clamp(3.5rem,min(18.5vw,22vh),12rem)] leading-[0.92] tracking-[0.05em] [padding-left:0.05em]">
              {PERSON.first}
            </span>{' '}
            <span className="mt-[0.45em] block text-[clamp(1.25rem,min(7.1vw,8.5vh),4.6rem)] leading-none tracking-[0.32em] [padding-left:0.32em] text-(--stage-text)">
              {PERSON.last}
            </span>
          </h1>
          {/* Hercules's room (hero-painting-stage.tsx): the words below stand at the foot of the stage. */}
          <div aria-hidden="true" className="min-h-[clamp(8rem,22svh,22rem)] flex-1" />
          <div data-hero-copy="" className="flex flex-col items-center">
            <p className="max-w-[24ch] font-serif text-[clamp(1.375rem,6vw,1.75rem)] italic leading-[1.18] text-(--stage-text) text-balance sm:max-w-[34ch] md:max-w-[40ch] md:text-[clamp(1.75rem,2.7vw,2.5rem)]">
              {PERSON.tagline}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:gap-4">
              <a href="#work" className={cn(stageButton('primary'), 'min-w-40')}>
                See the work
              </a>
              <a href="#contact" className={cn(stageButton('secondary'), 'min-w-40 backdrop-blur-sm')}>
                Get in touch
              </a>
            </div>
          </div>
        </div>
        {/* The stage floor: the curtain's hem fades into the page (under the words, which stay on top). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
      </DrapeBackground>
    </section>
  )
}

/* --------------------------------------------------------------- about -- */

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-14 py-16 md:py-24">
      <Container>
        <SectionHeader
          id="about-title"
          act="Act V"
          kicker="About"
          title="In my own words"
          intro="Music, family, and the tools I build with."
        />
      </Container>
      <AboutTemplate />
    </section>
  )
}

/* ------------------------------------------------------------- contact -- */

function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-14 pt-16 md:pt-24">
      <Container>
        <SectionHeader
          id="contact-title"
          act="Act VI"
          kicker="Contact"
          title="Let’s talk"
          intro="Write to me directly, or leave a note below."
        />
      </Container>
      <ContactBlock />
    </section>
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
      // The palette's ground, inks and gold and the page's one focus ring
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
