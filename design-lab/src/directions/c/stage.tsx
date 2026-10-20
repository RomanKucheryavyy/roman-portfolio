'use client'

import { useEffect, useRef, useState } from 'react'
import { Github, Linkedin, Mail } from 'lucide-react'
import DrapeBackground from '@/components/ui/kokonut-drape-background'
import { PortfolioTemplate, type PortfolioBadge } from '@/components/ui/portfolio-hero-physics'
import ContactWithGlobe from '@/components/ui/contact-with-globe'
import FooterSection5 from '@/components/ui/footer-section-5'
import { Button } from '@/components/ui/button'
import { PERSON, ROLES, SKILLS } from '@/lib/content'
import { TopBar, SECTIONS } from './top-bar'
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

// Salesforce-platform skills are filled, everything else outlined: one
// grouping, no extra colors.
const PLATFORM = new Set<string>(['Salesforce', 'Data Cloud', 'CRMA', 'LWC', 'Apex'])
const BADGES: PortfolioBadge[] = SKILLS.map((label) =>
  PLATFORM.has(label) ? { label, bg: '#f4f4f5', border: '#f4f4f5', color: '#0a0a0a' } : { label },
)

function About() {
  const ref = useRef<HTMLElement>(null)
  // The badges are shuffled on the client, so they mount empty (no server /
  // client mismatch) and drop the first time the block comes into view.
  const [badges, setBadges] = useState<PortfolioBadge[]>([])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBadges(BADGES)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} id="about" aria-label="About" className="scroll-mt-14">
      <PortfolioTemplate
        theme="dark"
        nameAs="h2"
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
        // Its case carousel would repeat the nine projects that Act I shows
        // one scroll later, so it is left empty.
        cases={[]}
      />
    </section>
  )
}

/* ------------------------------------------------------------- contact -- */

function Contact() {
  const [sent, setSent] = useState(false)

  return (
    <div
      id="contact"
      className="scroll-mt-14 border-t border-white/[0.06]"
      style={
        {
          // The component's own palette, re-pointed rather than rewritten: its
          // rose accent becomes the page's violet, and its zinc-950 (the
          // globe's fade) becomes the page black so the fade has no edge.
          '--color-rose-50': 'color-mix(in oklab, var(--stage-accent-ink) 12%, transparent)',
          '--color-rose-300': 'var(--stage-accent-ink)',
          '--color-rose-400': 'var(--stage-accent-ink)',
          '--color-rose-500': 'var(--stage-accent-ink)',
          '--color-zinc-950': 'var(--background)',
        } as React.CSSProperties
      }
    >
      <ContactWithGlobe
        className="pb-8 pt-16 dark:bg-background md:pb-12 md:pt-32"
        subtitle="Act V · Contact"
        title="Let’s talk"
        description="Write to me directly, or leave a note below."
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
        submitLabel={sent ? 'Opened in your mail app' : 'Send'}
        onSubmit={({ name, company, email, message }) => {
          const from = [name, company && `(${company})`].filter(Boolean).join(' ')
          const subject = from ? `Hello from ${from}` : 'Hello'
          const body = email ? `${message}\n\nReply to: ${email}` : message
          window.location.href = `${EMAIL_HREF}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
          setSent(true)
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------- footer -- */

function Footer() {
  return (
    <FooterSection5
      wordmarkAs="p"
      brand={PERSON.name}
      logo={null}
      socials={null}
      tagline={PERSON.manifesto}
      copyright={<>© {new Date().getFullYear()} {PERSON.name}</>}
      panelColor="var(--stage-accent)"
      className="bg-background"
      // Two lines on phones so the name stays oversized; one line from md.
      wordmarkClassName="text-center text-[15.5vw] sm:text-[15.5vw] md:text-[9vw] leading-[0.82] md:leading-[0.8] md:whitespace-nowrap [-webkit-text-stroke:1px_rgba(255,255,255,0.7)] -mb-[0.12em] md:-mb-[0.12em]"
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
 * Direction C, "Stage": the page opens on a curtain, then the performer,
 * the programme (client work, own products), the career, the credentials,
 * and a way to get in touch.
 */
export function Stage() {
  return (
    <div
      className="relative min-h-svh overflow-x-clip bg-background font-sans text-foreground antialiased"
      style={
        {
          // Stage black for the page (the About block's own #060606, so the
          // sections meet without a seam), and the one accent (the violet
          // wash that block's glow already uses), as a fill and a legible ink.
          '--background': '#060606',
          '--stage-accent': '#16106d',
          '--stage-accent-ink': '#9d94ff',
        } as React.CSSProperties
      }
    >
      <TopBar />
      <Hero />
      <About />
      <Work />
      <Products />
      <Experience />
      <Credentials />
      <Contact />
      <Footer />
    </div>
  )
}
