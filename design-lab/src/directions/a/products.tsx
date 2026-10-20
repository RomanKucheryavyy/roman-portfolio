'use client'

import { StackPanel, type StackPage } from '@/components/ui/kokonut-stack-panel'
import { PRODUCTS } from '@/lib/content'
import { OutLink, Section } from './section'

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')

// Root: one group per product, its tagline as the group's caption, so the
// list says what each one is before it is opened. (Statuses wait inside: on
// a phone, a status beside the name would be cut short.) Each product page:
// status and site, what it is, what it is built with.
const PAGES: Record<string, StackPage> = {
  products: {
    title: 'Products',
    sections: PRODUCTS.map((p) => ({
      title: p.tagline,
      rows: [{ id: p.id, label: p.title, to: p.id }],
    })),
  },
  ...Object.fromEntries(
    PRODUCTS.map((p): [string, StackPage] => [
      p.id,
      {
        title: p.title,
        sections: [
          {
            title: p.tagline,
            rows: [
              // Trailing rather than `detail`, which is capped at 45% of the row and
              // would cut "Paper trading daily" short on a phone.
              { id: 'status', label: 'Status', trailing: <span className="shrink-0 text-sm text-zinc-400">{p.status}</span> },
              ...(p.url
                ? [
                    {
                      id: 'site',
                      label: 'Website',
                      trailing: (
                        <OutLink href={p.url} label={`${host(p.url)} (opens in a new tab)`} className="shrink-0 text-sm text-zinc-300 underline-offset-4 hover:text-white hover:underline">
                          {host(p.url)} <span aria-hidden="true">↗</span>
                        </OutLink>
                      ),
                    },
                  ]
                : []),
            ],
          },
          {
            title: 'What it is',
            rows: [
              {
                id: 'about',
                label: '',
                trailing: <p className="-ml-2 py-2 text-left text-sm leading-6 text-pretty text-zinc-300">{p.description}</p>,
              },
            ],
          },
          {
            title: 'Built with',
            rows: p.stack.map((s) => ({ id: s, label: s })),
          },
        ],
      },
    ]),
  ),
}

export function Products() {
  return (
    <Section
      id="products"
      index={2}
      kicker={`Own products · ${PRODUCTS.length}`}
      title="Products"
      intro="Not client work: products of my own. Open one for what it is and what it runs on; swipe right or press Esc to come back."
    >
      <StackPanel pages={PAGES} root="products" className="max-w-md" />
    </Section>
  )
}
