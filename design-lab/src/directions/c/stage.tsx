'use client'

import { useEffect, useRef, useState } from 'react'
import { Github, Linkedin, Mail } from 'lucide-react'
import DrapeBackground from '@/components/ui/kokonut-drape-background'
import { PortfolioTemplate, type PortfolioBadge } from '@/components/ui/portfolio-hero-physics'
import ContactWithGlobe from '@/components/ui/contact-with-globe'
import FooterSection5 from '@/components/ui/footer-section-5'
import { Button } from '@/components/ui/button'
import { PERSON, ROLES, SKILLS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { TopBar, SECTIONS } from './top-bar'
import { Container, SectionHeader } from './section-header'
import { Work } from './work'
import { Products } from './products'
import { Experience } from './experience'
import { Credentials } from './credentials'

const EMAIL_HREF = `mailto:${PERSON.links.email}`

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

// PERSON.about, word for word; the ** only mark the template's highlights.
const BIO = [
  '**Music and code run on the same engine** — structure, rhythm, and knowing exactly when to improvise.',
  'As head conductor of the FUBC Band, I shape sound the way I shape software: **with intention and a little audacity.**',
  'Off the clock, my wife and daughter remind me why any of this matters. **The best things I build serve people I love.**',
].join(' ')

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

function About() {
  const ref = useRef<HTMLElement>(null)
  // The badges are shuffled on the client, so they mount empty (no server /
  // client mismatch) and drop when the zone is in place (below).
  const [badges, setBadges] = useState<PortfolioBadge[]>([])

  useEffect(() => {
    const zone = ref.current?.querySelector('[aria-label="Keywords"]')
    if (!zone) return
    let timer = 0
    const drop = () => {
      setBadges(BADGES)
      near.disconnect()
      whole.disconnect()
      window.clearTimeout(timer)
    }
    // Normally: once the zone's top is in the upper part of the screen, so
    // the badges fall out from under the heading rather than appearing at a
    // line low on the screen.
    const near = new IntersectionObserver(([e]) => e.isIntersecting && drop(), { rootMargin: '-56px 0px -55% 0px' })
    // A visitor who stops with the whole zone in view (say, after the
    // About link) gets the drop after a beat rather than an empty glow.
    const whole = new IntersectionObserver(
      ([e]) => {
        window.clearTimeout(timer)
        if (e.isIntersecting) timer = window.setTimeout(drop, 1200)
      },
      { threshold: 1 },
    )
    near.observe(zone)
    whole.observe(zone)
    return () => {
      near.disconnect()
      whole.disconnect()
      window.clearTimeout(timer)
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
  const [status, setStatus] = useState<'idle' | 'empty' | 'opening'>('idle')

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
        formNote="Sending opens your own mail app with the note addressed to me. Nothing is stored on this page."
        links={[
          { icon: Mail, label: PERSON.links.email, href: EMAIL_HREF },
          { icon: Linkedin, label: 'linkedin.com/in/romakuch', href: PERSON.links.linkedin },
          { icon: Github, label: 'github.com/RomanKucheryavyy', href: PERSON.links.github },
        ]}
        placeholders={{
          name: 'Your name',
          company: 'Optional',
          email: 'you@example.com',
          message: 'What would you like to talk about?',
        }}
        submitLabel={status === 'opening' ? 'Opening your mail app…' : status === 'empty' ? 'Write a message first' : 'Send'}
        onSubmit={({ name, company, email, message }) => {
          if (!message.trim()) {
            setStatus('empty')
            return
          }
          const from = [name, company && `(${company})`].filter(Boolean).join(' ')
          const subject = from ? `Hello from ${from}` : 'Hello'
          const body = email ? `${message}\n\nReply to: ${email}` : message
          window.location.href = `${EMAIL_HREF}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
          setStatus('opening')
        }}
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

/** One focus ring for every link and button on the page: the violet ink, clear of the shape. */
const FOCUS =
  '[&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[var(--stage-accent-ink)]'

/**
 * Direction C, "Stage": the page opens on a curtain, then the programme
 * (client work, own products), the career, the credentials, the performer in
 * his own words, and a way to get in touch.
 */
export function Stage() {
  return (
    <div
      className={cn('relative min-h-svh overflow-x-clip bg-background font-sans text-foreground antialiased', FOCUS)}
      style={
        {
          // Stage black for the page (the About block's own #060606, so the
          // sections meet without a seam), and the one accent (the violet
          // wash that block's glow already uses), as a fill and a legible ink.
          // --ring lifts shadcn's focus ring from dark grey to near white.
          '--background': '#060606',
          '--stage-accent': '#16106d',
          '--stage-accent-ink': '#9d94ff',
          '--ring': 'oklch(0.95 0 0)',
        } as React.CSSProperties
      }
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
      </main>
      <Footer />
    </div>
  )
}
