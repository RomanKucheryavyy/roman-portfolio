'use client'

import { Check, CircleAlert, Copy, Mail, PenLine, RotateCw, Send } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { AIAutocomplete } from '@/components/ui/kokonut-ai-autocomplete'
import UndoButton from '@/components/ui/kokonut-undo-button'
import { PERSON } from '@/lib/content'
import { firstName } from '@/lib/first-name'

/**
 * Tactile's message box (direction A) in Stage's contact card: the
 * autocomplete finishes the visitor's sentence, and Send gives five seconds to
 * take it back. Roman picked Stage with this box.
 *
 * The suggestions are openers in the visitor's own voice, never claims about
 * Roman, and they never leave the page. When the undo window closes the
 * message goes to /api/contact (see the route for the contract), and the box
 * says "sent" only once the route answers 2xx with something delivered: then
 * a confirmation panel takes the fields' place, naming the address Roman will
 * reply to, and, when the route says Resend took one, the receipt on its way.
 * On a failure (a 502 when no channel delivered, a network error, a refusal)
 * a panel in the same place says so, keeps the message for Try again or for
 * Edit message (the form again, everything as they left it), and offers his
 * address and the visitor's own mail app instead: nothing pretends to have
 * gone. Either panel takes focus as it appears, so a keyboard or
 * screen-reader visitor hears the outcome.
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
/**
 * iOS Safari zooms the page into any field under 16px when it takes focus,
 * and a phone held sideways is wider than sm, so the fields drop to 14px
 * only from sm up with a mouse or trackpad (pointer: fine); on touch they
 * stay 16px at any width.
 */
const INPUT =
  'w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 text-base text-zinc-200 outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-[var(--stage-accent-ink)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--stage-accent-ink)_20%,transparent)] sm:pointer-fine:text-sm'
/**
 * The kokonut box draws its text at 15px, in two layers: the textarea and
 * the mirror under it that carries the grey suggestion. For the same iOS
 * zoom, below sm and on any touch screen (pointer: coarse, so a phone in
 * landscape too) both layers go to 16px together, so the suggestion stays on
 * the caret's line; with a mouse from sm up they stay as published.
 */
const BOX_TEXT = 'max-sm:[&_div:has(>textarea)>*]:text-[16px] pointer-coarse:[&_div:has(>textarea)>*]:text-[16px]'
/** The panels' pill buttons, the hero's shape (rounded-full, h-10). */
const PILL = 'h-10 rounded-full px-5'
/** A panel's heading takes focus when the panel appears; it is not a control, so no ring. */
const PANEL_HEADING = 'scroll-mt-24 text-2xl font-semibold tracking-tight text-white text-balance focus:outline-none'

/**
 * draft: being written. pending: Send pressed, the undo window open.
 * sending: the window closed, the POST in flight. sent: delivered.
 * failed: not delivered; the message is kept.
 */
type Phase = 'draft' | 'pending' | 'sending' | 'sent' | 'failed'
type Failure = 'rate_limited' | 'incomplete' | 'generic'

export function Composer() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [phase, setPhase] = useState<Phase>('draft')
  const [failure, setFailure] = useState<Failure>('generic')
  // The route's word on the visitor's receipt: true only when Resend took it.
  const [receipt, setReceipt] = useState(false)
  // A Try again from the failure panel is out: the panel stays up meanwhile.
  const [retrying, setRetrying] = useState(false)
  // Failed sends in a row, so a Try again that fails too says so.
  const [misses, setMisses] = useState(0)
  // Bumped to start over: a fresh form and a fresh Send button.
  const [round, setRound] = useState(0)
  // Bumped after an incomplete send: the Send button comes back from the start.
  const [attempt, setAttempt] = useState(0)
  // Bumped each time a panel appears, or a Try again comes back: focus goes
  // to the panel's heading.
  const [shown, setShown] = useState(0)
  // Bumped by the failure panel's Edit message: the form comes back as it
  // was, with the cursor at the end of the message.
  const [edits, setEdits] = useState(0)

  const locked = phase === 'sending' || phase === 'sent'
  const ready = name.trim().length > 0 && EMAIL.test(email.trim()) && message.trim().length > 0
  const panel = phase === 'sent' ? 'sent' : (phase === 'failed' && failure !== 'incomplete') || retrying ? 'failed' : null

  // What the route reads as a bot: the hidden field filled in, or a send
  // within 1.5s of the form appearing. Stamped on mount and on each fresh
  // form, not during render.
  const openedAt = useRef(0)
  const botField = useRef('')
  // A fresh form after "Send another message" starts with the cursor in Name.
  const nameRef = useRef<HTMLInputElement>(null)
  const focusName = useRef(false)
  useEffect(() => {
    openedAt.current = Date.now()
    if (focusName.current) {
      focusName.current = false
      nameRef.current?.focus()
    }
  }, [round])

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (shown) headingRef.current?.focus()
  }, [shown])
  const showPanel = () => setShown((n) => n + 1)

  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!edits) return
    const area = boxRef.current?.querySelector('textarea')
    if (!area) return
    area.focus({ preventScroll: true })
    area.setSelectionRange(area.value.length, area.value.length)
    // Into view clear of the top bar (the box's scroll margin).
    boxRef.current?.scrollIntoView({ block: 'nearest' })
  }, [edits])
  // Back to the form with the name, address and message as they were, to
  // fix a typo in the address, copy the message, or send it again.
  const edit = () => {
    setRetrying(false)
    setPhase('draft')
    setEdits((n) => n + 1)
  }

  // Once it is on its way, the box shows the message as it went, with no
  // suggestion hanging off its end. (The box remounts when `locked` flips, so
  // the new callback is the one it asks.)
  const complete = useCallback((text: string) => (locked ? null : suggest(text)), [locked])

  // After an incomplete send the new Send button takes the old one's focus,
  // so a keyboard visitor is still on it.
  const sendRef = useRef<HTMLDivElement>(null)
  const refocus = useRef(false)
  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    sendRef.current?.querySelector('button')?.focus()
  }, [attempt])

  const fail = (kind: Failure) => {
    setFailure(kind)
    setRetrying(false)
    setPhase('failed')
    if (kind === 'incomplete') {
      // The fields were emptied during the undo window: back to them.
      refocus.current = sendRef.current?.contains(document.activeElement) ?? false
      setAttempt((a) => a + 1)
      return
    }
    setMisses((n) => n + 1)
    showPanel()
  }

  // The undo button calls the latest onCommit it was given, so this reads the
  // fields as they are when the window closes (they stay editable while it
  // is open). Try again calls it straight from the failure panel.
  const send = async (retry = false) => {
    const v = { name, email, message }
    if (!(v.name.trim() && EMAIL.test(v.email.trim()) && v.message.trim())) return fail('incomplete')
    setPhase('sending')
    setRetrying(retry)
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
      const body = (await res.json().catch(() => ({}))) as { delivered?: unknown; error?: unknown; receipt?: unknown }
      if (res.ok && Array.isArray(body.delivered) && body.delivered.length > 0) {
        setReceipt(body.receipt === true)
        setRetrying(false)
        setMisses(0)
        setPhase('sent')
        showPanel()
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
    setReceipt(false)
    setMisses(0)
    setPhase('draft')
    focusName.current = true
    setRound((r) => r + 1)
  }

  // If delivery fails, the visitor's own mail app opens with the letter intact.
  const mailto = `mailto:${PERSON.links.email}?subject=${encodeURIComponent(
    name.trim() ? `Message from ${name.trim()}` : 'Message from your site',
  )}&body=${encodeURIComponent(`${message}\n\n— ${name.trim()} <${email.trim()}>`)}`

  const usable = ready || phase === 'pending' || locked

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      {panel === 'sent' ? (
        <SentPanel headingRef={headingRef} name={name} email={email.trim()} message={message} receipt={receipt} onAnother={reset} />
      ) : panel === 'failed' ? (
        <FailedPanel
          headingRef={headingRef}
          failure={failure}
          again={misses > 1}
          busy={retrying}
          message={message}
          mailto={mailto}
          onRetry={() => {
            if (!retrying) void send(true)
          }}
          onEdit={edit}
        />
      ) : (
        <form
          key={round}
          aria-labelledby="c-compose-title"
          className="flex flex-col gap-5"
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
                ref={nameRef}
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
              ref={boxRef}
              inert={locked}
              className={`scroll-my-24 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/60 transition-colors focus-within:border-[var(--stage-accent-ink)] [&_.opacity-0]:invisible ${BOX_TEXT} ${locked ? 'opacity-60' : ''}`}
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
            {/* While the request is out the Send button says "Sending…" (and announces it), so this line says nothing. */}
            <p aria-live="polite" className="text-sm text-zinc-400">
              {phase === 'sending'
                ? ''
                : ready || phase === 'pending'
                  ? 'You get five seconds to take it back.'
                  : 'Add your name, email and a message to send.'}
            </p>
            <div ref={sendRef} className="ml-auto">
              <fieldset disabled={!usable} className={usable ? 'contents' : 'contents [&_button]:opacity-50'}>
                <UndoButton
                  key={attempt}
                  label="Send"
                  // Never past tense here: the undo window and the request say
                  // what is happening, and "sent" is the panel's to say.
                  doneLabel={phase === 'sending' ? 'Sending…' : 'Sending'}
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

          {phase === 'failed' && failure === 'incomplete' ? (
            <p role="alert" className="flex gap-2.5 rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-sm leading-relaxed text-zinc-300">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-red-400" />
              <span>Add your name, a full email address and a message, then press Send again.</span>
            </p>
          ) : null}
        </form>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- panels -- */

/** The ring round a panel's icon: violet for sent, red for not. */
function PanelIcon({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  const ring =
    tone === 'ok'
      ? 'border-[color-mix(in_oklab,var(--stage-accent-ink)_45%,transparent)] bg-[color-mix(in_oklab,var(--stage-accent-ink)_12%,transparent)] text-[var(--stage-accent-ink)] shadow-[0_0_0_8px_color-mix(in_oklab,var(--stage-accent-ink)_6%,transparent)]'
      : 'border-red-400/40 bg-red-400/10 text-red-400 shadow-[0_0_0_8px_rgb(248_113_113/0.05)]'
  return (
    <span aria-hidden="true" className={`flex size-14 shrink-0 items-center justify-center rounded-full border ${ring}`}>
      {children}
    </span>
  )
}

/**
 * What they wrote, quietly: four lines of it, as a reminder rather than a
 * record (the failure panel's Edit message brings back all of it). Blank
 * lines between paragraphs are dropped, so they don't use up the four, and a
 * longer message fades out at the bottom rather than ending in an ellipsis
 * glued to its own full stop ("pickup.…").
 */
function Quote({ message }: { message: string }) {
  const text = message.trim().replace(/\n(?:[^\S\n]*\n)+/g, '\n')
  const ref = useRef<HTMLQuoteElement>(null)
  const [clipped, setClipped] = useState(false)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const measure = () => setClipped(node.scrollHeight > node.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [text])
  return (
    <figure className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-left">
      <figcaption className={LABEL}>Your message</figcaption>
      <blockquote
        ref={ref}
        className={`mt-2 max-h-[4lh] overflow-hidden whitespace-pre-line break-words text-sm leading-relaxed text-zinc-500 ${clipped ? '[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_1.25lh),transparent)]' : ''}`}
      >
        {text}
      </blockquote>
    </figure>
  )
}

function SentPanel({
  headingRef,
  name,
  email,
  message,
  receipt,
  onAnother,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  name: string
  email: string
  message: string
  receipt: boolean
  onAnother: () => void
}) {
  const first = firstName(name)
  return (
    <div className="m-auto flex w-full max-w-md flex-col items-center gap-6 py-2 text-center">
      <PanelIcon tone="ok">
        <Check className="size-6" strokeWidth={2.25} />
      </PanelIcon>
      <div className="flex flex-col gap-2">
        <h3 ref={headingRef} tabIndex={-1} aria-describedby={receipt ? 'c-sent-note c-sent-receipt' : 'c-sent-note'} className={PANEL_HEADING}>
          Message sent
        </h3>
        <p id="c-sent-note" className="text-sm leading-relaxed text-zinc-400 sm:text-base">
          {first ? `Thanks, ${first}.` : 'Thanks.'} Your message reached me, and I’ll reply to{' '}
          <span className="font-medium text-zinc-100 [overflow-wrap:anywhere]">{email}</span>.
        </p>
        {receipt ? (
          <p id="c-sent-receipt" className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            A confirmation is on its way to your inbox.
          </p>
        ) : null}
      </div>
      <Quote message={message} />
      <Button type="button" variant="outline" className={PILL} onClick={onAnother}>
        <PenLine aria-hidden="true" />
        Send another message
      </Button>
    </div>
  )
}

function FailedPanel({
  headingRef,
  failure,
  again,
  busy,
  message,
  mailto,
  onRetry,
  onEdit,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  failure: Failure
  /** A Try again that failed as well. */
  again: boolean
  /** A Try again is out. */
  busy: boolean
  message: string
  mailto: string
  onRetry: () => void
  /** Back to the form, with everything as it was. */
  onEdit: () => void
}) {
  const limited = failure === 'rate_limited'
  const [copied, setCopied] = useState(false)
  const addressRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2500)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PERSON.links.email)
      setCopied(true)
    } catch {
      // No clipboard here (an older browser, a refused permission): select
      // the address instead, so a long-press or Ctrl C takes it.
      const node = addressRef.current
      if (node) window.getSelection()?.selectAllChildren(node)
    }
  }

  return (
    <div className="m-auto flex w-full max-w-md flex-col items-center gap-6 py-2 text-center">
      <PanelIcon tone="error">
        <CircleAlert className="size-6" strokeWidth={2} />
      </PanelIcon>
      <div className="flex flex-col gap-2">
        <h3 ref={headingRef} tabIndex={-1} aria-describedby="c-failed-note" className={PANEL_HEADING}>
          {again ? 'Your message still didn’t go through' : 'Your message didn’t go through'}
        </h3>
        <p id="c-failed-note" className="text-sm leading-relaxed text-zinc-400 sm:text-base">
          {limited
            ? 'That’s a few messages in a row, so the box is pausing for ten minutes. Your message is kept here: try again after that, or write to me directly.'
            : again
              ? 'It’s kept here. Try again in a moment, or write to me directly.'
              : 'It’s still here. Try again, or write to me directly.'}
        </p>
      </div>

      {/* While the box is pausing, Try again would only fail again, so writing directly leads instead. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant={limited ? 'outline' : 'default'} className={PILL} aria-disabled={busy || undefined} onClick={onRetry}>
          <RotateCw aria-hidden="true" className={busy ? 'motion-safe:animate-spin' : undefined} />
          {busy ? 'Trying again…' : 'Try again'}
        </Button>
        <Button type="button" variant="outline" className={PILL} aria-disabled={busy || undefined} onClick={busy ? undefined : onEdit}>
          <PenLine aria-hidden="true" />
          Edit message
        </Button>
      </div>

      <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/60 p-4">
        <span ref={addressRef} className="select-all break-words text-base font-medium text-white">
          {PERSON.links.email}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-full px-4" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy email'}
          </Button>
          <Button asChild variant={limited ? 'default' : 'outline'} size="sm" className="h-9 rounded-full px-4">
            <a href={mailto}>
              <Mail aria-hidden="true" />
              Open in your mail app
            </a>
          </Button>
        </div>
        <span aria-live="polite" className="sr-only">
          {copied ? 'Email address copied.' : ''}
        </span>
      </div>

      <Quote message={message} />
    </div>
  )
}
