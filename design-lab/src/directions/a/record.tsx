import Image from 'next/image'
import { StackPanel, type StackPage } from '@/components/ui/kokonut-stack-panel'
import { CERTIFICATIONS, EDUCATION, PERSON, ROLES, SKILLS } from '@/lib/content'
import { PANEL, prose, Section } from './section'

// The record is drawn in the same panel as the products, but it is a page to
// read, not to open: every fact is on the first page, so no row needs a tap.
// One group per role and per school: who (the caption), what (the row),
// when (the small print).

export function Experience() {
  // Newest first, as the data already is; sorted anyway so it stays true.
  const roles = [...ROLES].sort((a, b) => b.start.localeCompare(a.start))
  const schools = [...EDUCATION].sort((a, b) => b.end - a.end)
  const pages: Record<string, StackPage> = {
    record: {
      title: 'Roles and education',
      sections: [
        ...roles.map((r) => ({
          title: [r.company, r.team, r.note].filter(Boolean).join(' · '),
          rows: [{ id: `${r.company}-${r.start}`, label: r.title }],
          footer: r.dates,
        })),
        ...schools.map((e) => ({
          title: e.school,
          rows: [{ id: e.school, label: e.degree }],
          footer: `${e.start} – ${e.end}`,
        })),
      ],
    },
  }
  return (
    <Section id="experience" index={3} kicker={`${ROLES.length} roles · ${EDUCATION.length} schools`} title="Experience" intro="Where I have worked and where I studied, newest first." aside>
      <StackPanel pages={pages} root="record" className={PANEL} />
    </Section>
  )
}

export function Credentials() {
  const pages: Record<string, StackPage> = {
    record: {
      title: 'Certifications and skills',
      sections: [
        { title: 'Salesforce', rows: CERTIFICATIONS.map((c) => ({ id: c.id, label: c.name, detail: c.date })) },
        {
          title: 'Skills',
          rows: [
            { id: 'skills', label: '', trailing: prose(SKILLS.join(' · ')) },
          ],
        },
      ],
    },
  }
  return (
    <Section id="credentials" index={4} kicker={`${CERTIFICATIONS.length} Salesforce certifications`}
      title="Credentials"
      intro="Salesforce certifications, newest first, and the languages and tools I work with."
      aside
    >
      <StackPanel pages={pages} root="record" className={PANEL} />
    </Section>
  )
}

export function About() {
  return (
    <Section id="about" index={5} kicker="In my own words" title="About" aside>
      <div className="grid gap-10 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-8">
        <div className="w-40 sm:w-full">
          <Image
            src={PERSON.photo}
            alt={`Portrait of ${PERSON.name}`}
            width={1212}
            height={1818}
            sizes="176px"
            className="aspect-[4/5] w-full rounded-xl object-cover ring-1 ring-white/10"
          />
          <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-400">{PERSON.music}</p>
        </div>
        <div className="max-w-xl">
          {PERSON.about.map((para) => (
            <p key={para.slice(0, 24)} className="mb-5 text-pretty text-base leading-relaxed text-zinc-300 sm:text-lg">
              {para}
            </p>
          ))}
          <blockquote className="mt-10 border-l border-zinc-700 pl-5">
            <p className="text-pretty text-xl leading-snug font-medium tracking-tight text-foreground sm:text-2xl">{PERSON.manifesto}</p>
          </blockquote>
        </div>
      </div>
    </Section>
  )
}
