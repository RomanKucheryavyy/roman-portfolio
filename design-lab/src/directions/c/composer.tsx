'use client'

import { Send } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { AIAutocomplete } from '@/components/ui/kokonut-ai-autocomplete'
import UndoButton from '@/components/ui/kokonut-undo-button'

/**
 * Tactile's message box (direction A) in Stage's contact card: the
 * autocomplete finishes the visitor's sentence, and Send gives five seconds to
 * take it back. Roman picked Stage with this box.
 *
 * The suggestions are openers in the visitor's own voice, never claims about
 * Roman, and they never leave the page. The lab has no backend, so the sent
 * state says plainly that nothing went anywhere.
 */
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

export function suggest(text: string): string | null {
  // The sentence being written: everything after the last full stop,
  // question mark, exclamation or line break, minus a leading greeting.
  let fragment = text.match(/[^.!?\n]*$/)?.[0] ?? ''
  const greeting = fragment.match(GREETING)
  const greeted = GREETING.test(text)
  if (greeting && /,\s*/.test(greeting[0])) fragment = fragment.slice(greeting[0].length)
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
// The card and fields in contact-with-globe's own dress, so the swap is seamless.
const LABEL = 'text-xs font-semibold tracking-widest uppercase text-zinc-400'
const INPUT =
  'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-base text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-[var(--stage-accent-ink)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--stage-accent-ink)_20%,transparent)] sm:text-sm'

export function Composer() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  // While the undo window is open the button must stay usable, whatever
  // happens to the fields.
  const [pending, setPending] = useState(false)
  // Bumped to start over: a fresh form and a fresh Send button.
  const [round, setRound] = useState(0)

  const ready = name.trim().length > 0 && EMAIL.test(email.trim()) && message.trim().length > 0

  // Once sent, the box shows the message as it went, with no suggestion
  // hanging off its end.
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

  return (
    <form
      key={round}
      aria-labelledby="c-compose-title"
      className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      <div>
        <h3 id="c-compose-title" className="mb-0.5 text-lg font-semibold text-white">
          Send a message
        </h3>
        <p className="text-sm text-zinc-400">
          Start typing and the box suggests how your sentence could go on. Press Tab, or tap Accept, to take it.
        </p>
      </div>

      <fieldset disabled={sent} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="c-name" className={LABEL}>
            Name
          </label>
          <input id="c-name" name="name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-email" className={LABEL}>
            Email
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <span id="c-message-label" className={LABEL}>
          Message
        </span>
        {/* The accept bar the box fades out while there is no suggestion is taken out of the accessibility tree too. */}
        <div
          inert={sent}
          className={`overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/60 transition-colors focus-within:border-[var(--stage-accent-ink)] [&_.opacity-0]:invisible ${sent ? 'opacity-60' : ''}`}
        >
          <AIAutocomplete
            key={sent ? 'sent' : 'draft'}
            label="Message"
            placeholder="Try starting with “Hi”."
            value={message}
            onValueChange={setMessage}
            suggest={complete}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-zinc-400">
          {sent ? (
            <>
              This preview doesn’t send anything yet; on the live site it goes to my inbox.{' '}
              <button type="button" onClick={reset} className="text-white underline underline-offset-4">
                Write another
              </button>
            </>
          ) : ready ? (
            'You get five seconds to take it back.'
          ) : (
            'Add your name, email and a message to send.'
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
  )
}
