import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@/components/Reveal'
import SectionHeader from '@/components/SectionHeader'
import { CLIENT_WORK } from '@/lib/constants'

export default function ClientWork() {
  return (
    <section id="clients" className="border-t border-line px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeader
          index="02"
          kicker="Clients"
          title="Client work"
          sub="Sites and apps shipped for real businesses — design through deployment."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {CLIENT_WORK.map((project, i) => (
            <Reveal key={project.id} delay={(i % 2) * 80} className="h-full">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card/60 transition-colors duration-300 hover:border-amber/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
                  <Image
                    src={project.image}
                    alt={`Screenshot of ${project.title}`}
                    fill
                    sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold tracking-tight text-cream">
                      {project.title}
                    </h3>
                    <ArrowUpRight
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-cream/30 transition-colors group-hover:text-amber"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-cream/60">
                    {project.description}
                  </p>
                  <ul className="mt-auto flex flex-wrap gap-2 pt-4">
                    {project.tags.map((tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
