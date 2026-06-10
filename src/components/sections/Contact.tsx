'use client'
import { useState } from 'react'
import { Send, Github, Linkedin, Mail, CheckCircle } from 'lucide-react'
import Reveal from '@/components/Reveal'
import SectionHeader from '@/components/SectionHeader'
import { submitContact } from '@/lib/supabase'
import { LINKS } from '@/lib/constants'

const clean = (value: string, max: number) => value.trim().slice(0, max)

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending' || status === 'sent') return
    // Honeypot: real visitors never see or fill this field
    if (form.company) {
      setStatus('sent')
      return
    }
    setStatus('sending')
    try {
      const { error } = await submitContact({
        name: clean(form.name, 200),
        email: clean(form.email, 200),
        message: clean(form.message, 2000),
      })
      if (error) throw error
      setStatus('sent')
      setForm({ name: '', email: '', message: '', company: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-line bg-card/60 px-4 py-3 text-sm text-cream placeholder:text-cream/25 transition-colors focus:border-amber/60 focus:outline-none'

  return (
    <section id="contact" className="border-t border-line px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <SectionHeader
          index="04"
          kicker="Contact"
          title="Get in touch"
          sub="Have a project in mind, or just want to talk shop? Drop a note — I read every message."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-cream/45">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-cream/45">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-cream/45">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  placeholder="Tell me about your project..."
                />
              </div>
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={status === 'sending' || status === 'sent'}
                  className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 font-mono text-sm font-semibold text-ink transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {status === 'sent' ? (
                    <>
                      <CheckCircle size={15} aria-hidden="true" /> Sent — thank you
                    </>
                  ) : status === 'sending' ? (
                    'Sending…'
                  ) : (
                    <>
                      <Send size={15} aria-hidden="true" /> Send message
                    </>
                  )}
                </button>
                <p aria-live="polite" className="text-sm text-cream/45">
                  {status === 'error' && (
                    <>
                      Something went wrong — email me at{' '}
                      <a href={`mailto:${LINKS.email}`} className="text-amber underline-offset-4 hover:underline">
                        {LINKS.email}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </form>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-card/60 p-5">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-cream/40">Connect</h3>
                <ul className="mt-3 space-y-1">
                  {[
                    { href: LINKS.github, icon: Github, label: 'GitHub' },
                    { href: LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
                    { href: `mailto:${LINKS.email}`, icon: Mail, label: LINKS.email },
                  ].map(({ href, icon: Icon, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 py-1.5 text-sm text-cream/60 transition-colors hover:text-amber"
                      >
                        <Icon size={15} aria-hidden="true" /> {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-line bg-card/60 p-5">
                <h3 className="font-mono text-[11px] uppercase tracking-wider text-cream/40">Location</h3>
                <p className="mt-3 text-sm text-cream/75">Auburn, WA</p>
                <p className="mt-1 text-xs text-cream/40">Pacific Time (UTC−8)</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
