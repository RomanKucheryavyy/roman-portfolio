'use client'

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { StackPanel, type StackPage } from '@/components/ui/kokonut-stack-panel'
import { PRODUCTS } from '@/lib/content'
import { OutLink, PANEL, prose, Section } from './section'

const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')

const ROOT = 'own'
// Own work, as against the client work above (the count is in the kicker).
// Short, because it is also the Back button's label on a phone.
const ROOT_TITLE = 'Own work'
const TITLES = new Set(PRODUCTS.map((p) => p.title))

// Root: one group per product, its tagline as the group's caption and its
// status and stack in the small print, so the list says what each one is
// and where it stands before anything is opened. Each product page: status
// and site, what it is, what it is built with.
const PAGES: Record<string, StackPage> = {
  [ROOT]: {
    title: ROOT_TITLE,
    sections: PRODUCTS.map((p) => ({
      title: p.tagline,
      rows: [{ id: p.id, label: p.title, to: p.id }],
      footer: `${p.status} · ${p.stack.join(' · ')}`,
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
                        <OutLink
                          href={p.url}
                          label={`${host(p.url)} (opens in a new tab)`}
                          className="-my-3 shrink-0 py-3 text-sm text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                        >
                          {host(p.url)} <span aria-hidden="true">↗</span>
                        </OutLink>
                      ),
                    },
                  ]
                : []),
            ],
          },
          { title: 'What it is', rows: [{ id: 'about', label: '', trailing: prose(p.description) }] },
          // One line of text, not four rows that look like they open something.
          { title: 'Built with', rows: [{ id: 'stack', label: '', trailing: prose(p.stack.join(' · ')) }] },
        ],
      },
    ]),
  ),
}

export function Products() {
  const wrap = useRef<HTMLDivElement>(null)
  const opened = useRef<string | null>(null)

  // Coming back from the keyboard (Esc, or Back pressed with Enter or Space)
  // removes the focused Back button once the page has slid away. Focus then
  // goes to the row that was opened, unless it has already moved on.
  const restoreFocus = () => {
    const title = opened.current
    window.setTimeout(() => {
      const active = document.activeElement
      if (!title || !wrap.current || (active && active !== document.body)) return
      const row = Array.from(wrap.current.querySelectorAll('button')).find((b) => b.textContent?.trim() === title)
      row?.focus()
    }, 650)
  }

  // The panel takes the height of the page on top. Hold the tallest height
  // seen at this width, so opening a shorter page never pulls the sections
  // below up and back down.
  useEffect(() => {
    const box = wrap.current
    const panel = box?.firstElementChild
    if (!box || !panel) return
    let tallest = 0
    let width = 0
    const watch = new ResizeObserver(() => {
      const { height, width: w } = panel.getBoundingClientRect()
      if (w !== width) {
        width = w
        tallest = 0
      }
      if (height > tallest) {
        tallest = height
        box.style.minHeight = `${Math.ceil(height)}px`
      }
    })
    watch.observe(panel)
    return () => watch.disconnect()
  }, [])

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const text = (event.target as HTMLElement).closest('button')?.textContent?.trim() ?? ''
    if (TITLES.has(text)) opened.current = text
    else if (text === ROOT_TITLE && event.detail === 0) restoreFocus()
  }
  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') restoreFocus()
  }

  return (
    <Section
      id="products"
      index={2}
      kicker={`Own products · ${PRODUCTS.length}`}
      title="Products"
      intro="Not client work: products of my own. Open one to read what it does; swipe it right or use Back to return."
      aside
    >
      <div ref={wrap} onClickCapture={onClickCapture} onKeyDownCapture={onKeyDownCapture}>
        <StackPanel pages={PAGES} root={ROOT} className={PANEL} />
      </div>
    </Section>
  )
}
