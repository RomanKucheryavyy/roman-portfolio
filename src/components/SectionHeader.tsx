import Reveal from '@/components/Reveal'

export default function SectionHeader({
  index,
  kicker,
  title,
  sub,
}: {
  index: string
  kicker: string
  title: string
  sub?: string
}) {
  return (
    <Reveal>
      <p className="font-mono text-xs tracking-[0.25em] uppercase text-amber">
        {index} — {kicker}
      </p>
      <h2 className="mt-3 font-display text-3xl md:text-5xl font-bold tracking-tight text-cream">
        {title}
      </h2>
      {sub && <p className="mt-4 max-w-xl text-cream/55 leading-relaxed">{sub}</p>}
    </Reveal>
  )
}
