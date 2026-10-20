import Image from 'next/image'
import { CERTIFICATIONS, EDUCATION, PERSON, ROLES, SKILLS } from '@/lib/content'
import { Section } from './section'

// Plain, typographic glue: these are facts to read, not things to play with.

const ROW = 'grid gap-x-6 gap-y-1 border-b py-5 sm:grid-cols-[11rem_minmax(0,1fr)]'
const WHEN = 'font-mono text-xs tabular-nums text-muted-foreground sm:pt-1'

export function Experience() {
  // Newest first, as the data already is; sorted anyway so it stays true.
  const roles = [...ROLES].sort((a, b) => b.start.localeCompare(a.start))
  const schools = [...EDUCATION].sort((a, b) => b.end - a.end)
  return (
    <Section id="experience" index={3} kicker="Roles and education" title="Experience">
      <h3 className="mb-1 font-mono text-xs text-zinc-500">Roles</h3>
      <ol className="border-t">
        {roles.map((r) => (
          <li key={`${r.company}-${r.start}`} className={ROW}>
            <p className={WHEN}>{r.dates}</p>
            <div>
              <p className="font-medium tracking-tight text-foreground">{r.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.company}
                {r.team ? ` · ${r.team}` : ''}
                {r.note ? ` · ${r.note}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <h3 className="mt-12 mb-1 font-mono text-xs text-zinc-500">Education</h3>
      <ol className="border-t">
        {schools.map((e) => (
          <li key={e.school} className={ROW}>
            <p className={WHEN}>
              {e.start} – {e.end}
            </p>
            <div>
              <p className="font-medium tracking-tight text-foreground">{e.degree}</p>
              <p className="mt-1 text-sm text-muted-foreground">{e.school}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function Credentials() {
  return (
    <Section id="credentials" index={4} kicker={`${CERTIFICATIONS.length} Salesforce certifications`} title="Credentials">
      <ul className="grid border-t sm:grid-cols-2 sm:gap-x-10">
        {CERTIFICATIONS.map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-4 border-b py-3.5">
            <span className="text-[15px] text-foreground">{c.name}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{c.date}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-14 mb-4 font-mono text-xs text-zinc-500">Skills</h3>
      <ul className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <li key={s} className="rounded-full border px-3 py-1 font-mono text-xs text-zinc-300">
            {s}
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function About() {
  return (
    <Section id="about" index={5} kicker="In my own words" title="About">
      <div className="grid gap-10 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-6">
        <div className="w-40 sm:w-full">
          <Image
            src={PERSON.photo}
            alt={`Portrait of ${PERSON.name}`}
            width={1212}
            height={1818}
            sizes="176px"
            className="aspect-[4/5] w-full rounded-xl object-cover ring-1 ring-white/10"
          />
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-zinc-500">{PERSON.music}</p>
        </div>
        <div className="max-w-xl">
          {PERSON.about.map((para) => (
            <p key={para.slice(0, 24)} className="mb-5 text-pretty text-[17px] leading-[1.7] text-zinc-300">
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
