import Reveal from '@/components/Reveal'
import SectionHeader from '@/components/SectionHeader'
import { FEATURED } from '@/lib/constants'

export default function Featured() {
  return (
    <section id="work" className="border-t border-line px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeader
          index="01"
          kicker="Work"
          title="Now building"
          sub="Products I design, build, and operate myself — AI-heavy, in production, used every day."
        />
        <div className="mt-14 space-y-6">
          {FEATURED.map((project, i) => (
            <Reveal key={project.id} delay={i * 80}>
              <article className="group rounded-2xl border border-line bg-card/60 p-6 transition-colors duration-300 hover:border-amber/40 md:p-10">
                <div className="flex flex-col gap-6 md:flex-row md:gap-12">
                  <div className="flex shrink-0 flex-row items-center gap-4 md:w-40 md:flex-col md:items-start">
                    <span className="font-mono text-sm text-cream/30">
                      0{i + 1}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber/25 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-amber">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
                      {project.status}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-bold tracking-tight text-cream md:text-3xl">
                      {project.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-cream/40">
                      {project.tagline} · {project.year}
                    </p>
                    <p className="mt-4 max-w-2xl leading-relaxed text-cream/65">
                      {project.description}
                    </p>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <li key={item} className="chip">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
