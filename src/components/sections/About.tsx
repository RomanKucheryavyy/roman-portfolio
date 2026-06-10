import { Coffee, Music, Heart } from 'lucide-react'
import Reveal from '@/components/Reveal'
import SectionHeader from '@/components/SectionHeader'
import { TIMELINE, CERTIFICATIONS, SKILL_GROUPS } from '@/lib/constants'

const BEYOND = [
  {
    icon: Coffee,
    text: 'Co-run Alongside Coffee — a family mobile espresso cart for weddings and events',
  },
  {
    icon: Music,
    text: 'Direct the FUBC Band — trumpet, arrangements, conducting',
  },
  {
    icon: Heart,
    text: 'Husband and father — the most important role',
  },
]

export default function About() {
  return (
    <section id="about" className="border-t border-line px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeader index="03" kicker="About" title="Engineer by day, builder by night" />

        <div className="mt-14 grid gap-12 lg:grid-cols-5 lg:gap-16">
          {/* Bio */}
          <Reveal className="lg:col-span-3">
            <div className="space-y-5 leading-relaxed text-cream/65">
              <p>
                By day I&apos;m a Senior Technical Support Engineer at Salesforce, working
                Premier Support on Government Cloud — the deep end of debugging, where you
                own the hardest cases until they&apos;re solved.
              </p>
              <p>
                Nights and weekends are for building. My family runs a mobile espresso cart,
                and the tools I built to run it became Alongside Events. The same itch
                produced Praxis, an AI trading platform, and Alongside Brain, the system
                that keeps the rest of my life organized.
              </p>
              <p>
                Music and code share the same DNA — structure, rhythm, improvisation within
                constraints. I try to bring all three to everything I ship.
              </p>
            </div>
            <ul className="mt-8 space-y-3">
              {BEYOND.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-cream/55">
                  <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-amber/70" />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Timeline + certifications */}
          <Reveal delay={100} className="lg:col-span-2">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">Path</h3>
            <ol className="mt-5 space-y-4 border-l border-line pl-5">
              {TIMELINE.map((item) => (
                <li key={item.year} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[1.55rem] top-1.5 h-2 w-2 rounded-full border border-amber/60 bg-ink"
                  />
                  <span className="font-mono text-xs text-amber">{item.year}</span>
                  <p className="mt-0.5 text-sm text-cream/70">{item.label}</p>
                </li>
              ))}
            </ol>

            <h3 className="mt-12 font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
              Salesforce certifications · 8
            </h3>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert.id} className="rounded-lg border border-line bg-card/60 px-3 py-2.5">
                  <p className="text-xs font-medium leading-snug text-cream/75">{cert.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-cream/35">{cert.date}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Toolbox */}
        <Reveal className="mt-16 border-t border-line pt-12">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">Toolbox</h3>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SKILL_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-[11px] uppercase tracking-wider text-amber/80">
                  {group.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-cream/60">{group.items.join(' · ')}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
