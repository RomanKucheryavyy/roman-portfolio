'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { onLenis } from '@/lib/lenis'
import { MOVEMENTS, NUMBERED, keyColor } from '@/lib/score'
import { useStore } from '@/stores/useStore'

/** The five staff lines, in a 32-unit-tall staff. */
const STAFF_YS = [8, 12, 16, 20, 24]
/** Each movement's note sits one step (a line or a space) above the last: the score climbs in order. */
const NOTE_YS = [22, 20, 18, 16, 14]
const pct = (units: number) => `${(units / 32) * 100}%`

/** Where each movement after the hero starts, as a fraction of the scrollable height. */
type Starts = Partial<Record<string, number>>

function measureStarts(): Starts {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const starts: Starts = {}
  for (const { id } of MOVEMENTS) {
    if (id === 'hero') continue
    const el = document.getElementById(id)
    if (!el) continue
    const top = el.getBoundingClientRect().top + window.scrollY
    starts[id] = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0
  }
  return starts
}

const sameStarts = (a: Starts, b: Starts) => {
  const keys = Object.keys(b)
  return keys.length === Object.keys(a).length && keys.every((k) => Math.abs((a[k] ?? -1) - (b[k] ?? -1)) < 0.0005)
}

/**
 * Scroll progress as a staff, drawn only from data (the notation rule): a
 * barline where each movement really starts, one note per numbered movement
 * in its key, filled once the playhead has passed it and ringed while it is
 * the one being read, a playhead at the scroll position, and the double
 * barline at the end of the piece.
 *
 * It used to draw twelve notes at hard-coded positions and barlines at 25,
 * 50 and 75%, none of which had anything to do with where a section began.
 */
export default function ScrollProgress() {
  const [starts, setStarts] = useState<Starts>({})
  const activeSection = useStore((s) => s.activeSection)
  const playheadRef = useRef<HTMLDivElement>(null)
  const noteRefs = useRef(new Map<string, HTMLSpanElement>())
  const startsRef = useRef<Starts>({})

  // The barlines: re-measured whenever the page changes size (sections mount
  // after hydration, images and fonts arrive late) and once everything has loaded.
  useEffect(() => {
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const next = measureStarts()
        startsRef.current = next
        setStarts((prev) => (sameStarts(prev, next) ? prev : next))
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('load', measure)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('load', measure)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(frame)
    }
  }, [])

  // The playhead: Lenis's own progress while Lenis runs, one passive scroll
  // listener when it doesn't (reduced motion).
  useEffect(() => {
    const paint = (progress: number) => {
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${progress * 100}%)`
      for (const [id, el] of noteRefs.current) {
        const start = startsRef.current[id]
        el.dataset.passed = String(start !== undefined && progress + 0.0005 >= start)
      }
    }
    const native = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    let stop = () => {}
    const unsubscribe = onLenis((lenis) => {
      stop()
      if (lenis) {
        stop = lenis.on('scroll', () => paint(lenis.progress))
        paint(lenis.progress)
      } else {
        let frame = 0
        const onScroll = () => {
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(() => paint(native()))
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        stop = () => {
          window.removeEventListener('scroll', onScroll)
          cancelAnimationFrame(frame)
        }
        paint(native())
      }
    })
    return () => {
      unsubscribe()
      stop()
    }
  }, [starts])

  return (
    <div className="fixed top-0 left-0 w-full z-[150] group" aria-hidden="true">
      <div className="relative w-full h-4 md:h-3 transition-opacity duration-500 opacity-30 md:opacity-40 md:group-hover:opacity-70">
        <svg viewBox="0 0 100 32" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" fill="none">
          {STAFF_YS.map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.3" />
          ))}
          <text x="1" y="20" fontSize="10" opacity="0.5" fontFamily="serif" fill="white">
            {'\u{1D11E}'}
          </text>
        </svg>

        {MOVEMENTS.map(({ id }) =>
          starts[id] === undefined ? null : (
            <span
              key={id}
              data-barline={id}
              className="absolute w-px bg-white/40"
              style={{ left: `${starts[id]! * 100}%`, top: pct(8), height: pct(16) }}
            />
          ),
        )}

        {NUMBERED.map(({ id, key }, i) =>
          starts[id] === undefined ? null : (
            <span
              key={id}
              ref={(el) => {
                if (el) noteRefs.current.set(id, el)
                else noteRefs.current.delete(id)
              }}
              data-note={id}
              data-passed="false"
              className="absolute h-[4px] w-[6px] -translate-y-1/2 -rotate-[15deg] rounded-full border transition-colors duration-300 bg-transparent data-[passed=true]:bg-(--key)"
              style={
                {
                  '--key': keyColor(key),
                  borderColor: keyColor(key),
                  left: `calc(${starts[id]! * 100}% + 4px)`,
                  top: pct(NOTE_YS[i]),
                  outline: activeSection === id ? `1px solid ${keyColor(key)}` : 'none',
                  outlineOffset: '1.5px',
                } as CSSProperties
              }
            />
          ),
        )}

        {/* The double barline: the end of the piece. */}
        <span className="absolute right-[3px] w-px bg-white/60" style={{ top: pct(8), height: pct(16) }} />
        <span className="absolute right-0 w-[2px] bg-white/60" style={{ top: pct(8), height: pct(16) }} />

        <div ref={playheadRef} className="absolute inset-0 will-change-transform">
          <span className="absolute left-0 w-px bg-white/50" style={{ top: pct(4), height: pct(24) }} />
        </div>
      </div>
    </div>
  )
}
