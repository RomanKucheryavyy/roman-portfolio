'use client'
import { useEffect, useRef } from 'react'

const STAFF_YS = [8, 12, 16, 20, 24]
const NOTES: { x: number; y: number; kind: 'quarter' | 'eighth' | 'half' }[] = [
  { x: 8, y: 12, kind: 'quarter' },
  { x: 16, y: 20, kind: 'eighth' },
  { x: 24, y: 8, kind: 'quarter' },
  { x: 32, y: 16, kind: 'half' },
  { x: 40, y: 24, kind: 'eighth' },
  { x: 48, y: 12, kind: 'quarter' },
  { x: 56, y: 20, kind: 'eighth' },
  { x: 64, y: 8, kind: 'quarter' },
  { x: 72, y: 16, kind: 'half' },
  { x: 80, y: 24, kind: 'eighth' },
  { x: 88, y: 12, kind: 'quarter' },
  { x: 96, y: 20, kind: 'eighth' },
]

/**
 * Scroll progress as a musical staff: notes appear measure by measure as you
 * scroll, with a playhead that tracks position. Faint by default, clearer on
 * hover.
 */
export default function ScrollProgress() {
  const noteRefs = useRef<(SVGGElement | null)[]>([])
  const playheadRef = useRef<SVGLineElement>(null)
  const finaleRef = useRef<SVGGElement>(null)
  const lastProgress = useRef(-1)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (Math.abs(progress - lastProgress.current) < 0.005) return
      lastProgress.current = progress

      const visibleNotes = Math.floor(progress * NOTES.length)
      noteRefs.current.forEach((el, i) => {
        if (el) el.style.opacity = i < visibleNotes ? '1' : '0'
      })
      if (playheadRef.current) {
        playheadRef.current.setAttribute('x1', String(progress * 100))
        playheadRef.current.setAttribute('x2', String(progress * 100))
      }
      if (finaleRef.current) finaleRef.current.style.opacity = progress > 0.95 ? '1' : '0'
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full z-[150] group" aria-hidden="true">
      <svg
        viewBox="0 0 100 32"
        className="w-full h-3 transition-opacity duration-500 opacity-10 group-hover:opacity-40"
        preserveAspectRatio="none"
        fill="none"
      >
        {STAFF_YS.map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.3" />
        ))}
        <text x="1" y="20" fontSize="10" opacity="0.5" fontFamily="serif" fill="white">
          {'\u{1D11E}'}
        </text>
        {[25, 50, 75].map((x) => (
          <line key={x} x1={x} y1="8" x2={x} y2="24" stroke="white" strokeWidth="0.3" opacity="0.3" />
        ))}
        {NOTES.map((note, i) => (
          <g
            key={i}
            ref={(el) => { noteRefs.current[i] = el }}
            transform={`translate(${note.x}, ${note.y})`}
            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
          >
            <ellipse
              rx="1.5"
              ry="1"
              transform="rotate(-15)"
              fill={note.kind === 'half' ? 'none' : 'white'}
              stroke="white"
              strokeWidth="0.3"
            />
            <line x1="1.4" y1="0" x2="1.4" y2={note.kind === 'half' ? -7 : -6} stroke="white" strokeWidth="0.3" />
            {note.kind === 'eighth' && (
              <path d="M1.4,-6 Q3,-5 2.5,-3" stroke="white" strokeWidth="0.3" fill="none" />
            )}
          </g>
        ))}
        <line ref={playheadRef} x1="0" y1="4" x2="0" y2="28" stroke="white" strokeWidth="0.3" opacity="0.5" />
        <g ref={finaleRef} style={{ opacity: 0, transition: 'opacity 0.3s ease' }}>
          <line x1="98" y1="8" x2="98" y2="24" stroke="white" strokeWidth="0.3" />
          <line x1="99.5" y1="8" x2="99.5" y2="24" stroke="white" strokeWidth="0.6" />
        </g>
      </svg>
    </div>
  )
}
