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
      <div className="grid h-full grid-rows-[auto_1fr] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1">
        <div className="p-3 md:order-2 md:p-4 md:pl-0">
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

        {/* Phones: counter and link share the top row, where the link stays
            visible longest while the next card slides over this one. */}
        <div className="grid min-h-0 grid-cols-[1fr_auto] content-start items-center gap-x-3 px-5 pb-5 pt-1 md:order-1 md:flex md:flex-col md:items-stretch md:p-10">
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {pad(index + 1)} / {pad(PROJECTS.length)}
          </p>
          <h3 className="col-span-2 mt-1.5 text-2xl font-semibold tracking-[-0.035em] md:order-2 md:mt-4 md:text-[2.5rem] md:leading-[1.05]">
            {project.title}
          </h3>
          <p className="col-span-2 mt-2.5 text-sm leading-relaxed text-muted-foreground md:order-3 md:mt-5 md:text-base">{project.description}</p>
          <ul className="col-span-2 mt-4 flex flex-wrap gap-1.5 md:order-4 md:mt-6" aria-label="Tags">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                {tag}
              </li>
            ))}
          </ul>
          <div className="col-start-2 row-start-1 md:order-5 md:mt-auto md:pt-5">
            {project.url ? (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {linkLabel(project)}
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <span className="inline-flex h-8 items-center rounded-full border border-dashed border-white/15 px-3 text-sm text-muted-foreground">
                {linkLabel(project)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Act I: the nine client projects as scroll-pinned cards that stack. */
export function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="relative scroll-mt-14 pt-20 [--stack-step:9px] [--stack-top:4.25rem] md:pt-32 md:[--stack-step:12px] md:[--stack-top:6.5rem]"
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
        className="relative mt-10 px-4 md:mt-20 md:px-12"
      >
        {PROJECTS.map((project, index) => (
          <StackingCardItem
            key={project.id}
            index={index}
            topPosition={`calc(var(--stack-top) + ${index} * var(--stack-step))`}
            className="h-[64svh] md:h-[80svh]"
          >
            <div className="h-[33rem] md:h-[min(29rem,calc(100svh-14rem))]">
              <ProjectCard project={project} index={index} />
            </div>
          </StackingCardItem>
        ))}
        {/* Desktop: hold the finished stack for a beat before it leaves. */}
        <div aria-hidden="true" className="hidden md:block md:h-[13rem]" />
      </StackingCards>
      {/* Phones: a card paints `top` px below its 64svh slot, so the finished
          stack hangs past the end of the stack by up to
          (top of the last card + card height - slot). This keeps that overhang
          off Act II. */}
      <div aria-hidden="true" className="h-[max(0px,calc(var(--stack-top)+var(--n)*var(--stack-step)+33rem-64svh))] md:hidden" />
    </section>
  )
}
