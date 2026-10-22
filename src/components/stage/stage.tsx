'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Github, Linkedin, Mail } from 'lucide-react'
import DrapeBackground from '@/components/ui/kokonut-drape-background'
import type { PortfolioBadge } from '@/components/ui/portfolio-hero-physics'
import { Composer } from './composer'
import { Button } from '@/components/ui/button'
import { PERSON, ROLES, SKILLS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { TopBar, SECTIONS } from './top-bar'
import { Container, SectionHeader } from './section-header'
import { Work } from './work'
import { Products } from './products'
import { Experience } from './experience'
import { Credentials } from './credentials'
import { STAGE_FOCUS, STAGE_STYLE } from './look'

const EMAIL_HREF = `mailto:${PERSON.links.email}`

/* ---------------------------------------------------------- lazy parts -- */

/**
 * The heavy pieces below the first screen load after the page is up, not
 * before it: the About template (matter-js), the contact card (d3 and
 * topojson for the globe) and the footer (the paper shaders' fluted glass).
 * Experience's Lifeline is the fourth (experience.tsx). Each is fetched as
 * soon as the page hydrates, so it is in place long before anyone scrolls or
 * Tabs to it; until then a block of the same height holds its place, so
 * nothing below moves when it lands. The heights are the components' own,
 * measured at 390, 640, 768, 1024, 1280 and 1440 wide (exact there, and
 * within a few lines of text between), so a visitor who arrives at
 * /#contact stays on it.
 * Visitors without scripts get the page's <noscript> summary (app/page.tsx).
 */
const hold = (className: string) =>
  function Holding() {
    return <div aria-hidden="true" className={className} />
  }

const PortfolioTemplate = dynamic(() => import('@/components/ui/portfolio-hero-physics').then((m) => m.PortfolioTemplate), {
  ssr: false,
  loading: hold('h-[834px] sm:h-[634px] md:h-[606px] lg:h-[578px] xl:h-[640px]'),
})
const ContactWithGlobe = dynamic(() => import('@/components/ui/contact-with-globe'), {
  ssr: false,
  // Its own height plus the mt-12 / md:mt-16 CONTACT_LOOK gives it.
  loading: hold('h-[1169px] sm:h-[1043px] md:h-[1075px] lg:h-[636px] xl:h-[604px]'),
})
const FooterSection5 = dynamic(() => import('@/components/ui/footer-section-5'), {
  ssr: false,
  // Its wordmark scales with the width, so from md the height does too.
  loading: hold('h-[816px] bg-background md:h-[calc(867px+11.2vw)] lg:h-[calc(592px+11.2vw)]'),
})

/* ---------------------------------------------------------------- hero -- */

function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title">
      <DrapeBackground className="min-h-svh dark:bg-background" wind={0.9} pleat={36}>
        <div className="relative mx-auto flex w-full max-w-[1280px] flex-col items-center px-4 pb-10 pt-24 text-center md:px-12">
          <h1
            id="hero-title"
            className="text-[clamp(3.4rem,11.5vw,11rem)] font-bold leading-[0.86] tracking-[-0.06em] text-foreground"
          >
            <span className="block">{PERSON.first}</span> <span className="block">{PERSON.last}</span>
          </h1>
          <p className="mt-8 max-w-[22rem] text-base leading-relaxed text-foreground/75 text-balance md:mt-10 md:max-w-none md:text-xl">
            {PERSON.tagline}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 md:mt-11">
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <a href="#work">See the work</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6 backdrop-blur-sm">
              <a href="#contact">Get in touch</a>
            </Button>
          </div>
        </div>
        {/* The stage floor: the curtain's hem fades into the page. */}
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

// Every skill in the template's one plain style: they are one list.
const BADGES: PortfolioBadge[] = SKILLS.map((label) => ({ label }))

/**
 * The template, re-pointed from outside (descendant classes on its own
 * className) so it sits in the page's column and type:
 * - its glow starts at the block's top instead of 160-200px above it;
 * - the badge zone and the space above the name shrink to what the pile
 *   needs (260px on phones, 220px from the template's wide layout);
 * - a vertical swipe that starts on a badge scrolls the page (pan-y; the
 *   browser's pointercancel ends the grab), a sideways drag still throws it;
 * - its column is the page's 1280px with the 16px / 48px gutter;
 * - the role line takes the page's muted ink (the template's #767676 is
 *   4.46:1 on its black).
 */
const ABOUT_LOOK = [
  '[&_section>div:first-child]:top-0',
  '[&_section]:pt-[276px] @6xl:[&_section]:pt-[244px]',
  '[&_[aria-label=Keywords]]:h-[260px] @6xl:[&_[aria-label=Keywords]]:h-[220px]',
  '[&_[aria-label=Keywords]>div]:[touch-action:pan-y_pinch-zoom]',
  '[&>div]:max-w-[1280px] [&_section>div.relative]:px-4 md:[&_section>div.relative]:px-12',
  '[&_p.m-0.text-lg]:text-muted-foreground!',
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
 * the page column, so Contact reads like every other act.
 */
const CONTACT_LOOK = cn(
  'mt-12 pb-8 pt-0 dark:bg-background md:mt-16 md:pb-12',
  '[&>div>div:first-child]:hidden [&>div]:px-4 md:[&>div]:px-12 [&_.max-w-5xl]:max-w-none lg:[&_.max-w-5xl]:gap-16',
  '[&_:is(input,textarea):focus-visible]:outline-2 [&_:is(input,textarea):focus-visible]:outline-solid [&_:is(input,textarea):focus-visible]:outline-offset-2 [&_:is(input,textarea):focus-visible]:outline-[var(--stage-accent-ink)]',
)

function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="scroll-mt-14 border-t border-white/[0.06] pt-16 md:pt-24"
      style={
        {
          // The component's own palette, re-pointed rather than rewritten: its
          // rose accent becomes the page's violet, its zinc-950 (the globe's
          // fade) becomes the page black so the fade has no edge, and its
          // zinc-500 labels lift to zinc-400 for contrast on the form card.
          '--color-rose-50': 'color-mix(in oklab, var(--stage-accent-ink) 12%, transparent)',
          '--color-rose-300': 'var(--stage-accent-ink)',
          '--color-rose-400': 'var(--stage-accent-ink)',
          '--color-rose-500': 'var(--stage-accent-ink)',
          '--color-zinc-950': 'var(--background)',
          '--color-zinc-500': 'oklch(0.705 0.015 286.067)',
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
        // Tactile's message box in place of the component's own form.
        form={<Composer />}
      />
    </section>
  )
}

/* -------------------------------------------------------------- footer -- */

function Footer() {
  return (
    <FooterSection5
      wordmarkAs="p"
      brand={PERSON.first}
      logo={null}
      socials={null}
      tagline={PERSON.manifesto}
      copyright={<>© {new Date().getFullYear()} {PERSON.name}</>}
      panelColor="var(--stage-accent)"
      // Its content column moves onto the page's gutter (16px, 48px from md).
      className="bg-background [&_.max-w-7xl]:px-4 md:[&_.max-w-7xl]:px-12"
      // One line at every width, sunk a little into the panel like the
      // component's own; a firmer stroke than its 1px at half opacity.
      wordmarkClassName="text-center text-[28vw] sm:text-[28vw] md:text-[16vw] leading-[0.8] whitespace-nowrap opacity-100 [-webkit-text-stroke:1px_rgba(255,255,255,0.8)] -mb-[0.1em] md:-mb-[0.1em]"
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
      // Stage black, the violet accent and the page's one focus ring (look.ts).
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
