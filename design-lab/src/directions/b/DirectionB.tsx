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

/** Desktop rows: title · two tags · where the link goes · arrow. Two tags fit every row at every width. */
const WORK_ROWS: IndexRows = PROJECTS.map((p) => ({
  title: p.title,
  tag: p.tags.slice(0, 2).join(' · '),
  year: linkLabel(p),
  grad: 'var(--muted)',
  href: p.url ?? null,
  image: p.image,
  imageAlt: `${p.title}, screenshot`,
}))

/**
 * Phone rows: no room for tags beside a title at 390px, so a phone row says
 * only where a tap goes: the site's domain, the App Store, or "Launching soon".
 */
const WORK_ROWS_PHONE: IndexRows = PROJECTS.map((p, i) => ({
  ...WORK_ROWS[i]!,
  tag: '',
  year: linkLabel(p),
}))

/** The desktop cover floats in the empty column left of the list: its width (direction-b.css) plus a 24px gap. */
const COVER_X = -(280 + 24)

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
  // The ledger's own field, relabelled below: "School".
  location: e.school,
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
  'rounded-sm underline decoration-border decoration-1 underline-offset-[5px] transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

/* ------------------------------------------------------------------ page */

/** Focus ring for the shadcn Buttons and the marquee: near-black, like the ledger's (the published ring-ring/50 is about 1.6:1 here). */
const RING = 'focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * One sticky bar at every size. Phones: the name and Email on one row, the six
 * section links on a second row that scrolls sideways. Its height is
 * --dirb-bar (direction-b.css), which the hero subtracts from the screen.
 */
function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <Container className="flex flex-wrap items-center justify-between gap-x-10 lg:h-16 lg:flex-nowrap">
        <a href="#top" className="flex h-12 items-center font-serif text-[1.35rem] leading-none tracking-[-0.01em] lg:h-auto">
          {PERSON.name}
        </a>
        <nav aria-label="Sections" className="dirb-navrow order-last -mx-[clamp(1.25rem,5vw,5rem)] w-[calc(100%+2*clamp(1.25rem,5vw,5rem))] overflow-x-auto lg:order-none lg:mx-0 lg:ml-auto lg:w-auto lg:overflow-visible">
          <ul className={cn(META, 'flex h-10 w-max items-center gap-x-6 px-[clamp(1.25rem,5vw,5rem)] text-muted-foreground lg:h-auto lg:gap-x-7 lg:px-0')}>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="inline-block py-3 transition-colors hover:text-foreground">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href={`mailto:${PERSON.links.email}`} className={cn(META, 'inline-block py-3 transition-colors hover:text-muted-foreground')}>
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
        heroElement="div"
        onScrollDown={() => scrollToId('work')}
        nameStyle={{
          color: 'var(--foreground)',
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontWeight: 400,
          // As wide as the screen allows, and short enough that the portrait,
          // name, tagline and actions fit one screen (see direction-b.css).
          fontSize: 'clamp(3.6rem, min(21vw, calc((100svh - 33rem) / 1.6)), 11.25rem)',
          lineHeight: 0.8,
          letterSpacing: '-0.035em',
          textTransform: 'none',
        }}
        taglineStyle={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(1.2rem, 0.9rem + 1.2vw, 1.6rem)',
          lineHeight: 1.25,
          justifyContent: 'center',
          maxWidth: '52rem',
        }}
      >
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className={cn('px-5', RING)}>
            <a href="#work">See the work</a>
          </Button>
          <Button asChild size="lg" variant="outline" className={cn('px-5', RING)}>
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
      </PortfolioHero>
    </div>
  )
}

function Work() {
  return (
    <section id="work" aria-labelledby="work-h" className="border-t">
      {/* Side by side only from xl: below it the index needs the full width,
          and the cover has no empty column to float in (direction-b.css hides it). */}
      <Container className={cn(SECTION_Y, 'grid gap-12 xl:grid-cols-2')}>
        <SectionHead
          id="work-h"
          meta={`${String(PROJECTS.length).padStart(2, '0')} projects`}
          title="Client work"
          intro={`Built for clients: ${word(webCount)} for the web, ${word(appCount)} for iPhone.`}
          sticky={false}
          introClassName="xl:max-w-[17rem]"
        />
        <div className="dirb-index min-w-0 [&_a:focus-visible]:ring-foreground">
          <div className="hidden md:block">
            <ProjectIndex rows={WORK_ROWS} coverX={COVER_X} />
          </div>
          {/* Phones: the same index, each row on two lines (direction-b.css):
              the title and its arrow, then where a tap goes. */}
          <div className="dirb-index-phone md:hidden">
            <ProjectIndex rows={WORK_ROWS_PHONE} />
          </div>
        </div>
      </Container>
    </section>
  )
}

function Products() {
  return (
    <section id="products" aria-labelledby="products-h" className="border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead
          id="products-h"
          meta={`${String(PRODUCTS.length).padStart(2, '0')} products`}
          title="My own products"
          intro="Not client work: products I design, build and run myself."
        />
        <ol className="w-full">
          {PRODUCTS.map((p) => (
            <li key={p.id} className="border-t py-6 last:border-b">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[19px] font-semibold leading-tight">{p.title}</h3>
                <span className={cn(META, 'shrink-0 text-right text-muted-foreground')}>{p.status}</span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-foreground/80">{p.description}</p>
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
  // Pigment only where it means something: the open row and the one pointed at.
  residue: 0,
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
    <div id="experience" className="border-t pt-[clamp(4rem,8vw,7.5rem)]">
      <LedgerKicker>{`${String(ROLES.length).padStart(2, '0')} roles`}</LedgerKicker>
      <PigmentExperienceLedger
        {...LEDGER_SHARED}
        style={{ ...LEDGER_SHARED.style, ...pad }}
        heading="Experience"
        intro={`At ${companyNames}, newest first. Open a role for its dates and team.`}
        items={EXPERIENCE}
        defaultOpen={0}
        // "Position" repeats the role printed under the name, so direction-b.css hides it.
        labels={{ position: 'Position', location: 'Dates', industry: 'Team' }}
      />
      <LedgerKicker>{`${String(EDUCATION.length).padStart(2, '0')} degrees`}</LedgerKicker>
      <PigmentExperienceLedger
        {...LEDGER_SHARED}
        style={{ ...LEDGER_SHARED.style, ...pad }}
        heading="Education"
        intro="Computer science, newest first. Open one for the school's full name."
        items={SCHOOLS}
        defaultOpen={null}
        labels={{ position: 'Degree', location: 'School' }}
      />
    </div>
  )
}

function Credentials() {
  return (
    <section id="credentials" aria-labelledby="credentials-h" className="border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead
          id="credentials-h"
          meta={`${String(CERTIFICATIONS.length).padStart(2, '0')} certifications`}
          title="Credentials"
          intro="Salesforce certifications, newest first, and the languages and platforms I work in."
        />
        <ol className="border-t">
          {CERTIFICATIONS.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-6 border-b py-4">
              <span className="font-serif text-[clamp(1.5rem,2.2vw,1.875rem)] leading-tight tracking-[-0.01em]">{c.name}</span>
              <span className={cn(META, 'shrink-0 text-muted-foreground')}>{c.date}</span>
            </li>
          ))}
        </ol>
      </Container>

      {/* Skills: one slow strip, paused on hover and with Space; a still line for reduced motion. */}
      <div className="border-t py-6 motion-reduce:hidden">
        <Marquee
          pauseOnHover
          pauseOnKeyboard
          speed={22}
          gap="2.5rem"
          aria-label="Skills. Press Space to pause."
          className={cn('rounded-none', RING, 'focus-visible:ring-inset focus-visible:ring-offset-0')}
        >
          <MarqueeContent>
            {SKILLS.map((s) => (
              <MarqueeItem key={s} className={cn(META, 'py-1 text-muted-foreground')}>
                {s}
              </MarqueeItem>
            ))}
          </MarqueeContent>
          <MarqueeEdge side="left" size="sm" />
          <MarqueeEdge side="right" size="sm" />
        </Marquee>
      </div>
      <div className="hidden border-t motion-reduce:block">
        <Container className="py-6">
          <p className={cn(META, 'leading-loose text-muted-foreground')}>{SKILLS.join(' · ')}</p>
        </Container>
      </div>
    </section>
  )
}

function About() {
  const [quoteRef, quoteState] = useReplayInView<HTMLDivElement>()
  return (
    <section id="about" aria-labelledby="about-h" className="border-t">
      <Container className={cn(SECTION_Y, 'grid gap-12 lg:grid-cols-2')}>
        <SectionHead id="about-h" meta="In my own words" title="About" />
        <div>
          {PERSON.about.map((para, i) => (
            <p
              key={i}
              className={cn(
                i === 0
                  ? 'font-serif text-[clamp(1.6rem,2.3vw,2rem)] leading-[1.22] tracking-[-0.01em]'
                  : 'mt-6 max-w-[62ch] text-[17px] leading-relaxed text-foreground/80',
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
          'px-[clamp(1.25rem,5vw,5rem)]',
          SECTION_Y,
          // Hooks the component exposes as data-slots: put its column on this
          // page's grid and its title in this page's heading type.
          '[&_[data-slot=contact-form-container]]:max-w-[84rem] [&_[data-slot=contact-form-container]]:px-0',
          `[&_[data-slot=contact-form-title]]:font-serif [&_[data-slot=contact-form-title]]:text-[clamp(2.4rem,4.6vw,4rem)] [&_[data-slot=contact-form-title]]:font-normal [&_[data-slot=contact-form-title]]:leading-[0.95] [&_[data-slot=contact-form-title]]:tracking-[-0.02em]`,
          '[&_[data-slot=contact-form-eyebrow]]:font-mono [&_[data-slot=contact-form-eyebrow]]:text-[11px] [&_[data-slot=contact-form-eyebrow]]:uppercase [&_[data-slot=contact-form-eyebrow]]:tracking-[0.14em] [&_[data-slot=contact-form-eyebrow]]:mb-5',
          '[&_[data-slot=contact-form-description]]:text-base [&_[data-slot=contact-form-description]]:max-w-[40ch]',
          '[&_[data-slot=contact-form-card]]:shadow-none',
          // Focus as dark as the rest of the page (the published ring-ring/50 is about 1.6:1 here).
          '[&_input:focus-visible]:border-foreground/60 [&_input:focus-visible]:ring-foreground/25 [&_textarea:focus-visible]:border-foreground/60 [&_textarea:focus-visible]:ring-foreground/25',
          '[&_[data-slot=contact-form-submit]:focus-visible]:ring-2 [&_[data-slot=contact-form-submit]:focus-visible]:ring-foreground [&_[data-slot=contact-form-submit]:focus-visible]:ring-offset-2',
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
          success: `Your mail app should open with this message, addressed to ${PERSON.links.email}.`,
          error: 'That did not go through. Please email me instead.',
        }}
        onSubmit={(values) => {
          // The lab has no backend and posts nothing: the message goes to the
          // visitor's own mail app, so the form clearing itself loses nothing.
          const subject = values.name ? `Hello from ${values.name}` : 'Hello'
          const body = values.email ? `${values.message}\n\n${values.name} (${values.email})` : values.message
          window.location.href = `mailto:${PERSON.links.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
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
        // On this page's column: the gutter, and no wider than 84rem on big screens.
        '[&>div]:px-[max(clamp(1.25rem,5vw,5rem),calc((100%-84rem)/2))] lg:[&>div:first-child]:gap-12',
        // One column on phones, two from sm.
        '[&>div:first-child]:grid-cols-1 sm:[&>div:first-child]:grid-cols-2',
        // The page's small-label type (Geist Mono), its muted ink (about 4.6:1), and taller tap targets.
        '[&>div_a]:font-mono [&>div_p]:font-mono [&_.text-neutral-400]:text-muted-foreground [&_a:hover]:text-muted-foreground [&>div_a]:py-1.5',
        // No empty first line where the description would be.
        '[&_p:empty]:hidden [&_p:empty+div]:hidden',
        // The email in lower case, never broken mid-word.
        '[&_.break-all]:normal-case [&_.break-all]:tracking-[0.06em] [&_.break-all]:break-normal',
        '[&>p]:font-serif [&>p]:font-normal [&>p]:leading-[0.9] [&>p]:tracking-[-0.03em] [&>p]:pt-10 [&>p]:pb-6',
      )}
      brandName={PERSON.last}
      // The hero already says the tagline; the footer does not repeat it.
      description=""
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

