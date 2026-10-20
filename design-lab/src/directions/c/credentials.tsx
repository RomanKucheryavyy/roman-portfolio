'use client'

import dynamic from 'next/dynamic'
import { BadgeCheck } from 'lucide-react'
import type { ToolchainItem } from '@/components/ui/toolchain-marquee'
import { CERTIFICATIONS } from '@/lib/content'
import { Container, SectionHeader } from './section-header'

// The marquee reads prefers-reduced-motion during its first render, so the
// server's HTML and the browser's disagree for anyone who has it on. Rendering
// it in the browser only avoids that hydration error; the empty box keeps the
// rows' height so nothing moves when it arrives.
const ToolchainMarquee = dynamic(() => import('@/components/ui/toolchain-marquee'), {
  ssr: false,
  loading: () => <div className="h-[92px] max-[600px]:h-[86px]" />,
})

// One accent for every badge: these are all the same kind of thing.
const items: ToolchainItem[] = CERTIFICATIONS.map((c) => ({
  label: `${c.name} · ${c.date}`,
  icon: <BadgeCheck />,
  accent: 'var(--stage-accent-ink)',
}))

const newest = CERTIFICATIONS[0]
const oldest = CERTIFICATIONS[CERTIFICATIONS.length - 1]

/** Act IV: the eight Salesforce certifications, newest first, on two rows. */
export function Credentials() {
  return (
    <section id="credentials" aria-labelledby="credentials-title" className="scroll-mt-14 py-16 md:py-32">
      <Container>
        <SectionHeader
          id="credentials-title"
          act="Act IV"
          kicker="Credentials"
          title={`${CERTIFICATIONS.length} Salesforce certifications`}
          intro={`From ${oldest.name} in ${oldest.date} to ${newest.name} in ${newest.date}.`}
        />
        <div
          className="mt-12 md:mt-16"
          style={
            {
              '--text': 'oklch(0.985 0 0)',
              '--surface': 'oklch(0.18 0 0)',
              '--muted': 'oklch(0.708 0 0)',
              '--focus-ring': 'var(--stage-accent-ink)',
            } as React.CSSProperties
          }
        >
          <ToolchainMarquee
            role="group"
            aria-label="Salesforce certifications"
            stacks={[items.slice(0, 4), items.slice(4)]}
            rows={2}
            duration={34}
            showControl
          />
        </div>
      </Container>
    </section>
  )
}
