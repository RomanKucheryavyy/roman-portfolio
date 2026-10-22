'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { BadgeCheck } from 'lucide-react'
import type { ToolchainItem } from '@/components/ui/toolchain-marquee'
import { CERTIFICATIONS } from '@/lib/content'
import { cn } from '@/lib/utils'
import { Container, SectionHeader } from './section-header'

// The marquee reads prefers-reduced-motion during its first render, so the
// server's HTML and the browser's disagree for anyone who has it on. Rendering
// it in the browser only avoids that hydration error.
const ToolchainMarquee = dynamic(() => import('@/components/ui/toolchain-marquee'), { ssr: false })

// One accent for every badge: these are all the same kind of thing.
const items: ToolchainItem[] = CERTIFICATIONS.map((c) => ({
  label: `${c.name} · ${c.date}`,
  icon: <BadgeCheck />,
  accent: 'var(--stage-accent-ink)',
}))

const chunk = (size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size))

/**
 * How the eight badges are laid out. Moving rows run full-bleed so the
 * module's own edge fade sits at the screen edge. Under reduced motion the
 * rows hold still and must show every badge without sideways scrolling, so
 * they sit in the page column with fewer badges per row.
 *
 * `height` is the marquee's rendered height for that layout (rows of 44px,
 * 42px at 600px and under, the module's row gaps, and the pause control's
 * row), held while the browser-only marquee loads so nothing moves when it
 * arrives.
 */
const LAYOUTS = {
  wide: { stacks: [items.slice(0, 3), items.slice(3, 6), items.slice(6)], height: 3 * 44 + 2 * 4 + 12 + 32 },
  narrow: { stacks: chunk(2), height: 4 * 42 + 3 * 2 + 12 + 32 },
  stillWide: { stacks: chunk(2), height: 4 * 44 + 3 * 8 },
  stillNarrow: { stacks: chunk(1), height: 8 * 42 + 7 * 8 },
  stillMid: { stacks: chunk(1), height: 8 * 44 + 7 * 8 },
} as const
type Layout = keyof typeof LAYOUTS

function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>('wide')
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const small = window.matchMedia('(max-width: 600px)')
    const belowMd = window.matchMedia('(max-width: 767.98px)')
    const update = () =>
      setLayout(
        reduce.matches
          ? belowMd.matches
            ? small.matches
              ? 'stillNarrow'
              : 'stillMid'
            : 'stillWide'
          : small.matches
            ? 'narrow'
            : 'wide',
      )
    update()
    for (const q of [reduce, small, belowMd]) q.addEventListener('change', update)
    return () => {
      for (const q of [reduce, small, belowMd]) q.removeEventListener('change', update)
    }
  }, [])
  return layout
}

/** Act IV: the eight Salesforce certifications, newest first. */
export function Credentials() {
  const layout = useLayout()
  const { stacks, height } = LAYOUTS[layout]
  const still = layout.startsWith('still')
  const newest = CERTIFICATIONS[0]
  const oldest = CERTIFICATIONS[CERTIFICATIONS.length - 1]

  // Always mounted, off screen too: the badges are the only place the eight
  // certifications are written out, so screen readers, find-in-page and the
  // Tab order all need them there. Its frame loop costs two transform writes
  // a frame.
  const marquee = (
    <ToolchainMarquee
      role="group"
      aria-label="Salesforce certifications"
      stacks={stacks.map((s) => [...s])}
      rows={stacks.length}
      duration={34}
      showControl
      // The pause control drops under the rows, at the column's right edge,
      // so the moving rows can run the full width. The labels go from the
      // module's 10-11px to 13px.
      className={cn(
        '[&_[data-direction]_span>span:last-child]:text-[13px] [&_[data-direction]_span>span:last-child]:font-medium',
        !still && 'grid-cols-1! [&>button]:mr-4 [&>button]:justify-self-end md:[&>button]:mr-[max(3rem,calc((100%_-_1280px)/2_+_3rem))]',
      )}
    />
  )

  return (
    <section id="credentials" aria-labelledby="credentials-title" className="scroll-mt-14 py-16 md:py-24">
      <Container>
        <SectionHeader
          id="credentials-title"
          act="Act IV"
          kicker="Credentials"
          title={`${CERTIFICATIONS.length} Salesforce certifications`}
          intro={`From ${oldest.name} in ${oldest.date} to ${newest.name} in ${newest.date}.`}
        />
      </Container>
      <div
        className="mt-10 md:mt-14"
        style={
          {
            '--text': 'oklch(0.985 0 0)',
            '--surface': 'oklch(0.18 0 0)',
            '--muted': 'oklch(0.708 0 0)',
            '--focus-ring': 'var(--stage-accent-ink)',
          } as React.CSSProperties
        }
      >
        {still ? (
          // The still rows' own 22px inset, pulled back so the badges start on the column.
          <Container>
            <div className="-mx-[22px]" style={{ minHeight: height }}>
              {marquee}
            </div>
          </Container>
        ) : (
          <div style={{ minHeight: height }}>{marquee}</div>
        )}
      </div>
    </section>
  )
}
