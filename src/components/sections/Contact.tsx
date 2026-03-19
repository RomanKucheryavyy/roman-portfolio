'use client'
import { useRef, useState, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { submitContact } from '@/lib/supabase'
import { sanitize } from '@/lib/sanitize'
import MagneticButton from '@/components/ui/MagneticButton'
import { Send, Github, Linkedin, Mail, CheckCircle } from 'lucide-react'
import { LINKS } from '@/lib/constants'

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      const clean = { name: sanitize(form.name), email: sanitize(form.email), message: sanitize(form.message) }
      const { error } = await submitContact(clean)
      if (error) throw error
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch { setStatus('error') }
  }

  useEffect(() => {
    if (!sectionRef.current) return
    const els = sectionRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(els,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  return (
    <section ref={sectionRef} id="contact" className="py-24 px-6 md:px-16 relative z-10">
      <div className="max-w-4xl mx-auto">
        <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
          // 04. Contact
        </p>
        <h2 data-reveal className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
          Let&apos;s <span className="text-gradient">Compose</span>
        </h2>
        <p data-reveal className="text-white/40 mb-12 max-w-lg">
          Have a project in mind? Drop a note — I read every message.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} data-reveal className="lg:col-span-3 space-y-8">
            {['name', 'email', 'message'].map((field) => (
              <div key={field}>
                <label className="block font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">
                  {field}
                </label>
                {field === 'message' ? (
                  <textarea
                    required rows={4}
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white font-body placeholder:text-white/15 focus:outline-none focus:border-white/40 transition-colors duration-500 resize-none cursor-text"
                    placeholder="Tell me about your project..."
                    onFocus={() => setCursorVariant('hidden')}
                    onBlur={() => setCursorVariant('default')}
                  />
                ) : (
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    required
                    value={form[field as 'name' | 'email']}
                    onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-transparent border-b border-white/10 pb-3 text-white font-body placeholder:text-white/15 focus:outline-none focus:border-white/40 transition-colors duration-500 cursor-text"
                    placeholder={field === 'name' ? 'Your name' : 'your@email.com'}
                    onFocus={() => setCursorVariant('hidden')}
                    onBlur={() => setCursorVariant('default')}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={status === 'sending' || status === 'sent'}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer disabled:opacity-50 bg-white text-black hover:opacity-80"
            >
              {status === 'sent' ? <><CheckCircle size={16} /> Sent</> : status === 'sending' ? 'Sending...' : <><Send size={16} /> Send</>}
            </button>
          </form>

          {/* Sidebar */}
          <div data-reveal className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-xl border border-white/5 bg-[#0a0a0a]">
              <h3 className="font-mono text-[10px] text-white/25 uppercase tracking-wider mb-3">Connect</h3>
              {[
                { href: LINKS.github, icon: Github, label: 'GitHub' },
                { href: LINKS.linkedin, icon: Linkedin, label: 'LinkedIn' },
                { href: `mailto:${LINKS.email}`, icon: Mail, label: 'Email' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label} href={href} target="_blank" rel="noopener noreferrer"
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
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-white/20">
            &copy; {new Date().getFullYear()} Roman Kucheryavyy
          </p>
          <p className="font-mono text-[10px] text-white/10">
            Built with Next.js, Three.js, GSAP & Tailwind
          </p>
        </div>
      </div>
    </section>
  )
}
