'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Github, Linkedin, Mail } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import ScatterText from '@/components/effects/ScatterText'
import MobileReveal from '@/components/effects/MobileReveal'
import { LINKS } from '@/lib/constants'

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

export default function Compose() {
  const sectionRef = useRef<HTMLElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const burstHostRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // fake autosave tick — a draft always feels safer when something is watching it
  useEffect(() => {
    if (!form.name && !form.email && !form.message) return
    const t = setTimeout(() => setSavedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })), 800)
    return () => clearTimeout(t)
  }, [form])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'contact', ...form }).toString(),
      })
      if (!res.ok) throw new Error('Submission failed')
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  // send choreography: body fades, window collapses to its title bar, corners burst
  useEffect(() => {
    if (status !== 'sent') return
    const win = windowRef.current
    const body = bodyRef.current
    const host = burstHostRef.current
    if (!win || !body || !host) return

    const rect = win.getBoundingClientRect()
    const hostRect = host.getBoundingClientRect()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) {
      body.style.display = 'none'
      return
    }

    win.style.height = `${rect.height}px`
    gsap.to(body, { opacity: 0, duration: 0.2 })
    gsap.to(win, {
      height: 45,
      duration: 0.4,
      delay: 0.15,
      ease: 'expo.inOut',
      onComplete: () => {
        const corners: [number, number][] = [
          [rect.left - hostRect.left, rect.top - hostRect.top],
          [rect.right - hostRect.left, rect.top - hostRect.top],
          [rect.left - hostRect.left, rect.top - hostRect.top + 45],
          [rect.right - hostRect.left, rect.top - hostRect.top + 45],
        ]
        corners.forEach(([x, y]) => burstFrom(x, y, host))
      },
    })
  }, [status])

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.fromTo(
      sectionRef.current.querySelectorAll('[data-reveal]'),
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  const dynamics = dynamicsFor(form.message.length)
  const inlineInput =
    'inline-block bg-transparent font-mono text-base md:text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none border-b border-transparent focus:border-white/20 min-w-0'

  return (
    <section ref={sectionRef} id="compose" className="py-14 md:py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <p data-reveal className="section-label font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          {'// 05. Contact'}
        </p>
        <h2 data-section-heading className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          <ScatterText
            className="font-display font-bold"
            scatterRadius={500}
            duration={2}
            stagger={0.05}
            onAssembled={() => {
              const el = document.querySelector('#compose [data-section-heading]')
              if (el) el.innerHTML = 'Let’s <span class="text-gradient">Compose</span>'
            }}
          >
            {'Let’s Compose'}
          </ScatterText>
        </h2>
        <p data-reveal className="text-white/40 mb-10 md:mb-12 max-w-lg">
          Got a project, an idea, or just want to talk shop? You&apos;re already writing the email.
        </p>

        {/* Netlify Forms registration (build-time detection) */}
        <form name="contact" data-netlify="true" netlify-honeypot="bot-field" hidden>
          <input name="name" />
          <input name="email" />
          <textarea name="message" />
        </form>

        <MobileReveal>
          <div ref={burstHostRef} data-reveal className="relative">
            {/* The email window IS the form */}
            <div
              ref={windowRef}
              className="hud-corners rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden max-w-2xl mx-auto"
            >
              {/* title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-[#28c840]"
                  animate={status === 'sent' ? { scale: [1, 1.6, 1, 1.6, 1] } : {}}
                  transition={{ duration: 0.8 }}
                />
                <span className="ml-3 font-mono text-[10px] text-white/30" aria-live="polite">
                  {status === 'sent' ? 'message sent — 250 OK' : 'New Message'}
                </span>
                <AnimatePresence>
                  {savedAt && status === 'idle' && (
                    <motion.span
                      key={savedAt}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.5] }}
                      exit={{ opacity: 0 }}
                      className="ml-auto font-mono text-[9px] text-white/25"
                    >
                      draft · saved {savedAt}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* the email body — every field is part of the letter */}
              <div ref={bodyRef}>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  <input type="hidden" name="form-name" value="contact" />
                  <p className="hidden">
                    <label>
                      Don&apos;t fill this out: <input name="bot-field" />
                    </label>
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/25 w-10 shrink-0">To:</span>
                    <span className="font-mono text-[13px] text-white/50">{LINKS.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="compose-name" className="font-mono text-[10px] text-white/25 w-10 shrink-0">
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
                      onFocus={() => setCursorVariant('hidden')}
                      onBlur={() => setCursorVariant('default')}
                    />
                    <span className="font-mono text-[13px] text-white/25">&lt;</span>
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
                      onFocus={() => setCursorVariant('hidden')}
                      onBlur={() => setCursorVariant('default')}
                    />
                    <span className="font-mono text-[13px] text-white/25">&gt;</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <span className="font-mono text-[10px] text-white/25 w-10 shrink-0">Subj:</span>
                    <span className="font-mono text-[13px] text-white/50">
                      {form.name ? `Message from ${form.name}` : 'New message'}
                    </span>
                  </div>

                  <div className="relative">
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
                      className="w-full bg-transparent font-body text-base md:text-sm text-white/70 leading-relaxed placeholder:text-white/20 focus:outline-none resize-none pt-2 max-h-[40vh]"
                      onFocus={() => setCursorVariant('hidden')}
                      onBlur={() => setCursorVariant('default')}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') e.currentTarget.form?.requestSubmit()
                      }}
                    />
                    {/* live dynamics marking — how loudly you're writing */}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={dynamics.mark}
                        initial={{ opacity: 0, scale: 1.3 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-1 right-1 font-serif italic text-lg text-white/50 pointer-events-none"
                        title={dynamics.word}
                      >
                        {dynamics.mark}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <p className="font-mono text-[9px] text-white/35">{form.name ? `— ${form.name}` : '— Your Name'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <a
                      href="/resume"
                      className="font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      onMouseEnter={() => setCursorVariant('hover')}
                      onMouseLeave={() => setCursorVariant('default')}
                    >
                      [ attach: resume.pdf ]
                    </a>
                    <button
                      type="submit"
                      disabled={status === 'sending' || status === 'sent'}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 bg-white text-black hover:opacity-80"
                    >
                      {status === 'sending' ? 'Sending…' : '⌘↩ Send'}
                    </button>
                  </div>
                  {status === 'error' && (
                    <p aria-live="polite" className="font-mono text-[11px] text-white/45">
                      Something broke — email me directly at{' '}
                      <a href={`mailto:${LINKS.email}`} className="text-white/70 underline underline-offset-4">
                        {LINKS.email}
                      </a>
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* post-send toast */}
            <AnimatePresence>
              {status === 'sent' && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center font-mono text-[11px] text-white/45 mt-6"
                >
                  {'𝄐 received — roman usually replies the same day.'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </MobileReveal>

        {/* email-signature footer strip: connect + location in one line */}
        <MobileReveal delay={120}>
          <div data-reveal className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] text-white/35">
            <span className="text-white/50">— R.K.</span>
            <span>Auburn, WA (PT)</span>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white/70 transition-colors py-2"
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <Github size={12} /> github
            </a>
            <a
              href={LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white/70 transition-colors py-2"
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <Linkedin size={12} /> linkedin
            </a>
            <a
              href={`mailto:${LINKS.email}`}
              className="flex items-center gap-1.5 hover:text-white/70 transition-colors py-2"
              onMouseEnter={() => setCursorVariant('hover')}
              onMouseLeave={() => setCursorVariant('default')}
            >
              <Mail size={12} /> email
            </a>
          </div>
        </MobileReveal>

        <div className="mt-16 md:mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-white/20">© {new Date().getFullYear()} Roman Kucheryavyy</p>
          <p className="font-mono text-[10px] text-white/25">Built with Next.js, Three.js, GSAP &amp; Tailwind</p>
        </div>
      </div>
    </section>
  )
}
