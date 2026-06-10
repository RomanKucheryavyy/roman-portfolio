import { Github, Linkedin, Mail, ArrowDown } from 'lucide-react'
import { LINKS } from '@/lib/constants'

const SOCIALS = [
  { href: LINKS.github, icon: Github, label: 'GitHub' },
  { href: LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
  { href: `mailto:${LINKS.email}`, icon: Mail, label: 'Email' },
]

export default function Hero() {
  return (
    <section id="top" className="flex min-h-[100svh] flex-col justify-center px-5 pt-14 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <p className="rise font-mono text-xs tracking-[0.25em] uppercase text-amber" style={{ animationDelay: '80ms' }}>
          Auburn, WA — Engineer &amp; Builder
        </p>
        <h1
          className="rise mt-5 font-display text-[clamp(2.75rem,9vw,6rem)] font-bold leading-[0.95] tracking-tight text-cream"
          style={{ animationDelay: '160ms' }}
        >
          Roman
          <br />
          Kucheryavyy
        </h1>
        <p
          className="rise mt-7 max-w-xl text-base leading-relaxed text-cream/65 md:text-lg"
          style={{ animationDelay: '260ms' }}
        >
          Senior Technical Support Engineer at Salesforce. After hours I build AI-powered
          products — an autonomous trading platform, the software that runs my coffee
          company, and a second brain that runs everything else.
        </p>
        <div className="rise mt-10 flex flex-wrap items-center gap-5" style={{ animationDelay: '360ms' }}>
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold text-ink transition-opacity hover:opacity-85"
          >
            See the work <ArrowDown size={15} aria-hidden="true" />
          </a>
          <div className="flex items-center gap-1">
            {SOCIALS.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-full p-2.5 text-cream/55 transition-colors hover:text-amber"
              >
                <Icon size={19} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
