'use client'

import { useEffect, useRef } from 'react'
import StackingCards, { StackingCardItem } from '@/components/ui/stacking-cards'
import { Card } from '@/components/ui/card'
import { PROJECTS, linkLabel, type Project } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { stageLink } from './look'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Act I's own shape: each project a folio, a leaf of the book with its
 * plate. The site's screenshot is the plate, full-bleed at the leaf's head
 * (beside the words from lg), and the words are set on the page itself: no
 * border, no rule, no frame. The leaf is an opaque sheet of the ground, the
 * wash falling on it from above, so a folio sliding over another hides it;
 * its top edge catches the light, and it casts its shadow upward onto the
 * folio it covers, so the stacked edges read by tone alone.
 */
const FOLIO = [
  'relative mx-auto h-full w-full max-w-[1184px] gap-0 overflow-hidden rounded-[3px] border-0 py-0 text-foreground',
  'bg-[linear-gradient(172deg,color-mix(in_oklab,var(--stage-wash)_55%,var(--background)),color-mix(in_oklab,var(--stage-wash)_32%,var(--background))_45%,color-mix(in_oklab,var(--stage-wash)_12%,var(--background)))]',
  'shadow-[0_-4px_10px_-2px_color-mix(in_oklab,var(--stage-shadow)_90%,transparent),0_-18px_44px_-14px_color-mix(in_oklab,var(--stage-shadow)_95%,transparent)]',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_18%,transparent)]',
].join(' ')

/**
 * The project's number as type: its place in his order in gold Cinzel, the
 * count after it in the muted ink, in Roman numerals ("II / IX"). Screen
 * readers keep the figures ("02 / 09").
 */
function Numeral({ index }: { index: number }) {
  return (
    <p className="font-roman font-medium leading-none tracking-[0.06em]">
      <span className="sr-only">
        {pad(index + 1)} / {pad(PROJECTS.length)}
      </span>
      <span aria-hidden="true" className="text-xl text-gold lg:text-[1.75rem]">
        {toRoman(index + 1)}
      </span>
      <span aria-hidden="true" className="ml-2 text-xs tracking-[0.14em] text-muted-foreground lg:ml-2.5 lg:text-[13px]">
        / {toRoman(PROJECTS.length)}
      </span>
    </p>
  )
}

/** The folio's way out: its domain (or "App Store") as the Stage's text link, or, with no link yet, its status as a quiet line. */
function ProjectLink({ project }: { project: Project }) {
  if (!project.url) return <p className="py-2.5 font-serif text-lg italic leading-6 text-muted-foreground">{linkLabel(project)}</p>
  return (
    <a href={project.url} target="_blank" rel="noopener noreferrer" className={stageLink('away')}>
      {linkLabel(project)}
    </a>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Card className={FOLIO}>
      <div className="grid h-full grid-rows-[auto_1fr] stack-phone:flex stack-phone:flex-col lg:grid-cols-2 lg:grid-rows-1 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The plate: the screenshot, edge to edge, at 16:10. On a stacking
            phone it gives way first when the leaf is short, cut from its
            foot (never under 7rem); from lg it fills its half, top to foot. */}
        <div className="relative aspect-[16/10] overflow-hidden bg-background stack-phone:aspect-auto stack-phone:max-h-[calc((100vw_-_2rem)_*_0.625)] stack-phone:min-h-28 stack-phone:grow-[100] stack-phone:basis-0 lg:order-2 lg:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={`${project.title}: screenshot of the ${project.isApp ? 'app' : 'site'}`}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 size-full object-cover object-left-top xl:object-[20%_top]"
          />
        </div>

        {/* The words: the number, the title, the description whole, the
            tags, and the link at the foot (from md, level across a row of
            folios). On a stacking phone the lines draw closer; in a short
            window (720px high or less) from lg too. */}
        <div className="flex min-h-0 flex-col px-5 pb-5 pt-5 max-[379px]:px-4 stack-phone:grow stack-phone:pt-4 md:px-6 lg:order-1 lg:px-11 lg:py-10 lg:[@media(max-height:45rem)]:py-7">
          <Numeral index={index} />
          <h3 className="mt-3 font-roman text-[1.625rem] font-medium leading-[1.12] tracking-[0.02em] text-balance text-foreground stack-phone:mt-2 stack-phone:text-[1.375rem] lg:mt-5 lg:text-[clamp(1.875rem,2.6vw,2.375rem)] lg:leading-[1.08] lg:[@media(max-height:45rem)]:mt-4 lg:[@media(max-height:45rem)]:text-[clamp(1.75rem,2.3vw,2.125rem)]">
            {project.title}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty stack-phone:mt-2 stack-phone:leading-normal lg:mt-4 xl:text-base lg:[@media(max-height:45rem)]:mt-3 xl:[@media(max-height:45rem)]:text-[15px]">
            {project.description}
          </p>
          <ul
            className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-xs font-medium uppercase leading-5 tracking-[0.18em] text-muted-foreground stack-phone:mt-3 stack-phone:tracking-[0.14em] lg:mt-5 lg:[@media(max-height:45rem)]:mt-4"
            aria-label="Tags"
          >
            {project.tags.map((tag, i) => (
              <li key={tag} className="flex items-center gap-2.5">
                {tag}
                {/* The inscriptions' own word divider, the page's only one. */}
                {i < project.tags.length - 1 ? (
                  <span aria-hidden="true" className="text-gold">
                    ·
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-3 stack-phone:pt-1 lg:pt-5 lg:[@media(max-height:45rem)]:pt-3">
            <ProjectLink project={project} />
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Where the folios stack (from lg, and on a phone held upright that is tall
 * enough: the `stack` variant, globals.css), each one sticks, and the next
 * slides up over it. A link the keyboard lands on would sit under the folio
 * after it whenever the browser scrolled it into view mid-stack, so focus
 * brings its folio to the front instead: the page scrolls to where that
 * folio has just pinned and the next has not yet reached it (each slot
 * leaves a breath). Only for keyboard focus, and only while the folios are
 * sticky (elsewhere they are a plain list).
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

/**
 * Where the folios lie flat (tablets, a phone on its side or too short to
 * stack one), each rises into place as it comes into view, once: only a
 * folio that starts below the screen, never under reduced motion, and
 * passed unseen (a jump to a later act) it is simply let go. The server's
 * HTML is the finished list, so without scripts it stands whole; opacity
 * and transform only, so nothing moves around it.
 */
function useRiseIntoView(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-stack-item]') ?? [])
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches || !items[0] || getComputedStyle(items[0]).position === 'sticky') return
    const held = new Map<Element, Animation>()
    for (const item of items) {
      if (item.getBoundingClientRect().top < innerHeight) continue
      // The folio's own box: the item's first child carries the stack's transform.
      const leaf = item.firstElementChild?.firstElementChild as HTMLElement
      const a = leaf.animate([{ opacity: 0, transform: 'translateY(1.5rem)' }, { opacity: 1, transform: 'none' }], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
        fill: 'both',
      })
      a.pause()
      a.finished.then(() => a.cancel(), () => {})
      held.set(item, a)
    }
    const io = new IntersectionObserver(
      (entries) => {
        let k = 0
        for (const entry of entries) {
          const a = held.get(entry.target)
          if (!a || !entry.isIntersecting) continue
          io.unobserve(entry.target)
          held.delete(entry.target)
          if (entry.boundingClientRect.bottom <= 0) a.cancel()
          else {
            // Folios arriving together (a row of two) follow one another.
            a.effect?.updateTiming({ delay: k++ * 90 })
            a.play()
          }
        }
      },
      { rootMargin: '100000px 0px -10% 0px' },
    )
    for (const item of held.keys()) io.observe(item)
    // Turned to stack (a phone stood upright), or asked for less motion: let every folio go.
    const width = innerWidth
    const release = () => {
      if (innerWidth === width && !reduce.matches) return
      io.disconnect()
      for (const a of held.values()) a.cancel()
    }
    addEventListener('resize', release)
    reduce.addEventListener('change', release)
    return () => {
      removeEventListener('resize', release)
      reduce.removeEventListener('change', release)
      io.disconnect()
      for (const a of held.values()) a.cancel()
    }
  }, [ref])
}

/**
 * Act I: the nine client projects, as stacking folios. From lg each slot is
 * a card plus a breath, so the next folio arrives right behind the one
 * before, offset 12px further down. On a phone held upright that is tall
 * enough (stack-phone), the same stack, composed for the phone: a shorter
 * folio sized to the screen (at most 33rem, and whatever the screen leaves
 * under the top bar), 6px steps, and only the first three edges kept, so the
 * pile shows four leaves at most. Everywhere else (tablets, a phone on its
 * side or too short, and a phone asking for less motion) StackingCards
 * renders flat (no pin, no offset, no scale): a plain list of the same
 * folios, two columns on tablets. Under reduced motion the wide stack still
 * pins (that is the scroll itself) but no longer scales.
 */
export function Work() {
  const section = useRef<HTMLElement>(null)
  useRiseIntoView(section)
  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-title"
      className="relative scroll-mt-14 pt-20 [--card-h:min(33rem,calc(100svh_-_var(--stack-top)_-_var(--stack-cap)_*_var(--stack-step)_-_0.5rem))] [--stack-breath:1rem] [--stack-cap:3] [--stack-step:6px] [--stack-top:4rem] md:pt-32 lg:[--card-h:min(29rem,calc(100svh_-_14rem))] lg:[--stack-breath:1.5rem] lg:[--stack-cap:var(--n)] lg:[--stack-step:12px] lg:[--stack-top:6.5rem] flat:[--stack-step:0px] flat:[--stack-top:0px]"
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
        className="relative mt-10 flex flex-col gap-4 px-4 stack:block md:mt-16 md:grid md:grid-cols-2 md:gap-6 md:px-12 lg:mt-20 lg:block"
        onFocus={bringToFront}
      >
        {PROJECTS.map((project, index) => (
          <StackingCardItem
            key={project.id}
            index={index}
            data-stack-item=""
            topPosition={`calc(var(--stack-top) + min(${index}, var(--stack-cap)) * var(--stack-step))`}
            // Where they stack, each slot is a full-width sticky box whose top
            // stretch, above its offset folio, is clear: it lies over the
            // folio before it, so it lets the pointer through and only the
            // folio takes it (otherwise every link but the last folio's sits
            // under the next slot and cannot be clicked).
            className="flat:static flat:h-auto flat:[&>div]:transform-none! motion-reduce:[&>div]:transform-none! stack:pointer-events-none stack:h-[calc(var(--card-h)_+_var(--stack-breath))]"
          >
            <div className="md:h-full stack:pointer-events-auto stack:h-(--card-h)">
              <ProjectCard project={project} index={index} />
            </div>
          </StackingCardItem>
        ))}
      </StackingCards>
      {/* Where they stack, each folio paints its offset below its slot, so
          the finished stack hangs past the end of the stack by up to (the
          last folio's offset - the slot's breath). This keeps that overhang
          off Act II. */}
      <div aria-hidden="true" className="hidden stack:block stack:h-[calc(var(--stack-top)_+_var(--stack-cap)_*_var(--stack-step)_-_var(--stack-breath))]" />
    </section>
  )
}
