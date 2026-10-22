import Link from 'next/link'

const DIRECTIONS = [
  { href: '/a', name: 'A · Tactile', note: 'Dark and quiet, built almost entirely from kokonutUI’s newest drop: a name you can pluck, a living contour map, a lightbox of the work.' },
  { href: '/b', name: 'B · Editorial', note: 'Light, typographic and calm: a bold name over your photo, a project index with hover covers, an experience ledger, an oversized footer wordmark.' },
  { href: '/c', name: 'C · Stage', note: 'Dark and cinematic: a curtain that opens on your name, scroll-stacked project cards, a career lifeline and a globe to say hello.' },
]

export default function Index() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-10 px-6 py-24">
      <div>
        <p className="text-sm text-muted-foreground">Roman Kucheryavyy · redesign lab</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Three directions</h1>
        <p className="mt-3 text-muted-foreground">Each is built from complete 21st.dev components, used as published, filled with the real content from the live site.</p>
      </div>
      <ul className="divide-y rounded-xl border">
        {DIRECTIONS.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="block p-5 transition-colors hover:bg-muted">
              <span className="font-medium">{d.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{d.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
