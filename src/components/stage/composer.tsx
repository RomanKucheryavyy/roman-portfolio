'use client'

import { CircleAlert, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AIAutocomplete } from '@/components/ui/kokonut-ai-autocomplete'
import UndoButton from '@/components/ui/kokonut-undo-button'
import { PERSON } from '@/lib/content'

/**
 * Tactile's message box (direction A) in Stage's contact card: the
 * autocomplete finishes the visitor's sentence, and Send gives five seconds to
 * take it back. Roman picked Stage with this box.
 *
 * The suggestions are openers in the visitor's own voice, never claims about
 * Roman, and they never leave the page. When the undo window closes the
 * message goes to /api/contact (see the route for the contract), and the box
 * says "Sent" only once the route answers 2xx with something delivered. On a
 * failure (a 502 when no channel delivered, a network error, a refusal) the
 * box keeps the message, says so, and offers his address and the visitor's
 * own mail app instead: nothing pretends to have gone.
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

// The route's own check (src/app/api/contact/route.ts), so the box never
// offers Send for an address the route would refuse.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// The card and fields in contact-with-globe's own dress, so the swap is seamless.
const LABEL = 'text-xs font-semibold tracking-widest uppercase text-zinc-400'
const INPUT =
  'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-base text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-[var(--stage-accent-ink)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--stage-accent-ink)_20%,transparent)] sm:text-sm'
const LINK = 'text-white underline underline-offset-4'

/**
 * draft: being written. pending: Send pressed, the undo window open.
 * sending: the window closed, the POST in flight. sent: delivered.
 * failed: not delivered; the message is still in the box.
 */
type Phase = 'draft' | 'pending' | 'sending' | 'sent' | 'failed'
type Failure = 'rate_limited' | 'incomplete' | 'generic'

export function Composer() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [phase, setPhase] = useState<Phase>('draft')
  const [failure, setFailure] = useState<Failure>('generic')
  // Bumped to start over: a fresh form and a fresh Send button.
  const [round, setRound] = useState(0)
  // Bumped after a failure: the Send button comes back from the start.
  const [attempt, setAttempt] = useState(0)

  const sent = phase === 'sent'
  const locked = phase === 'sending' || sent
  const ready = name.trim().length > 0 && EMAIL.test(email.trim()) && message.trim().length > 0

  // What the route reads as a bot: the hidden field filled in, or a send
  // within 1.5s of the form appearing. Stamped on mount and on each fresh
  // form, not during render.
  const openedAt = useRef(0)
  const botField = useRef('')
  useEffect(() => {
    openedAt.current = Date.now()
  }, [round])

  // Once it is on its way, the box shows the message as it went, with no
  // suggestion hanging off its end. (The box remounts when `locked` flips, so
  // the new callback is the one it asks.)
  const complete = useCallback((text: string) => (locked ? null : suggest(text)), [locked])

  // After a failure the new Send button takes the old one's focus, so a
  // keyboard visitor is still on it.
  const sendRef = useRef<HTMLDivElement>(null)
  const refocus = useRef(false)
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    sendRef.current?.querySelector('button')?.focus()
  }, [attempt])

  const fail = (kind: Failure) => {
    setFailure(kind)
    setPhase('failed')
    refocus.current = sendRef.current?.contains(document.activeElement) ?? false
    setAttempt((a) => a + 1)
  }

  // The undo button calls the latest onCommit it was given, so this reads the
  // fields as they are when the window closes (they stay editable while it
  // is open).
  const send = async () => {
    const v = { name, email, message }
    if (!(v.name.trim() && EMAIL.test(v.email.trim()) && v.message.trim())) return fail('incomplete')
    setPhase('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: v.name,
          email: v.email,
          message: v.message,
          botField: botField.current,
          elapsedMs: Date.now() - openedAt.current,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { delivered?: unknown; error?: unknown }
      if (res.ok && Array.isArray(body.delivered) && body.delivered.length > 0) {
        setPhase('sent')
        return
      }
      fail(body.error === 'rate_limited' ? 'rate_limited' : 'generic')
    } catch {
      fail('generic')
    }
  }

  const reset = () => {
    setName('')
    setEmail('')
    setMessage('')
    botField.current = ''
    setPhase('draft')
    setRound((r) => r + 1)
  }

  // If delivery fails, the visitor's own mail app opens with the letter intact.
  const mailto = `mailto:${PERSON.links.email}?subject=${encodeURIComponent(
    name.trim() ? `Message from ${name.trim()}` : 'Message from your site',
  )}&body=${encodeURIComponent(`${message}\n\n— ${name.trim()} <${email.trim()}>`)}`

  const usable = ready || phase === 'pending' || locked

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

      {/* Honeypot: hidden from people and from screen readers, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">Leave this empty</label>
        <input
          id="c-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => {
            botField.current = e.target.value
          }}
        />
      </div>

      <fieldset disabled={locked} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="c-name" className={LABEL}>
            Name
          </label>
          <input
            id="c-name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
          />
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
            required
            maxLength={200}
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
          inert={locked}
          className={`overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/60 transition-colors focus-within:border-[var(--stage-accent-ink)] [&_.opacity-0]:invisible ${locked ? 'opacity-60' : ''}`}
        >
          <AIAutocomplete
            key={locked ? 'locked' : 'draft'}
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
              Sent. Thanks for writing.{' '}
              <button type="button" onClick={reset} className={LINK}>
                Write another
              </button>
            </>
          ) : phase === 'sending' ? (
            'Sending…'
          ) : ready || phase === 'pending' ? (
            'You get five seconds to take it back.'
          ) : (
            'Add your name, email and a message to send.'
          )}
        </p>
        <div ref={sendRef} className="ml-auto">
          <fieldset disabled={!usable} className={usable ? 'contents' : 'contents [&_button]:opacity-50'}>
            <UndoButton
              key={attempt}
              label="Send"
              // Past tense only once it has gone: the undo window and the
              // request say what is happening, not what has not happened yet.
              doneLabel={sent ? 'Sent' : phase === 'sending' ? 'Sending…' : 'Sending'}
              icon={Send}
              duration={5000}
              resetAfter={null}
              // Its done face draws a check; while the request is out there is nothing to tick yet.
              className={phase === 'sending' ? '[&_.lucide-check]:hidden' : undefined}
              onAction={() => setPhase('pending')}
              onUndo={() => setPhase('draft')}
              onCommit={send}
            />
          </fieldset>
        </div>
      </div>

      {phase === 'failed' ? (
        <p role="alert" className="flex gap-2.5 rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-sm leading-relaxed text-zinc-300">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-400" />
          <span>
            {failure === 'incomplete' ? (
              <>Add your name, a full email address and a message, then press Send again.</>
            ) : failure === 'rate_limited' ? (
              <>
                That’s a few messages in a row; give it ten minutes, or write to me at{' '}
                <span className="select-all font-medium text-white">{PERSON.links.email}</span>.
              </>
            ) : (
              <>
                Your message didn’t go through, and it is still here. Press Send to try again,{' '}
                <a href={mailto} className={LINK}>
                  open it in your mail app
                </a>
                , or write to me at <span className="select-all font-medium text-white">{PERSON.links.email}</span>.
              </>
            )}
          </span>
        </p>
      ) : null}
    </form>
  )
}
