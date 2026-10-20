'use client'

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react'

import PortfolioHero from '@/components/ui/portfolio-hero-bold'
import ProjectIndex from '@/components/ui/project-index'
import PigmentExperienceLedger, { type LedgerItem } from '@/components/ui/pigment-experience-ledger'
import { Marquee, MarqueeContent, MarqueeEdge, MarqueeItem } from '@/components/ui/marquee'
import TextReveal from '@/components/ui/text-reveal'
import { ShaderGradient } from '@/components/ui/shader-gradient'
import ContactForm from '@/components/ui/contact-form'
import FooterWithSuite from '@/components/ui/footer-with-suite'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  CERTIFICATIONS,
  EDUCATION,
  PERSON,
  PRODUCTS,
  PROJECTS,
  ROLES,
  SKILLS,
  linkLabel,
} from '@/lib/content'

import portrait from './roman-portrait.jpg'
import { Container, META, SECTION_Y, SectionHead } from './layout-parts'
import './direction-b.css'

/* ------------------------------------------------------------------ data */

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#products', label: 'Products' },
  { href: '#experience', label: 'Experience' },
  { href: '#credentials', label: 'Credentials' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
] as const

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' } as const

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const word = (n: number) => WORDS[n] ?? String(n)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const appCount = PROJECTS.filter((p) => p.isApp).length
const webCount = PROJECTS.length - appCount

type IndexRows = NonNullable<NonNullable<ComponentProps<typeof ProjectIndex>>['rows']>

/** Desktop rows: title · tags · where the link goes · arrow. */
const WORK_ROWS: IndexRows = PROJECTS.map((p) => ({
  title: p.title,
  tag: p.tags.join(' · '),
  year: linkLabel(p),
  grad: 'var(--muted)',
  href: p.url ?? null,
  image: p.image,
  imageAlt: `${p.title}, screenshot`,
}))

/**
 * Phone rows: at 390px a domain and three tags do not fit beside a title, so
 * a phone row carries one right-aligned word on what it is: its first tag the
 * title does not already say, or where it goes when that is not a website
 * (the App Store), or why there is no link yet.
 */
const WORK_ROWS_PHONE: IndexRows = PROJECTS.map((p, i) => ({
  ...WORK_ROWS[i]!,
  tag: '',
  year: !p.url || p.isApp ? linkLabel(p) : (p.tags.find((t) => !p.title.includes(t)) ?? p.tags[0]!),
}))

const yearsOf = (start: number, end?: number) => (end ? `${start}–${end}` : `${start}–now`)

const EXPERIENCE: LedgerItem[] = ROLES.map((r) => ({
  company: r.company,
  role: r.title,
  years: yearsOf(r.startYear, r.endYear),
  // The ledger's own fields, relabelled below: "Dates" and "Team".
  location: r.dates,
  industry: r.team,
  summary: r.note ? [`${cap(r.note)}.`] : undefined,
}))

const SCHOOLS: LedgerItem[] = EDUCATION.map((e) => ({
  company: e.short,
  role: e.degree,
  years: `${e.start}–${e.end}`,
  summary: [e.school],
}))

const companyNames = [...new Set(ROLES.map((r) => r.company))].join(' and ')

/* --------------------------------------------------------------- helpers */

/**
 * TextReveal plays once, on mount, and replays when its key changes. The quote
 * sits far below the fold, so hold it back until it scrolls into view and then
 * replay it there. If it is already on screen at load, it simply plays.
 */
function useReplayInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState<'mounted' | 'waiting' | 'shown'>('mounted')
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) return
    setState('waiting')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('shown')
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, state] as const
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

const linkInk =
  'rounded-sm underline decoration-border decoration-1 underline-offset-[5px] transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/* ------------------------------------------------------------------ page */

function TopBar() {
  return (
    <header className="absolute inset-x-0 top-0 z-40 lg:fixed lg:border-b lg:border-border/80 lg:bg-background/85 lg:backdrop-blur-md">
      <Container className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3 py-4 lg:h-16 lg:flex-nowrap lg:py-0">
        <a href="#top" className="font-serif text-[1.35rem] leading-none tracking-[-0.01em]">
          {PERSON.name}
        </a>
        <nav aria-label="Sections" className="order-last w-full lg:order-none lg:ml-auto lg:w-auto">
          <ul className={cn(META, '-my-2 flex flex-wrap gap-x-4 text-muted-foreground lg:my-0 lg:gap-x-7')}>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="inline-block py-2 transition-colors hover:text-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={`mailto:${PERSON.links.email}`} className={cn(META, 'transition-colors hover:text-muted-foreground')}>
          Email
        </a>
      </Container>
    </header>
  )
}

function Hero() {
  return (
    <div id="top">
      <PortfolioHero
        firstName={PERSON.first}
        lastName={PERSON.last}
        tagline={PERSON.tagline}
        imageSrc={portrait.src}
        imageAlt={`${PERSON.name}, in a black tuxedo and bow tie`}
        defaultDark={false}
        showHeader={false}
        onScrollDown={() => scrollToId('work')}
        nameStyle={{
          color: 'var(--foreground)',
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontWeight: 400,
          fontSize: 'clamp(3.6rem, 21vw, 11.25rem)',
          lineHeight: 0.8,
          letterSpacing: '-0.035em',
          textTransform: 'none',
        }}
        taglineStyle={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(1.3rem, 1.75vw, 1.6rem)',
          lineHeight: 1.25,
          justifyContent: 'center',
          maxWidth: '52rem',
        }}
      >
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="#work">See the work</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
      </PortfolioHero>
    </div>
  )
}

function Work() {
  return (
    <section id="work" aria-labelledby="work-h" className="scroll-mt-16 border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead
          id="work-h"
          meta={`${String(PROJECTS.length).padStart(2, '0')} projects`}
          title="Client work"
          intro={`Built for clients: ${word(webCount)} for the web, ${word(appCount)} for iPhone.`}
        />
        <div className="min-w-0">
          <div className="hidden md:block">
            <ProjectIndex rows={WORK_ROWS} />
          </div>
          {/* Phones: the same index; a tap goes straight to the site. The
              cover can float past the row on touch, so clip it sideways. */}
          <div className="overflow-x-clip md:hidden">
            <ProjectIndex rows={WORK_ROWS_PHONE} />
          </div>
        </div>
      </Container>
    </section>
  )
}

function Products() {
  return (
    <section id="products" aria-labelledby="products-h" className="scroll-mt-16 border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead
          id="products-h"
          meta={`${String(PRODUCTS.length).padStart(2, '0')} products`}
          title="My own products"
          intro="Not client work: products I design, build and run myself."
        />
        <ol className="w-full max-w-[560px]">
          {PRODUCTS.map((p) => (
            <li key={p.id} className="border-t py-6 last:border-b">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[19px] font-semibold leading-tight">{p.title}</h3>
                <span className="shrink-0 text-right text-[11px] text-muted-foreground">{p.status}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/80">{p.description}</p>
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <p className={cn(META, 'leading-normal text-muted-foreground')}>{p.stack.join(' / ')}</p>
                {p.url ? (
                  <a href={p.url} {...EXTERNAL} className={cn('text-[13px] font-medium', linkInk)}>
                    {p.url.replace(/^https?:\/\//, '')} <span aria-hidden>↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

const LEDGER_SHARED = {
  // The pigment in the manifesto band's colours (peach, butter, lilac), kept light.
  colors: ['#F7A48B', '#F9D78E', '#BBA9EE'] as [string, string, string],
  strength: 0.5,
  residue: 0.1,
  uppercase: false,
  cta: null,
  footnote: '',
  minHeight: 'auto',
  background: 'var(--background)',
  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
  // Instrument Serif has one weight; never let the browser fake a bold.
  style: { fontSynthesisWeight: 'none' } as CSSProperties,
}

/** The same small kicker every other section header carries, set above a ledger's own heading. */
function LedgerKicker({ children }: { children: string }) {
  return (
    <Container>
      <p className={cn(META, 'mb-5 text-muted-foreground')}>{children}</p>
    </Container>
  )
}

function Experience() {
  // The ledger pads itself; it starts flush under the kicker and ends on this page's section rhythm.
  const pad = { paddingTop: 0, paddingBottom: 'clamp(4rem, 8vw, 7.5rem)' }
  return (
    <div id="experience" className="scroll-mt-16 border-t pt-[clamp(4rem,8vw,7.5rem)]">
      <LedgerKicker>{`${String(ROLES.length).padStart(2, '0')} roles`}</LedgerKicker>
      <PigmentExperienceLedger
        {...LEDGER_SHARED}
        style={{ ...LEDGER_SHARED.style, ...pad }}
        heading="Experience"
        intro={`At ${companyNames}, newest first. Open a role for its dates and team.`}
        items={EXPERIENCE}
        defaultOpen={0}
        labels={{ position: 'Position', location: 'Dates', industry: 'Team' }}
      />
      <LedgerKicker>{`${String(EDUCATION.length).padStart(2, '0')} degrees`}</LedgerKicker>
      <PigmentExperienceLedger
        {...LEDGER_SHARED}
        style={{ ...LEDGER_SHARED.style, ...pad }}
        heading="Education"
        intro="Computer science, newest first."
        items={SCHOOLS}
        defaultOpen={null}
        labels={{ position: 'Degree' }}
      />
    </div>
  )
}

function Credentials() {
  return (
    <section id="credentials" aria-labelledby="credentials-h" className="scroll-mt-16 border-t">
      <Container className={cn(SECTION_Y, 'pb-10 md:pb-14')}>
        <SectionHead
          id="credentials-h"
          meta={`${String(CERTIFICATIONS.length).padStart(2, '0')} certifications`}
          title="Credentials"
          intro="Salesforce certifications, newest first, and the languages and platforms I work in."
        />
      </Container>

      {/* Moving strips, paused on hover and with Space; a still list for reduced motion. */}
      <div className="motion-reduce:hidden">
        <div className="border-y py-7 md:py-9">
          <Marquee
            pauseOnHover
            pauseOnKeyboard
            speed={34}
            gap="3.5rem"
            aria-label="Salesforce certifications, newest first. Press Space to pause."
            className="rounded-none"
          >
            <MarqueeContent>
              {CERTIFICATIONS.map((c) => (
                <MarqueeItem key={c.id} className="flex items-baseline gap-3">
                  <span className="font-serif text-[clamp(2rem,3.4vw,3rem)] leading-none tracking-[-0.01em]">{c.name}</span>
                  <span className={cn(META, 'text-muted-foreground')}>{c.date}</span>
                </MarqueeItem>
              ))}
            </MarqueeContent>
            <MarqueeEdge side="left" size="sm" />
            <MarqueeEdge side="right" size="sm" />
          </Marquee>
        </div>
        <div className="py-5">
          <Marquee
            pauseOnHover
            pauseOnKeyboard
            speed={22}
            gap="2.5rem"
            aria-label="Skills. Press Space to pause."
            className="rounded-none"
          >
            <MarqueeContent>
              {SKILLS.map((s) => (
                <MarqueeItem key={s} className={cn(META, 'text-[12px] text-muted-foreground')}>
                  {s}
                </MarqueeItem>
              ))}
            </MarqueeContent>
            <MarqueeEdge side="left" size="sm" />
            <MarqueeEdge side="right" size="sm" />
          </Marquee>
        </div>
      </div>
      <Container className="hidden pb-[clamp(4rem,8vw,7.5rem)] motion-reduce:block">
        <ul className="grid gap-x-10 border-t sm:grid-cols-2">
          {CERTIFICATIONS.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-4 border-b py-4">
              <span className="font-serif text-2xl">{c.name}</span>
              <span className={cn(META, 'text-muted-foreground')}>{c.date}</span>
            </li>
          ))}
        </ul>
        <p className={cn(META, 'mt-6 leading-loose text-muted-foreground')}>{SKILLS.join(' · ')}</p>
      </Container>
    </section>
  )
}

function About() {
  const [quoteRef, quoteState] = useReplayInView<HTMLDivElement>()
  return (
    <section id="about" aria-labelledby="about-h" className="scroll-mt-16 border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead id="about-h" meta="In my own words" title="About" />
        <div className="max-w-[560px]">
          {PERSON.about.map((para, i) => (
            <p
              key={i}
              className={cn(
                i === 0
                  ? 'font-serif text-[clamp(1.6rem,2.3vw,2rem)] leading-[1.22] tracking-[-0.01em]'
                  : 'mt-6 text-[17px] leading-relaxed text-foreground/80',
              )}
            >
              {para}
            </p>
          ))}
          <dl className="mt-10 grid grid-cols-[6rem_minmax(0,1fr)] gap-x-6 border-t pt-5 text-[15px]">
            <dt className={cn(META, 'pt-1 text-muted-foreground')}>Music</dt>
            <dd>{PERSON.music}</dd>
          </dl>
        </div>
      </Container>

      {/* The manifesto: a contained band, not the whole page. */}
      <Container className="pb-[clamp(4rem,8vw,7.5rem)]">
        <figure className="relative isolate overflow-hidden rounded-xl">
          <ShaderGradient intensity={0.62} blur={0.85} speed={0.08} grain={0.12} interactive={false} />
          <div ref={quoteRef} className="relative px-6 py-16 sm:px-12 md:px-[8%] md:py-28">
            <p className={cn(META, 'mb-8 text-foreground/70')}>Manifesto</p>
            <blockquote style={{ opacity: quoteState === 'waiting' ? 0 : 1 }}>
              <TextReveal
                key={quoteState}
                as="p"
                text={PERSON.manifesto}
                className="font-serif text-[clamp(2.1rem,4.6vw,4.25rem)] leading-[1.02] tracking-[-0.02em]"
              />
            </blockquote>
            <figcaption className={cn(META, 'mt-10 text-foreground/70')}>— {PERSON.name}</figcaption>
          </div>
        </figure>
      </Container>
    </section>
  )
}

const CONTACT_LINKS = [
  { label: 'Email', href: `mailto:${PERSON.links.email}`, text: PERSON.links.email, external: false },
  { label: 'LinkedIn', href: PERSON.links.linkedin, text: 'linkedin.com/in/romakuch', external: true },
  { label: 'GitHub', href: PERSON.links.github, text: 'github.com/RomanKucheryavyy', external: true },
]

function Contact() {
  return (
    <div className="border-t">
      <ContactForm
        id="contact"
        aria-label="Get in touch"
        className={cn(
          'scroll-mt-16 px-[clamp(1.25rem,5vw,5rem)]',
          SECTION_Y,
          // Hooks the component exposes as data-slots: put its column on this
          // page's grid and its title in this page's heading type.
          '[&_[data-slot=contact-form-container]]:max-w-[84rem] [&_[data-slot=contact-form-container]]:px-0',
          `[&_[data-slot=contact-form-title]]:font-serif [&_[data-slot=contact-form-title]]:text-[clamp(2.4rem,4.6vw,4rem)] [&_[data-slot=contact-form-title]]:font-normal [&_[data-slot=contact-form-title]]:leading-[0.95] [&_[data-slot=contact-form-title]]:tracking-[-0.02em]`,
          '[&_[data-slot=contact-form-eyebrow]]:font-mono [&_[data-slot=contact-form-eyebrow]]:text-[11px] [&_[data-slot=contact-form-eyebrow]]:uppercase [&_[data-slot=contact-form-eyebrow]]:tracking-[0.14em] [&_[data-slot=contact-form-eyebrow]]:mb-5',
          '[&_[data-slot=contact-form-description]]:text-base [&_[data-slot=contact-form-description]]:max-w-[40ch]',
          '[&_[data-slot=contact-form-card]]:shadow-none',
        )}
        eyebrow="Contact"
        title="Get in touch"
        description="Write to me directly, or leave a note here."
        details={
          <dl className="grid max-w-md grid-cols-[6rem_minmax(0,1fr)] border-t text-[15px]">
            {CONTACT_LINKS.map((l) => (
              <div key={l.label} className="col-span-2 grid grid-cols-subgrid items-baseline border-b py-4">
                <dt className={cn(META, 'text-muted-foreground')}>{l.label}</dt>
                <dd className="min-w-0 break-words">
                  <a href={l.href} {...(l.external ? EXTERNAL : {})} className={linkInk}>
                    {l.text}
                    {l.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        }
        labels={{
          success: `Thanks. This preview does not send messages yet, so please email me at ${PERSON.links.email}.`,
          error: 'That did not go through. Please email me instead.',
        }}
        onSubmit={async () => {
          // The lab has no backend: nothing is posted, the form only shows its states.
          await new Promise((resolve) => setTimeout(resolve, 700))
        }}
      />
    </div>
  )
}

function Footer() {
  return (
    <FooterWithSuite
      className={cn(
        'select-auto border-t bg-background',
        '[&>div]:px-[clamp(1.25rem,5vw,5rem)] lg:[&>div:first-child]:gap-12',
        '[&>p]:font-serif [&>p]:font-normal [&>p]:leading-[0.9] [&>p]:tracking-[-0.03em] [&>p]:pt-10 [&>p]:pb-6',
      )}
      brandName={PERSON.last}
      description={PERSON.tagline}
      prompt="Have something in mind? Write to me."
      ctaText="Get in touch"
      ctaUrl="#contact"
      email={PERSON.links.email}
      copyright={`© ${new Date().getFullYear()} ${PERSON.name}`}
      tagline={PERSON.url.replace(/^https?:\/\//, '')}
      navLinks={NAV.map((n) => ({ text: n.label, url: n.href }))}
      socialLinks={[
        { text: 'LinkedIn', url: PERSON.links.linkedin },
        { text: 'GitHub', url: PERSON.links.github },
        { text: 'Email', url: `mailto:${PERSON.links.email}` },
      ]}
    />
  )
}

export default function DirectionB() {
  return (
    <div
      className="dirb-root min-h-svh bg-background text-foreground"
      // The hero paints its own light paper (hsl 0 0% 98%); the whole page
      // takes the same paper so there is no seam under it.
      style={{ '--background': 'hsl(0 0% 98%)' } as CSSProperties}
    >
      <TopBar />
      <main>
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

