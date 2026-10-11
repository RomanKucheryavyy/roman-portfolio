'use client'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Lock, LoaderCircle, CircleAlert } from 'lucide-react'
// Type only: the data itself carries the phone number and the case metrics,
// so it comes from /api/resume/data after the PIN, never from this bundle.
import type { ResumeData } from '@/lib/resume-data'
import { Button } from '@/components/ui/Button'

/**
 * The PIN, remembered across visits in localStorage. Read through
 * useSyncExternalStore: the server and the first client render see no PIN
 * (so hydration matches the prerendered gate), then the remembered one takes
 * over. A browser that blocks storage still unlocks, for this visit only.
 */
const PIN_KEY = 'resume_pin'
const pinListeners = new Set<() => void>()
let pinInMemory: string | null = null

const pinStore = {
  subscribe(listener: () => void) {
    pinListeners.add(listener)
    window.addEventListener('storage', listener)
    return () => {
      pinListeners.delete(listener)
      window.removeEventListener('storage', listener)
    }
  },
  get(): string | null {
    try {
      return localStorage.getItem(PIN_KEY)
    } catch {
      return pinInMemory
    }
  },
  set(pin: string | null) {
    pinInMemory = pin
    try {
      if (pin) localStorage.setItem(PIN_KEY, pin)
      else localStorage.removeItem(PIN_KEY)
    } catch {
      // Storage blocked: the in-memory copy above carries this visit.
    }
    pinListeners.forEach((listener) => listener())
  },
}

const noPin = () => null

/** The quiet way home from every state of the page. */
const BACK_LINK = 'inline-block mt-6 font-mono text-label text-ink-meta transition-colors hover:text-white'

/** An error line: a red mark, readable ink. Red text on black reads as decoration, not a message. */
function ErrorLine({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="inline-flex items-center gap-1.5 font-mono text-label text-ink-body">
      <CircleAlert size={14} className="shrink-0 text-spectrum-red" aria-hidden="true" />
      {children}
    </p>
  )
}

function PinGate({ onUnlock }: { onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const errorId = useId()

  // No focus on arrival. Taking it on mount put a keyboard user past the
  // skip link and the nav (Tab went from the field to "Back to portfolio"),
  // and started a screen reader at the field, past the heading and the
  // instruction that say what it is for. The page starts at its top like
  // every other route: Tab, "Skip to content", then Tab reaches the field.
  // Focus moves only in answer to the visitor: after a wrong PIN, back here.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4 || verifying) return
    setVerifying(true)
    setError(false)
    try {
      const res = await fetch('/api/resume/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) {
        onUnlock(pin)
      } else {
        setError(true)
        setPin('')
        inputRef.current?.focus()
      }
    } catch {
      setError(true)
      setPin('')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <main id="main" tabIndex={-1} className="min-h-svh bg-black flex items-center justify-center px-6 outline-none">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
          <Lock size={24} className="text-ink-meta" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Resume Builder</h1>
        <p className="text-ink-meta text-small mb-8">Enter your PIN to access</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="sr-only">
            PIN
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="••••••"
            aria-invalid={error || undefined}
            aria-describedby={error ? errorId : undefined}
            className={`w-full text-center text-2xl tracking-[0.5em] bg-transparent border-b-2 ${
              error ? 'border-spectrum-red' : 'border-white/20 focus:border-white/50'
            } pb-3 text-white font-mono placeholder:text-ink-faint outline-none transition-colors duration-300`}
            maxLength={8}
            autoComplete="off"
          />
          {error && (
            <div className="mt-3">
              <ErrorLine id={errorId}>Incorrect PIN</ErrorLine>
            </div>
          )}
          <Button
            type="submit"
            disabled={pin.length < 4}
            pending={verifying}
            pendingLabel="Verifying..."
            className="mt-8 w-full"
          >
            Unlock
          </Button>
        </form>
        <Link href="/" className={BACK_LINK}>
          ← Back to portfolio
        </Link>
      </div>
    </main>
  )
}

/** Between the PIN and the editor, while the résumé itself is fetched. */
function ResumeLoading({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <main id="main" tabIndex={-1} className="min-h-svh bg-black flex items-center justify-center px-6 outline-none">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <>
            <ErrorLine>{error}</ErrorLine>
            <Button onClick={onRetry} className="mt-8 w-full">
              Try again
            </Button>
          </>
        ) : (
          <p role="status" className="flex items-center justify-center gap-2 text-ink-meta text-small font-mono">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Loading your resume…
          </p>
        )}
        <Link href="/" className={BACK_LINK}>
          ← Back to portfolio
        </Link>
      </div>
    </main>
  )
}

// The builder's tools (tabs, fields, preview, Claude and the PDFs) are for
// whoever holds the PIN, so they load after it, alongside the résumé itself,
// instead of shipping to every visitor of this page.
const Builder = dynamic(() => import('./Builder'), {
  ssr: false,
  loading: () => <ResumeLoading error={null} onRetry={() => {}} />,
})

export default function ResumePage() {
  const pin = useSyncExternalStore(pinStore.subscribe, pinStore.get, noPin)
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  // Once there is a PIN (just entered, or remembered), fetch the résumé. A 401
  // means a remembered PIN has gone stale: forget it and ask again.
  useEffect(() => {
    if (!pin || resume) return
    let cancelled = false
    fetch('/api/resume/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          pinStore.set(null)
          return
        }
        if (!res.ok) {
          setLoadError(`Couldn't load your resume (${res.status}).`)
          return
        }
        const data: ResumeData = await res.json()
        if (!cancelled) setResume(data)
      })
      .catch(() => { if (!cancelled) setLoadError("Couldn't load your resume.") })
    return () => { cancelled = true }
  }, [pin, resume, loadAttempt])

  if (!pin) return <PinGate onUnlock={pinStore.set} />
  if (!resume) {
    return (
      <ResumeLoading
        error={loadError}
        onRetry={() => { setLoadError(null); setLoadAttempt((n) => n + 1) }}
      />
    )
  }

  return (
    <Builder
      pin={pin}
      resume={resume}
      setResume={setResume}
      onLock={() => pinStore.set(null)}
    />
  )
}
