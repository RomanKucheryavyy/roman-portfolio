'use client'
import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/hooks/useGSAP'

interface Week {
  start: string
  count: number
}

interface ContributionData {
  total: number | null
  approximate: boolean
  weeks: Week[]
}

const STAFF_YS = [12, 20, 28, 36, 44]
// pitch (y) and note kind by activity quintile — busier weeks sit higher and subdivide
const QUINTILES: { y: number; kind: 'quarter' | 'eighth' | 'sixteenth' }[] = [
  { y: 44, kind: 'quarter' },
  { y: 36, kind: 'quarter' },
  { y: 28, kind: 'eighth' },
  { y: 20, kind: 'eighth' },
  { y: 12, kind: 'sixteenth' },
]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const X0 = 34
const STEP = 15.5

/**
 * "A Year in Measures" — the past year of GitHub commits rendered as sheet
 * music. Each week is a note: busier weeks sit higher on the staff and
 * subdivide from quarter to sixteenth. Silent weeks rest.
 */
export default function YearInMeasures() {
  const [data, setData] = useState<ContributionData | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/contributions')
      .then((r) => r.json())
      .then((d: ContributionData) => {
        // A sparse staff reads as silence, not music — only perform with a real year.
        // (Public calendar needs "include private contributions" enabled to count
        // private work; until then this section sits out.)
        if (d.weeks?.length && (d.total === null || d.total >= 50)) setData(d)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !data) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const notes = wrap.querySelectorAll('[data-week-note]')
    const tween = gsap.fromTo(
      notes,
      { opacity: 0, scale: 0.3, transformOrigin: 'center' },
      {
        opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.012,
        scrollTrigger: { trigger: wrap, start: 'top 85%', once: true },
      }
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [data])

  if (!data) return null

  const { weeks, total } = data
  const max = Math.max(...weeks.map((w) => w.count), 1)
  const width = X0 + weeks.length * STEP + 24

  let lastMonth = -1

  return (
    <div ref={wrapRef} className="mt-8 rounded-xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="font-mono text-[10px] text-white/25 uppercase tracking-wider">
          {'// git log --since="1 year ago"'}
        </p>
        {total !== null && (
          <p className="font-mono text-[10px] text-white/30">{total.toLocaleString()} contributions</p>
        )}
      </div>
      <h3 className="px-5 pt-1 font-display text-lg font-bold text-white">
        A Year in <span className="text-gradient">Measures</span>
      </h3>
      <div className="overflow-x-auto mobile-scroll-hide px-5 pb-4 pt-2">
        <svg
          viewBox={`0 0 ${width} 68`}
          style={{ minWidth: Math.max(640, width * 0.8), width: '100%' }}
          fill="none"
          role="img"
          aria-label={`GitHub contribution activity for the past year rendered as musical notation${total !== null ? `: ${total} contributions` : ''}`}
        >
          {STAFF_YS.map((y) => (
            <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
          ))}
          <text x="4" y="38" fontSize="26" fill="rgba(255,255,255,0.35)" fontFamily="serif">
            {'\u{1D11E}'}
          </text>

          {weeks.map((week, i) => {
            const x = X0 + i * STEP
            const d = new Date(`${week.start}T00:00:00Z`)
            const month = d.getUTCMonth()
            const monthChanged = month !== lastMonth
            lastMonth = month

            const elements = []
            if (monthChanged && i > 0) {
              elements.push(
                <g key={`bar-${week.start}`}>
                  <line x1={x - STEP / 2} y1="12" x2={x - STEP / 2} y2="44" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                  <text x={x - STEP / 2} y="58" fontSize="6" fill="rgba(255,255,255,0.25)" fontFamily="monospace" textAnchor="middle">
                    {MONTHS[month]}
                  </text>
                </g>
              )
            }

            if (week.count > 0) {
              const quintile = Math.min(4, Math.floor((week.count / max) * 5))
              const { y, kind } = QUINTILES[quintile]
              elements.push(
                <g key={week.start} data-week-note style={{ opacity: 0 }}>
                  <title>{`Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} — ${week.count} contribution${week.count === 1 ? '' : 's'}`}</title>
                  <g transform={`translate(${x}, ${y})`}>
                    <ellipse rx="3" ry="2.1" transform="rotate(-15)" fill="rgba(255,255,255,0.55)" />
                    <line x1="2.8" y1="-1" x2="2.8" y2="-13" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" />
                    {(kind === 'eighth' || kind === 'sixteenth') && (
                      <path d="M2.8,-13 Q7,-11 5.5,-6.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" fill="none" />
                    )}
                    {kind === 'sixteenth' && (
                      <path d="M2.8,-10 Q7,-8 5.5,-3.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" fill="none" />
                    )}
                  </g>
                </g>
              )
            }
            return elements
          })}

          <line x1={width - 14} y1="12" x2={width - 14} y2="44" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
          <line x1={width - 10} y1="12" x2={width - 10} y2="44" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
        </svg>
      </div>
      <p className="px-5 pb-4 font-mono text-[9px] text-white/15">
        Every week of GitHub activity is a note — busier weeks play higher and faster. Rests are real rests.
      </p>
    </div>
  )
}
