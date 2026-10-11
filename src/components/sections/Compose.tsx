'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, Github, Linkedin, Mail } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { Panel } from '@/components/ui/Panel'
import { TerminalBar } from '@/components/ui/TerminalBar'
import { LINKS } from '@/lib/constants'
import { modKeyGlyph } from '@/lib/platform'
import { RESUME_PDF_HREF, RESUME_REQUEST } from '@/lib/routes'

/** Musician's dynamics for how loudly the message is being written. */
const dynamicsFor = (length: number): { mark: string; word: string } => {
  if (length === 0) return { mark: 'tacet', word: 'silence' }
  if (length < 50) return { mark: 'pp', word: 'pianissimo' }
  if (length < 150) return { mark: 'mp', word: 'mezzo-piano' }
  if (length < 300) return { mark: 'f', word: 'forte' }
  return { mark: 'ff', word: 'fortissimo' }
}

/** White pixel-square burst — the boot loader's send-off, aimed at a corner. */
const burstFrom = (x: number, y: number, host: HTMLElement) => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (let p = 0; p < 8; p++) {
    const dot = document.createElement('div')
    dot.className = 'absolute rounded-sm bg-white pointer-events-none'
    const size = 4 * Math.random() + 2
    dot.style.width = `${size}px`
    dot.style.height = `${size}px`
    dot.style.left = `${x}px`
    dot.style.top = `${y}px`
    host.appendChild(dot)
    const angle = Math.random() * Math.PI * 2
    const dist = 60 + 180 * Math.random()
    gsap.to(dot, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: 0,
      scale: 0,
      duration: 0.6 + 0.4 * Math.random(),
      ease: 'power3.out',
      delay: 0.1 * Math.random(),
      onComplete: () => dot.remove(),
    })
  }
}

/** The platform never changes under a page, so there is nothing to subscribe to. */
const noSubscribe = () => () => {}

const DRAFT_KEY = 'compose:draft'
const EMPTY = { name: '', email: '', message: '' }

export default function Compose() {
  const sectionRef = useRef<HTMLElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const burstHostRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef<HTMLParagraphElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'rate_limited' | 'generic'>('generic')
  // ⌘ on Apple, Ctrl elsewhere. The server can't know, so it renders the ⌘ the
  // button always showed and the client corrects it after hydrating.
  const modKey = useSyncExternalStore(noSubscribe, modKeyGlyph, () => '⌘')
  // Bots fill every field they can see; humans take longer than a second and a half.
  // Stamped on mount rather than in the initializer — reading the clock during
  // render is a side effect, and 0 fails open, which is the right way to fail.
  const openedAt = useRef(0)
  const botField = useRef('')

  // Restore an unsent draft. The "saved" label in the title bar used to be
  // theatre on a timer — now it marks a write that actually happened.
  useEffect(() => {
    openedAt.current = Date.now()
    try {
      const stored = localStorage.getItem(DRAFT_KEY)
      if (stored) {
        const draft = JSON.parse(stored) as Partial<typeof EMPTY>
        setForm({ ...EMPTY, ...draft })
      }
    } catch {
      /* private mode, quota, corrupt JSON — a missing draft is not worth a failure */
    }
  }, [])

  useEffect(() => {
    if (status === 'sent') return
    if (!form.name && !form.email && !form.message) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setSavedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
      } catch {
        /* nothing to tell the visitor — the message still sends */
      }
    }, 800)
    return () => clearTimeout(t)
  }, [form, status])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    // ⌘↩ in the textarea calls requestSubmit(), which a pending button can't swallow.
    if (status === 'sending' || status === 'sent') return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          botField: botField.current,
          elapsedMs: Date.now() - openedAt.current,
        }),
      })
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorKind(error === 'rate_limited' ? 'rate_limited' : 'generic')
        throw new Error(error ?? 'delivery_failed')
      }
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {
        /* the draft outliving the send is harmless */
      }
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  // If delivery breaks, the visitor's own mail app opens with the letter intact.
  // A lead that took someone two minutes to type should never die in a toast.
  const mailtoFallback = `mailto:${LINKS.email}?subject=${encodeURIComponent(
    form.name ? `Message from ${form.name}` : 'Message from your site'
  )}&body=${encodeURIComponent(`${form.message}\n\n— ${form.name} <${form.email}>`)}`

  // send choreography: body fades, window collapses to its title bar, corners burst
  useEffect(() => {
    if (status !== 'sent') return
    const win = windowRef.current
    const body = bodyRef.current
    const host = burstHostRef.current
    if (!win || !body || !host) return

    const rect = win.getBoundingClientRect()
    const hostRect = host.getBoundingClientRect()
    // What's left once the body goes: the title bar and the window's own border.
    const collapsed = rect.height - body.offsetHeight
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      body.style.display = 'none'
      return
    }

    win.style.height = `${rect.height}px`
    gsap.to(body, { opacity: 0, duration: 0.2 })
    gsap.to(win, {
      height: collapsed,
      duration: 0.4,
      delay: 0.15,
      ease: 'expo.inOut',
      onComplete: () => {
        // Collapsed means gone, as on the reduced path: an opacity-0 form left
        // in place still took focus and clicks under the title bar.
        body.style.display = 'none'
        const corners: [number, number][] = [
          [rect.left - hostRect.left, rect.top - hostRect.top],
          [rect.right - hostRect.left, rect.top - hostRect.top],
          [rect.left - hostRect.left, rect.top - hostRect.top + collapsed],
          [rect.right - hostRect.left, rect.top - hostRect.top + collapsed],
        ]
        corners.forEach(([x, y]) => burstFrom(x, y, host))
      },
    })
  }, [status])

  // The sent line takes focus as it appears, so a keyboard or screen-reader
  // visitor lands on the confirmation instead of inside a vanished form.
  useEffect(() => {
    if (status === 'sent') sentRef.current?.focus({ preventScroll: true })
  }, [status])

  useRevealOnScroll(sectionRef)

  const dynamics = dynamicsFor(form.message.length)
  const inlineInput =
    'inline-block bg-transparent font-mono text-base md:text-small text-ink-body placeholder:text-ink-faint border-b border-transparent focus:outline-hidden focus:border-white/40 focus-visible:border-white/60 min-w-0'

  return (
    <SectionShell ref={sectionRef} id="compose">
      <SectionHeader
        movement="compose"
        title={{ lead: 'Let’s', accent: 'Compose' }}
        intro={<>Got a project, an idea, or just want to talk shop? You&apos;re already writing the email.</>}
      />

      {/* Netlify's build-time form detection reads public/__forms.html, not this
          React tree — a form declared here never reaches the published HTML. */}

      <div ref={burstHostRef} data-reveal className="relative">
        {/* The email window IS the form */}
        <Panel ref={windowRef} hud className="mx-auto max-w-2xl overflow-hidden">
          <TerminalBar
            title={status === 'sent' ? 'message sent — 250 OK' : status === 'sending' ? 'sending…' : 'New Message'}
            live
            pulse={status === 'sent'}
          >
            <AnimatePresence>
              {savedAt && status === 'idle' && (
                <motion.span
                  key={savedAt}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="ml-auto font-mono text-label text-ink-meta"
                >
                  draft · saved {savedAt}
                </motion.span>
              )}
            </AnimatePresence>
          </TerminalBar>

          {/* the email body — every field is part of the letter */}
          {/* inert as soon as the message is sent: the form leaves the tab
              order at once, while it is still fading out */}
          <div ref={bodyRef} inert={status === 'sent'}>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {/* Honeypot. Hidden from people and from screen readers, irresistible to bots. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="compose-bot">Don&apos;t fill this out</label>
                <input
                  id="compose-bot"
                  name="bot-field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  onChange={(e) => { botField.current = e.target.value }}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-label text-ink-meta w-10 shrink-0">To:</span>
                <span className="font-mono text-small text-ink-body">{LINKS.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="compose-name" className="font-mono text-label text-ink-meta w-10 shrink-0">
                  From:
                </label>
                <input
                  id="compose-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your Name"
                  className={`${inlineInput} w-[38%]`}
                />
                <span aria-hidden="true" className="font-mono text-small text-ink-faint">&lt;</span>
                <input
                  id="compose-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  aria-label="Your email address"
                  className={`${inlineInput} flex-1`}
                />
                <span aria-hidden="true" className="font-mono text-small text-ink-faint">&gt;</span>
              </div>
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <span className="font-mono text-label text-ink-meta w-10 shrink-0">Subj:</span>
                <span className="font-mono text-small text-ink-body">
                  {form.name ? `Message from ${form.name}` : 'New message'}
                </span>
              </div>

              <div className="relative rounded-md focus-within:ring-1 focus-within:ring-white/40">
                <label htmlFor="compose-message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="compose-message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Dear Roman, …"
                  className="w-full bg-transparent font-body text-base md:text-small text-ink-body leading-relaxed placeholder:text-ink-faint focus:outline-hidden resize-none pt-2 max-h-[40vh]"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') e.currentTarget.form?.requestSubmit()
                  }}
                />
                {/* live dynamics marking — how loudly you're writing */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={dynamics.mark}
                    initial={{ opacity: 0, scale: 1.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute bottom-1 right-1 font-serif italic text-lg text-ink-faint pointer-events-none"
                    title={dynamics.word}
                  >
                    {dynamics.mark}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="font-mono text-label text-ink-meta">{form.name ? `— ${form.name}` : '— Your Name'}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {/* /resume is Roman's PIN-gated builder: a visitor who clicked "attach"
                    got a lock screen. Until the résumé is public, they ask for it. */}
                {RESUME_PDF_HREF ? (
                  <a
                    href={RESUME_PDF_HREF}
                    download
                    className="font-mono text-label text-ink-meta hover:text-white transition-colors"
                    onMouseEnter={() => setCursorVariant('hover')}
                    onMouseLeave={() => setCursorVariant('default')}
                  >
                    [ attach: resume.pdf ]
                  </a>
                ) : (
                  <a
                    href={RESUME_REQUEST}
                    className="font-mono text-label text-ink-meta hover:text-white transition-colors"
                    onMouseEnter={() => setCursorVariant('hover')}
                    onMouseLeave={() => setCursorVariant('default')}
                  >
                    [ request: resume.pdf ]
                  </a>
                )}
                <Button
                  variant="solid"
                  type="submit"
                  pending={status === 'sending'}
                  pendingLabel="Sending…"
                  disabled={status === 'sent'}
                  aria-label="Send message"
                >
                  <span aria-hidden="true">{modKey}↩</span> Send
                </Button>
              </div>
              {status === 'error' && (
                <p role="alert" className="flex gap-2 border-l border-spectrum-red pl-3 font-mono text-small text-ink-body">
                  <CircleAlert aria-hidden="true" size={14} className="mt-1 shrink-0 text-spectrum-red" />
                  <span>
                    {errorKind === 'rate_limited' ? (
                      <>That&apos;s a few messages in a row — give it ten minutes, or reach me at{' '}</>
                    ) : (
                      <>
                        Your draft is safe and still here.{' '}
                        <a href={mailtoFallback} className="text-white underline underline-offset-4">
                          Open it in your mail app
                        </a>{' '}
                        — or write to{' '}
                      </>
                    )}
                    <a href={`mailto:${LINKS.email}`} className="text-white underline underline-offset-4">
                      {LINKS.email}
                    </a>
                  </span>
                </p>
              )}
            </form>
          </div>
        </Panel>

        {/* post-send toast */}
        <AnimatePresence>
          {status === 'sent' && (
            <motion.p
              ref={sentRef}
              id="compose-sent"
              role="status"
              tabIndex={-1}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center font-mono text-small text-ink-body mt-6 outline-none"
            >
              {'𝄐 received — roman usually replies the same day.'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* email-signature footer strip: connect + location in one line */}
      <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-label text-ink-meta">
        <span className="text-ink-body">— R.K.</span>
        <span>Auburn, WA (PT)</span>
        <a
          href={LINKS.github}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white transition-colors py-2"
          onMouseEnter={() => setCursorVariant('hover')}
          onMouseLeave={() => setCursorVariant('default')}
        >
          <Github size={12} /> github
        </a>
        <a
          href={LINKS.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-white transition-colors py-2"
          onMouseEnter={() => setCursorVariant('hover')}
          onMouseLeave={() => setCursorVariant('default')}
        >
          <Linkedin size={12} /> linkedin
        </a>
        <a
          href={`mailto:${LINKS.email}`}
          className="flex items-center gap-1.5 hover:text-white transition-colors py-2"
          onMouseEnter={() => setCursorVariant('hover')}
          onMouseLeave={() => setCursorVariant('default')}
        >
          <Mail size={12} /> email
        </a>
        <CopyButton text={LINKS.email} />
      </div>

      <div className="mt-16 md:mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[10px] text-white/20">© {new Date().getFullYear()} Roman Kucheryavyy</p>
        <p className="font-mono text-[10px] text-white/25">Built with Next.js, Three.js, GSAP &amp; Tailwind</p>
      </div>
    </SectionShell>
  )
}
