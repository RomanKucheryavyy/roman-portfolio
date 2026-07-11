'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * The standard 4/4 conducting diagram — down, inside, outside, up — engraved
 * faintly behind the hero name, with a baton-tip light tracing it in tempo
 * (♩ = 128), accelerating into each ictus the way a real baton does.
 * Reduced motion renders the pattern static with textbook beat numbers.
 */

// Ictus points: 1 bottom-center, 2 rebound left, 3 outside right, 4 up
const PATH_D =
  'M 200 60 C 205 130, 202 190, 200 235 C 175 245, 148 215, 140 190 C 165 165, 240 170, 275 185 C 260 130, 230 90, 210 60'
const BEAT_MS = 60000 / 128 // ♩ = 128
const ICTUS = [
  { n: 1, x: 200, y: 235 },
  { n: 2, x: 140, y: 190 },
  { n: 3, x: 275, y: 185 },
  { n: 4, x: 210, y: 60 },
]

export default function BeatPattern() {
  const pathRef = useRef<SVGPathElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)
  const trail1Ref = useRef<SVGCircleElement>(null)
  const trail2Ref = useRef<SVGCircleElement>(null)
  const wrapRef = useRef<SVGSVGElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduced) return
    const path = pathRef.current
    const wrap = wrapRef.current
    if (!path || !wrap) return

    const total = path.getTotalLength()
    let raf = 0
    let running = false
    const t0 = performance.now()

    const place = (el: SVGCircleElement | null, progress: number) => {
      if (!el) return
      const p = path.getPointAtLength(Math.max(0, Math.min(1, progress)) * total)
      el.setAttribute('cx', String(p.x))
      el.setAttribute('cy', String(p.y))
    }

    const tick = (now: number) => {
      const barPhase = ((now - t0) % (BEAT_MS * 4)) / (BEAT_MS * 4)
      const beat = Math.floor(barPhase * 4)
      const frac = barPhase * 4 - beat
      // accelerate into the ictus
      const eased = frac * frac
      const progress = (beat + eased) / 4
      place(tipRef.current, progress)
      place(trail1Ref.current, progress - 0.015)
      place(trail2Ref.current, progress - 0.03)
      raf = requestAnimationFrame(tick)
    }

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }

    const io = new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop() }, { threshold: 0 })
    io.observe(wrap)

    return () => {
      stop()
      io.disconnect()
    }
  }, [reduced])

  return (
    <svg
      ref={wrapRef}
      viewBox="0 0 400 300"
      className="absolute inset-0 m-auto w-[min(80vw,560px)] h-auto pointer-events-none opacity-10 z-[3]"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="beat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff2d55" />
          <stop offset="25%" stopColor="#ffb800" />
          <stop offset="50%" stopColor="#30d158" />
          <stop offset="75%" stopColor="#5ac8fa" />
          <stop offset="100%" stopColor="#af52de" />
        </linearGradient>
      </defs>
      <path ref={pathRef} d={PATH_D} stroke="url(#beat-grad)" strokeWidth="1" strokeLinecap="round" />
      {ICTUS.map((p) => (
        <circle key={p.n} cx={p.x} cy={p.y} r="2.5" fill="rgba(255,255,255,0.6)" />
      ))}
      {reduced ? (
        ICTUS.map((p) => (
          <text
            key={p.n}
            x={p.x + 10}
            y={p.y + 4}
            fontSize="11"
            fontFamily="monospace"
            fill="rgba(255,255,255,0.5)"
          >
            {p.n}
          </text>
        ))
      ) : (
        <>
          <circle ref={trail2Ref} r="1.5" fill="rgba(255,255,255,0.25)" />
          <circle ref={trail1Ref} r="2" fill="rgba(255,255,255,0.45)" />
          <circle ref={tipRef} r="3" fill="#ffffff" />
        </>
      )}
    </svg>
  )
}
