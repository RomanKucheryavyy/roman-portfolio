'use client'

import dynamic from 'next/dynamic'
import { PERSON } from '@/lib/content'
import { cn } from '@/lib/utils'
import { TopBar } from './top-bar'
import { Container, SectionHeader } from './section-header'
import { Work } from './work'
import { Products } from './products'
import { Experience } from './experience'
import { Credentials } from './credentials'
import { STAGE_FOCUS, STAGE_STYLE, stageButton, stageLink } from './look'
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
 * measured from 320 to 1920 wide (each band where its text wraps alike;
 * exact at the common phone widths, at 640, 768, 1024, 1152 (About's wide
 * layout starts there), 1280 and 1440, and within a line or two of text
 * between), so a visitor who arrives at /#contact stays on it.
 * Visitors without scripts get the page's <noscript> summary (app/page.tsx).
 */
const hold = (className: string) =>
  function Holding() {
    return <div aria-hidden="true" className={className} />
  }

const AboutTemplate = dynamic(() => import('./about'), {
  ssr: false,
  loading: hold('h-[826px] max-[334px]:h-[908px] min-[335px]:max-[367px]:h-[878px] min-[368px]:max-[373px]:h-[848px] min-[417px]:max-[457px]:h-[796px] min-[458px]:max-[517px]:h-[766px] min-[518px]:max-[607px]:h-[736px] min-[608px]:max-[639px]:h-[706px] sm:h-[706px] min-[52rem]:h-[676px] min-[65rem]:h-[646px] min-[72rem]:h-[686px] min-[76rem]:h-[637px]'),
})
const ContactBlock = dynamic(() => import('./contact'), {
  ssr: false,
  // Its own height plus the mt-12 / md:mt-16 its CONTACT_LOOK gives it.
  loading: hold('h-[1180px] max-[324px]:h-[1223px] min-[325px]:max-[372px]:h-[1203px] min-[438px]:max-[639px]:h-[1148px] sm:h-[1065px] min-[42rem]:h-[1042px] md:h-[1073px] lg:h-[611px]'),
})
const Footer = dynamic(() => import('./footer'), {
  ssr: false,
  // A colophon on a phone, two columns from lg (footer.tsx), a fixed height at each width.
  loading: hold('h-[496px] bg-background max-[324px]:h-[529px] min-[392px]:max-[413px]:h-[452px] min-[414px]:max-[617px]:h-[418px] min-[618px]:max-[639px]:h-[385px] sm:h-[385px] md:h-[397px] min-[49rem]:h-[353px] lg:h-[452px]'),
})

/* ---------------------------------------------------------------- hero -- */

/**
 * The hero is a page of the intro's book (Roman, 2026-11-01, of the curtain
 * and its stage light: "i like the roman theme better", "i actually hate
 * it"): the Old Masters print the intro lands on, still, with Hercules
 * standing in it, his words above him and his name across its foot.
 *
 * The print's ground is the page's own HTML, so it is there before the
 * painting and without it (no scripts, no WebGL, a browser that saves data):
 * the intro's flood (the wash welling up from the floor, the component's
 * own gradient in the palette, imperial.ts), its vignette and its grain,
 * still. The painting (hero-painting.tsx) lands between the flood and the
 * grain, so the grain and the vignette lie over the statue too, as the
 * intro's do.
 */
const FLOOD =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_110%,color-mix(in_srgb,var(--stage-wash),var(--stage-glow)_14%)_0%,var(--stage-wash)_55%,color-mix(in_srgb,var(--stage-wash),var(--background)_55%)_100%)]'

/** The intro's vignette (its edges sinking into the ground), then the page's foot meeting the ground of Act I. */
const SHADE =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,transparent_55%,color-mix(in_srgb,var(--background)_85%,transparent)),linear-gradient(to_bottom,transparent_88%,var(--background))]'

/**
 * The print's grain, as the intro's: fine grey noise laid over everything
 * in overlay, at the noir tone's strength; still, where the intro's
 * flickers.
 */
const GRAIN = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E\")",
} as const

/**
 * The name, set as the intro sets its word: ROMAN in Cinzel capitals filling
 * the page's measure (its letters' ink, 4.151em wide at 0.06em tracking,
 * fills the width inside the gutters), capped by the height on a short
 * screen; KUCHERYAVYY beneath at 0.32 of its size, spaced out to the same
 * measure (its letters' ink is 7.51em, so 0.547em between them). Each line
 * pads its left by its tracking, so the trailing space balances, and is
 * centred as a flex item, so a line whose advance is wider than the page
 * (the surname's, by its spacing) still stands in the middle. The line
 * heights hug the capitals.
 *
 * A dark halo keeps every letter's edge where the statue's marble stands
 * behind the name: tight to the letter, then soft, as the intro's word
 * keeps its own over the statues (imperial.ts WORD_HALO).
 */
const NAME =
  'relative -mx-4 flex flex-col items-center font-roman font-medium uppercase text-foreground md:-mx-12 [--n:min(calc((100cqw-2rem)/4.151),36svh)] md:[--n:min(calc((100cqw-6rem)/4.151),36svh)]'

/**
 * Below the light, the print sinks into its shadow: from a little above the
 * name to the page's foot the statue's body darkens towards the ground, as
 * an Old Master leaves a figure's lower half to the dark, so the light stays
 * on his head and the name stands clear.
 */
const FOOT =
  "before:pointer-events-none before:absolute before:inset-x-0 before:-bottom-[max(1rem,3svh)] before:-top-[calc(var(--n)*0.4)] before:-z-10 before:bg-linear-to-b before:from-transparent before:via-[color-mix(in_srgb,var(--background)_45%,transparent)] before:via-40% before:to-[color-mix(in_srgb,var(--background)_85%,transparent)] before:content-['']"
const NAME_HALO =
  '[text-shadow:0_0_1px_var(--background),0_0_2px_var(--background),0_0_3px_var(--background),0_0_6px_color-mix(in_oklab,var(--background)_90%,transparent),0_0_14px_color-mix(in_oklab,var(--background)_70%,transparent),0_6px_36px_color-mix(in_oklab,var(--background)_65%,transparent)]'

/**
 * His words and the two ways in, above him: the tagline in Cormorant italic
 * (as the intro's), "See the work" as the screen's one button (the intro's
 * ENTER) and "Get in touch" as a text link beside it. Centred over the
 * statue on a phone or a tall screen; on a wide one they stand at the left
 * (on the page's column, under the top bar's name), the tagline a stanza of
 * its three sentences, and Hercules on the right.
 * They set in once as the page opens, as the intro's landing's words do (a
 * transition from their starting style; while the intro is up they are held
 * there, and let go as it lifts), never under reduced motion. The name never
 * moves: it is the first and largest paint.
 */
const COPY =
  'relative flex flex-col items-center text-center lg:[@media(min-aspect-ratio:5/4)]:items-start lg:[@media(min-aspect-ratio:5/4)]:ml-[max(0px,calc(50cqw-640px))] lg:[@media(min-aspect-ratio:5/4)]:self-start lg:[@media(min-aspect-ratio:5/4)]:text-left'
const SET_IN =
  'motion-safe:transition-[opacity,translate] motion-safe:duration-[1200ms] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:starting:translate-y-4 motion-safe:starting:opacity-0 motion-safe:[html[data-intro]:not([data-intro=lift])_&]:translate-y-4 [html[data-intro]:not([data-intro=lift])_&]:opacity-0'
const TAGLINE =
  'max-w-[24em] font-serif text-[clamp(1.25rem,6cqw,1.625rem)] italic leading-[1.15] text-(--stage-text) text-balance md:text-[clamp(1.75rem,3.4cqw,2.5rem)] lg:[@media(min-aspect-ratio:5/4)]:text-[clamp(2rem,3.1cqw,3.25rem)] lg:[@media(min-aspect-ratio:5/4)]:leading-[1.12] [text-shadow:0_1px_24px_color-mix(in_srgb,var(--background)_60%,transparent)]'
const SENTENCE = 'lg:[@media(min-aspect-ratio:5/4)]:block'

/** The tagline's sentences, each with the space before it, so the words are the record's exactly. */
const sentences = (text: string) => text.match(/\s*[^.]+(?:\.|$)/g) ?? [text]

function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="@container relative isolate overflow-hidden bg-background">
      <div aria-hidden="true" className={FLOOD} />
      <HeroPainting />
      <div aria-hidden="true" className={SHADE} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.11] mix-blend-overlay" style={GRAIN} />
      <div className="relative z-[1] flex min-h-svh flex-col px-4 pb-[max(1rem,3svh)] pt-[calc(3.5rem+4svh)] md:px-12 md:pt-[calc(4rem+5svh)]">
        <h1 id="hero-title" className={cn('order-last text-center', NAME, FOOT, NAME_HALO)}>
          <span className="block whitespace-nowrap pl-[0.06em] text-(length:--n) leading-[0.82] tracking-[0.06em]">{PERSON.first}</span>{' '}
          <span className="mt-[calc(var(--n)*0.14)] block whitespace-nowrap pl-[0.547em] text-[length:calc(var(--n)*0.32)] leading-[0.82] tracking-[0.547em] text-(--stage-text)">
            {PERSON.last}
          </span>
        </h1>
        <div data-hero-copy="" className={COPY}>
          <p className={cn(TAGLINE, SET_IN, 'motion-safe:delay-150')}>
            {sentences(PERSON.tagline).map((s) => (
              <span key={s} className={SENTENCE}>
                {s}
              </span>
            ))}
          </p>
          <div className={cn('mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-1 md:mt-7 md:gap-x-9 lg:[@media(min-aspect-ratio:5/4)]:justify-start', SET_IN, 'motion-safe:delay-[400ms]')}>
            <a href="#work" className={stageButton('primary')}>
              See the work
            </a>
            <a href="#contact" className={stageLink()}>
              Get in touch
            </a>
          </div>
        </div>
        {/* Hercules's room (hero-painting-stage.tsx): at least this much between his words and his name. */}
        <div aria-hidden="true" data-hero-room="" className="min-h-[max(8rem,24svh)] flex-1 lg:[@media(min-aspect-ratio:5/4)]:min-h-[6svh]" />
      </div>
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
 * Direction C, "Stage": the page opens on a page of the Roman print, then the programme
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
