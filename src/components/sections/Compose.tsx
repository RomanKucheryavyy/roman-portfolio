'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, Github, Linkedin, Mail, CheckCircle } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import ScatterText from '@/components/effects/ScatterText'
import MobileReveal from '@/components/effects/MobileReveal'
import { LINKS } from '@/lib/constants'

const FIELDS = ['name', 'email', 'message'] as const

export default function Compose() {
  const sectionRef = useRef<HTMLElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
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
      setForm({ name: '', email: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

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

  const sentAt = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <section ref={sectionRef} id="compose" className="py-24 px-6 md:px-16 relative z-10">
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
        <p data-reveal className="text-white/40 mb-12 max-w-lg">
          Got a project, an idea, or just want to talk shop? Drop a line — every message gets read, and the
          good ones get a reply the same day.
        </p>

        {/* Netlify Forms registration (build-time detection) */}
        <form name="contact" data-netlify="true" netlify-honeypot="bot-field" hidden>
          <input name="name" />
          <input name="email" />
          <textarea name="message" />
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <MobileReveal>
            <form onSubmit={handleSubmit} data-reveal className="space-y-8">
              <input type="hidden" name="form-name" value="contact" />
              <p className="hidden">
                <label>
                  Don&apos;t fill this out: <input name="bot-field" />
                </label>
              </p>
              {FIELDS.map((field) => (
                <div key={field}>
                  <label className="block font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">
                    {field}
                  </label>
                  {field === 'message' ? (
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/10 pb-3 text-white font-body placeholder:text-white/15 focus:outline-none focus:border-white/40 transition-colors duration-500 resize-none cursor-text"
                      placeholder="Tell me about your project..."
                      onFocus={() => setCursorVariant('hidden')}
                      onBlur={() => setCursorVariant('default')}
                    />
                  ) : (
                    <input
                      type={field === 'email' ? 'email' : 'text'}
                      required
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/10 pb-3 text-white font-body placeholder:text-white/15 focus:outline-none focus:border-white/40 transition-colors duration-500 cursor-text"
                      placeholder={field === 'name' ? 'Your name' : 'your@email.com'}
                      onFocus={() => setCursorVariant('hidden')}
                      onBlur={() => setCursorVariant('default')}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={status === 'sending' || status === 'sent'}
                  className="flex items-center gap-2 px-8 py-3 rounded-full font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 bg-white text-black hover:opacity-80"
                >
                  {status === 'sent' ? (
                    <>
                      <CheckCircle size={16} /> Sent
                    </>
                  ) : status === 'sending' ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send size={16} /> Send
                    </>
                  )}
                </button>
                {status === 'error' && (
                  <p aria-live="polite" className="font-mono text-xs text-white/40">
                    Something broke — email me at{' '}
                    <a href={`mailto:${LINKS.email}`} className="text-white/70 underline underline-offset-4">
                      {LINKS.email}
                    </a>
                  </p>
                )}
              </div>
            </form>
          </MobileReveal>

          <MobileReveal delay={150}>
            <div data-reveal className="space-y-6">
              {/* Live email preview */}
              <div className="rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-[10px] text-white/20">New Message</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/25 w-10">To:</span>
                    <span className="font-mono text-[11px] text-white/50">{LINKS.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/25 w-10">From:</span>
                    <span className="font-mono text-[11px] text-white/50">{form.email || 'your@email.com'}</span>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <span className="font-mono text-[10px] text-white/25 w-10">Subj:</span>
                    <span className="font-mono text-[11px] text-white/50">
                      {form.name ? `Message from ${form.name}` : 'New message'}
                    </span>
                  </div>
                  <div className="min-h-[120px] pt-2">
                    {form.message ? (
                      <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{form.message}</p>
                    ) : (
                      <p className="text-sm text-white/15 italic">Your message will appear here as you type...</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <p className="font-mono text-[9px] text-white/15">{form.name ? `— ${form.name}` : '— Your Name'}</p>
                    <p className="font-mono text-[9px] text-white/10 mt-1">Sent at {sentAt} via romankucheryavyy.com</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
                <h3 className="font-mono text-[10px] text-white/25 uppercase tracking-wider mb-3">Connect</h3>
                {[
                  { href: LINKS.github, icon: Github, label: 'GitHub' },
                  { href: LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
                  { href: `mailto:${LINKS.email}`, icon: Mail, label: 'Email' },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white/40 hover:text-white transition-colors py-1.5 cursor-pointer"
                    onMouseEnter={() => setCursorVariant('hover')}
                    onMouseLeave={() => setCursorVariant('default')}
                  >
                    <Icon size={14} /> <span className="text-sm">{label}</span>
                  </a>
                ))}
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
                <h3 className="font-mono text-[10px] text-white/25 uppercase tracking-wider mb-2">Location</h3>
                <p className="text-white text-sm">Auburn, WA</p>
                <p className="text-white/30 text-xs mt-1">Pacific Time (UTC-8)</p>
              </div>
            </div>
          </MobileReveal>
        </div>

        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-white/20">© {new Date().getFullYear()} Roman Kucheryavyy</p>
          <p className="font-mono text-[10px] text-white/10">Built with Next.js, Three.js, GSAP &amp; Tailwind</p>
        </div>
      </div>
    </section>
  )
}
