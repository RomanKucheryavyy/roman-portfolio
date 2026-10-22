'use client'

import { Send } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { AIAutocomplete } from '@/components/ui/kokonut-ai-autocomplete'
import UndoButton from '@/components/ui/kokonut-undo-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PERSON } from '@/lib/content'
import { OutLink, Section } from './section'

// The completer: a few openers a visitor might mean, offered in their own
// voice. They are the visitor's words about the visitor, never claims about
// Roman, and they never leave the page.
const GREETINGS = ['Hi Roman,', 'Hello Roman,', 'Hey Roman,']
const OPENERS = [
  "I'm looking for a new website for my business.",
  'I have an idea for an iOS app and would love to talk it through.',
  'I have a Salesforce question I was hoping to ask you.',
  'Just wanted to say hello.',
]
const FOLLOW_UPS = ['Would you have time for a short call?', 'Thanks for reading!']

const GREETING = /^\s*(hi|hello|hey)\s+roman,?\s*/i
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'")

function suggest(text: string): string | null {
  // The sentence being written: everything after the last full stop,
  // question mark, exclamation or line break, minus a leading greeting.
  let fragment = text.match(/[^.!?\n]*$/)?.[0] ?? ''
  const greeting = fragment.match(GREETING)
  const greeted = GREETING.test(text)
  if (greeting && /,\s*/.test(greeting[0])) {
    fragment = fragment.slice(greeting[0].length)
  }
  const lead = fragment.replace(/^\s+/, '')
  const pad = /\s$/.test(text) ? '' : ' '
  const said = norm(text)

  if (!lead) {
    // Between sentences: offer the next one.
    const opened = OPENERS.some((o) => said.includes(norm(o).slice(0, 18)))
    if (greeted && !opened) return pad + OPENERS[0]
    // A hello needs no call; anything else might.
    const next = FOLLOW_UPS.find((f, i) => !said.includes(norm(f)) && !(i === 0 && said.includes('say hello')))
    return opened && next ? pad + next : null
  }

  // At the very start a greeting is on offer too; later, only sentences.
  const pool = text.trim() === lead.trim() ? [...GREETINGS, ...OPENERS] : [...OPENERS, ...FOLLOW_UPS]
  const typed = norm(lead)
  const hit = pool.find((s) => norm(s).startsWith(typed) && s.length > lead.length)
  return hit ? hit.slice(lead.length) : null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The field being typed in shows a tint and a bar down its left edge.
const FOCUS = 'transition-colors focus-within:bg-white/[0.05] focus-within:shadow-[inset_2px_0_0_var(--color-zinc-300)]'
const ROW = `flex items-center gap-3 px-4 ${FOCUS}`
const FIELD = 'h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent'

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  // While the undo window is open the button must stay usable, whatever
  // happens to the fields.
  const [pending, setPending] = useState(false)
  // Bumped to start over: a fresh form and a fresh Send button.
  const [round, setRound] = useState(0)

  const ready = EMAIL.test(email.trim()) && message.trim().length > 0

  // Once sent, the box shows the message as it went, with no suggestion
  // hanging off its end: it is remounted, and the completer goes quiet.
  const sentRef = useRef(false)
  sentRef.current = sent
  const complete = useCallback((text: string) => (sentRef.current ? null : suggest(text)), [])

  const reset = () => {
    setName('')
    setEmail('')
    setMessage('')
    setSent(false)
    setPending(false)
    setRound((r) => r + 1)
  }

  const links = [
    { label: 'Email', value: PERSON.links.email, href: `mailto:${PERSON.links.email}`, out: false },
    { label: 'LinkedIn', value: 'in/romakuch', href: PERSON.links.linkedin, out: true },
    { label: 'GitHub', value: 'RomanKucheryavyy', href: PERSON.links.github, out: true },
  ]

  return (
    <Section
      id="contact"
      index={6}
      kicker="Say hello"
      title="Contact"
      intro="Write a note below, or reach me directly. Start typing and the message box suggests how your sentence could go on; press Tab, or tap Accept, to take it."
      aside
      // Where the rail shows, the last section is a screen tall, so the rail
      // can bring its heading up like every other's (and its tick does not
      // crowd About's at the end of the rail).
      className="lg:pointer-fine:min-h-svh"
    >
      <ul className="mb-10 grid border-t sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3 sm:border-t-0">
        {links.map((l) => {
          const body = (
            <>
              <span className="text-xs text-muted-foreground">{l.label}</span>
              <span className="mt-1 flex items-center justify-between gap-2 truncate text-sm text-foreground">
                <span className="truncate">{l.value}</span>
                <span aria-hidden="true" className="text-muted-foreground transition-transform group-hover:-translate-y-px group-hover:translate-x-px">
                  {l.out ? '↗' : '→'}
                </span>
              </span>
            </>
          )
          const cls = 'group flex flex-col border-b py-4 transition-colors sm:rounded-xl sm:border sm:px-4 sm:hover:bg-white/[0.03]'
          return (
            <li key={l.label} className="min-w-0">
              {l.out ? (
                <OutLink href={l.href} className={cls} label={`${l.label}: ${l.value} (opens in a new tab)`}>
                  {body}
                </OutLink>
              ) : (
                <a href={l.href} className={cls}>
                  {body}
                </a>
              )}
            </li>
          )
        })}
      </ul>

      <form
        key={round}
        aria-label="Message to Roman"
        className="overflow-hidden rounded-2xl border bg-background"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <fieldset disabled={sent} className="min-w-0 divide-y border-b text-sm">
          <div className={ROW}>
            <Label htmlFor="a-name" className="w-14 shrink-0 font-normal text-muted-foreground">
              Name
            </Label>
            <Input id="a-name" name="name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
          </div>
          <div className={ROW}>
            <Label htmlFor="a-email" className="w-14 shrink-0 font-normal text-muted-foreground">
              Email
            </Label>
            <Input
              id="a-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD}
            />
          </div>
        </fieldset>

        {/* The accept bar the box keeps faded out while there is no suggestion is taken out of the accessibility tree too. */}
        <div inert={sent} className={`${FOCUS} [&_.opacity-0]:invisible ${sent ? 'opacity-60' : ''}`}>
          <AIAutocomplete
            key={sent ? 'sent' : 'draft'}
            label="Message"
            placeholder="Your message. Try starting with “Hi”."
            value={message}
            onValueChange={setMessage}
            suggest={complete}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {sent ? (
              <>
                Sent. Thank you{name.trim() ? `, ${name.trim()}` : ''}.{' '}
                <button type="button" onClick={reset} className="text-foreground underline underline-offset-4">
                  Write another
                </button>
              </>
            ) : ready ? (
              'You get five seconds to take it back.'
            ) : (
              'Add your email and a message to send.'
            )}
          </p>
          <div className="ml-auto">
            <fieldset disabled={!(ready || pending || sent)} className={ready || pending || sent ? 'contents' : 'contents [&_button]:opacity-50'}>
              <UndoButton
                label="Send"
                doneLabel="Sent"
                icon={Send}
                duration={5000}
                resetAfter={null}
                onAction={() => setPending(true)}
                onUndo={() => setPending(false)}
                onCommit={() => {
                  setPending(false)
                  setSent(true)
                }}
              />
            </fieldset>
          </div>
        </div>
      </form>
    </Section>
  )
}
