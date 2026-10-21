'use client'

import { ArrowUpRight } from 'lucide-react'
import StackingCards, { StackingCardItem } from '@/components/ui/stacking-cards'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PROJECTS, linkLabel, type Project } from '@/lib/content'
import { Container, SectionHeader } from './section-header'

const pad = (n: number) => String(n).padStart(2, '0')

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Card className="mx-auto h-full w-full max-w-[1184px] gap-0 overflow-hidden rounded-3xl border-white/10 bg-[#0b0b0b] py-0 shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.9)]">
      <div className="grid h-full grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
        <div className="p-3 lg:order-2 lg:p-4 lg:pl-0">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black">
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

        {/* Below lg the counter and link share the top row; from lg the
            text column reads top to bottom with the link at its foot. */}
        <div className="grid min-h-0 grid-cols-[1fr_auto] content-start items-center gap-x-3 px-5 pb-6 pt-1 lg:order-1 lg:flex lg:flex-col lg:items-stretch lg:p-10">
          <p className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
            {pad(index + 1)} / {pad(PROJECTS.length)}
          </p>
          <h3 className="col-span-2 mt-1.5 text-2xl font-semibold tracking-[-0.035em] lg:order-2 lg:mt-4 lg:text-[2.5rem] lg:leading-[1.05]">
            {project.title}
          </h3>
          <p className="col-span-2 mt-2.5 text-sm leading-relaxed text-muted-foreground lg:order-3 lg:mt-5 lg:text-base">{project.description}</p>
          <ul className="col-span-2 mt-4 flex flex-wrap gap-1.5 lg:order-4 lg:mt-6" aria-label="Tags">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                {tag}
              </li>
            ))}
          </ul>
          <div className="col-start-2 row-start-1 lg:order-5 lg:mt-auto lg:pt-5">
            {project.url ? (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {linkLabel(project)}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <span className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-dashed border-white/15 px-3 text-sm text-muted-foreground">
                {linkLabel(project)}
              </span>
            )}
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
      >
        {PROJECTS.map((project, index) => (
          <StackingCardItem
            key={project.id}
            index={index}
            topPosition={`calc(var(--stack-top) + ${index} * var(--stack-step))`}
            className="max-lg:static max-lg:h-auto max-lg:[&>div]:transform-none! lg:h-[calc(min(29rem,100svh_-_14rem)_+_1.5rem)]"
          >
            <div className="md:h-full lg:h-[min(29rem,calc(100svh-14rem))]">
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
