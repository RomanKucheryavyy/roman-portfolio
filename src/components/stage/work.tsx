'use client'

import { ArrowUpRight } from 'lucide-react'
import StackingCards, { StackingCardItem } from '@/components/ui/stacking-cards'
import { Card } from '@/components/ui/card'
import { PROJECTS, linkLabel, type Project } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { cn } from '@/lib/utils'
import { stageButton } from './look'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Act I's own shape: each project an inscribed plaque. A dark tablet tinted
 * with the wash (lit from its upper corner, opaque, since the next
 * plaque slides over it), a gold hairline edge and a finer rule inside it,
 * held at its corners by four small gold rivets. Square cornered, as the
 * intro's ENTER is. The plaque is Act I's alone: the products have their
 * title cards, the certifications their own form.
 */
const PLAQUE = cn(
  'relative mx-auto h-full w-full max-w-[1184px] gap-0 overflow-hidden rounded-[3px] py-0 text-foreground',
  'border-gold/42 transition-[border-color] duration-500 hover:border-gold/70',
  'bg-[linear-gradient(155deg,color-mix(in_oklab,var(--stage-wash)_36%,var(--background))_0%,color-mix(in_oklab,var(--stage-wash)_17%,var(--background))_48%,color-mix(in_oklab,var(--stage-wash)_9%,var(--background))_100%)]',
  // A faint top bevel; below lg a soft drop, from lg the shadow the stack casts upward.
  'shadow-[inset_0_1px_0_color-mix(in_oklab,var(--stage-glow)_12%,transparent),0_24px_48px_-32px_color-mix(in_oklab,var(--stage-shadow)_95%,transparent)]',
  'lg:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--stage-glow)_12%,transparent),0_-24px_60px_-20px_color-mix(in_oklab,var(--stage-shadow)_90%,transparent)]',
)

/** A rivet at one corner of the inner rule: a small gold boss, lit from the upper left. */
const RIVET =
  'absolute size-[5px] rounded-full bg-[radial-gradient(circle_at_35%_35%,var(--stage-glow),var(--stage-gold)_55%,color-mix(in_oklab,var(--stage-gold)_45%,var(--background)))]'

/** The plaque's inner rule and its four rivets. Decoration only. */
function InnerRule() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-[7px] rounded-[1px] border border-gold/17 md:inset-2 lg:inset-4">
      <span className={`${RIVET} -left-[3px] -top-[3px]`} />
      <span className={`${RIVET} -right-[3px] -top-[3px]`} />
      <span className={`${RIVET} -bottom-[3px] -left-[3px]`} />
      <span className={`${RIVET} -bottom-[3px] -right-[3px]`} />
    </span>
  )
}

/** One handle (ansa) of the little tablet: a dovetail whose point meets the tablet's side. */
function Ansa({ side }: { side: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 10 32" className={cn('h-8 w-2.5 shrink-0 overflow-visible', side === 'right' && '-scale-x-100')}>
      <path d="M10 16 0.5 5.5v21Z" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * The project's number, cut into a tabula ansata (the Romans' handled
 * tablet for an inscription): its place in his order and the count, in
 * Roman numerals in gold Cinzel. Screen readers keep the figures as they
 * were ("01 / 09").
 */
function Index({ index }: { index: number }) {
  return (
    <p className="flex items-center self-start">
      <span className="sr-only">
        {pad(index + 1)} / {pad(PROJECTS.length)}
      </span>
      <span aria-hidden="true" className="flex items-center text-gold/60">
        <Ansa side="left" />
        <span className="flex h-8 items-center gap-2 border border-gold/60 px-3.5 font-roman font-medium leading-none">
          <span className="text-[1.0625rem] tracking-[0.06em] text-gold">{toRoman(index + 1)}</span>
          <span className="text-xs tracking-[0.14em] text-muted-foreground">/ {toRoman(PROJECTS.length)}</span>
        </span>
        <Ansa side="right" />
      </span>
    </p>
  )
}

/** The plaque's way out: the Stage's secondary button (its domain, or "App Store"), or the plain status when there is no link yet. */
function ProjectLink({ project }: { project: Project }) {
  // Narrow phones: a little less tracking, so the longest domain keeps to one line at 320px.
  const fit = 'max-[379px]:gap-2 max-[379px]:px-3 max-[379px]:tracking-[0.1em]'
  if (!project.url) {
    return (
      <span
        className={cn(
          'inline-flex h-9 items-center whitespace-nowrap rounded-[2px] border border-dashed border-rule/95 px-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground',
          fit,
        )}
      >
        {linkLabel(project)}
      </span>
    )
  }
  return (
    <a href={project.url} target="_blank" rel="noopener noreferrer" className={cn(stageButton('secondary', 'sm'), fit)}>
      {linkLabel(project)}
      <ArrowUpRight aria-hidden="true" />
    </a>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Card className={PLAQUE}>
      <InnerRule />
      <div className="grid h-full grid-rows-[auto_1fr] lg:grid-cols-2 lg:grid-rows-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The screenshot, whole (16:10), set into the plaque: centred in its
            half from lg, and cut at the foot only if a short window makes
            the plaque shorter than the picture. */}
        <div className="p-3.5 md:p-4 lg:order-2 lg:flex lg:h-full lg:items-center lg:py-7 lg:pl-0 lg:pr-7">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2px] border border-gold/30 bg-background lg:max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.image}
              alt={`${project.title}: screenshot of the ${project.isApp ? 'app' : 'site'}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-0 size-full object-cover object-top"
            />
          </div>
        </div>

        {/* The inscription: the number, the title, the words, the tags, and
            the link at its foot (from md, level across a row of plaques).
            In a short window (720px high or less) the plaque is shorter, so
            from lg the lines draw closer and the title a little smaller. */}
        <div className="flex min-h-0 flex-col px-5 pb-7 pt-1.5 max-[379px]:px-4 md:px-6 lg:order-1 lg:px-11 lg:py-10 lg:[@media(max-height:45rem)]:py-7">
          <Index index={index} />
          <h3 className="mt-5 font-roman text-[1.625rem] font-medium leading-[1.12] tracking-[0.02em] text-balance text-foreground lg:mt-6 lg:text-[clamp(1.875rem,2.6vw,2.375rem)] lg:leading-[1.08] lg:[@media(max-height:45rem)]:mt-4 lg:[@media(max-height:45rem)]:text-[clamp(1.75rem,2.3vw,2.125rem)]">
            {project.title}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty lg:mt-4 xl:text-base lg:[@media(max-height:45rem)]:mt-3 xl:[@media(max-height:45rem)]:text-[15px]">{project.description}</p>
          <ul
            className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-xs font-medium uppercase leading-5 tracking-[0.18em] text-muted-foreground lg:mt-5 lg:[@media(max-height:45rem)]:mt-4"
            aria-label="Tags"
          >
            {project.tags.map((tag, i) => (
              <li key={tag} className="flex items-center gap-2.5">
                {tag}
                {/* The inscriptions' own word divider. */}
                {i < project.tags.length - 1 ? (
                  <span aria-hidden="true" className="text-gold">
                    ·
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-6 lg:pt-7 lg:[@media(max-height:45rem)]:pt-5">
            <ProjectLink project={project} />
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Act I: the nine client projects. From lg they are scroll-pinned cards that
 * stack, each slot a card plus a breath so the next one arrives right behind
 * it. Below lg the same StackingCards renders flat (no pin, no offset, no
 * scale): a plain list of the same cards (two columns on tablets), because
 * a pinned card taller than a phone's visible height would hide its own
 * bottom.
 */
/**
 * From lg the cards stack: each one sticks, and the next slides up over it.
 * A link the keyboard lands on would sit under the card after it whenever
 * the browser scrolled it into view mid-stack, so focus brings its card to
 * the front instead: the page scrolls to where that card has just pinned and
 * the next has not yet reached it (each slot leaves a 1.5rem breath). Only
 * for keyboard focus, and only while the cards are sticky (below lg they are
 * a plain list).
 */
function bringToFront(event: React.FocusEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (!target.matches(':focus-visible')) return
  const item = target.closest<HTMLElement>('[data-stack-item]')
  const stack = event.currentTarget
  if (!item || getComputedStyle(item).position !== 'sticky') return
  // The slot's place in the page: the stack's own top plus every slot before it.
  let top = stack.getBoundingClientRect().top + window.scrollY
  for (const slot of Array.from(stack.children)) {
    if (slot === item) break
    top += (slot as HTMLElement).offsetHeight
  }
  // After the browser's own focus scroll.
  requestAnimationFrame(() => window.scrollTo({ top, behavior: 'instant' }))
}

export function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="relative scroll-mt-14 pt-20 [--stack-step:0px] [--stack-top:0px] md:pt-32 lg:[--stack-step:12px] lg:[--stack-top:6.5rem]"
      style={{ '--n': PROJECTS.length - 1 } as React.CSSProperties}
    >
      <Container>
        <SectionHeader
          id="work-title"
          act="Act I"
          kicker="Client work"
          title="Built for clients"
          intro={`${PROJECTS.length} projects for other people, from storefronts and booking flows to a native iOS app.`}
        />
      </Container>

      <StackingCards
        totalCards={PROJECTS.length}
        scaleMultiplier={0.018}
        className="relative mt-10 flex flex-col gap-4 px-4 md:mt-16 md:grid md:grid-cols-2 md:gap-6 md:px-12 lg:mt-20 lg:block"
        onFocus={bringToFront}
      >
        {PROJECTS.map((project, index) => (
          <StackingCardItem
            key={project.id}
            index={index}
            data-stack-item=""
            topPosition={`calc(var(--stack-top) + ${index} * var(--stack-step))`}
            // From lg each slot is a full-width sticky box whose top stretch,
            // above its offset card, is clear: it lies over the card before
            // it, so it lets the pointer through and only the card takes it
            // (otherwise every link but the last card's sits under the next
            // slot and cannot be clicked).
            className="max-lg:static max-lg:h-auto max-lg:[&>div]:transform-none! lg:pointer-events-none lg:h-[calc(min(29rem,100svh_-_14rem)_+_1.5rem)]"
          >
            <div className="md:h-full lg:pointer-events-auto lg:h-[min(29rem,calc(100svh-14rem))]">
              <ProjectCard project={project} index={index} />
            </div>
          </StackingCardItem>
        ))}
      </StackingCards>
      {/* From lg each card paints its stack offset below its slot, so the
          finished stack hangs past the end of the stack by up to (the last
          card's offset - the slot's 1.5rem breath). This keeps that overhang
          off Act II. */}
      <div aria-hidden="true" className="hidden lg:block lg:h-[calc(var(--stack-top)_+_var(--n)_*_var(--stack-step)_-_1.5rem)]" />
    </section>
  )
}
