'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { DISPLAY, INTRO, KICKER, NUMERAL } from './look'

/**
 * The one section header, so every act reads as a chapter of one book: the
 * act's numeral in gold Cinzel, set large and alone as the chapter mark,
 * then the kicker in Geist capitals, the title (an h2) in Cinzel, and an
 * optional intro in Cormorant italic. No rules: the type is the ornament,
 * and space separates the parts.
 *
 * `act` is the act as words ("Act II"): its numeral is drawn, and "Act"
 * stays for screen readers, so the first line still reads "Act II, Client
 * work".
 *
 * Its entrance (reveal.ts) loads after the page, and plays once, only for
 * a header that starts below the screen; the server's HTML is the finished
 * header, so without scripts, under reduced motion, or before it loads, it
 * stands whole.
 */
export function SectionHeader({
  id,
  act,
  kicker,
  title,
  intro,
  className,
}: {
  id: string
  act: string
  kicker: string
  title: React.ReactNode
  intro?: React.ReactNode
  className?: string
}) {
  const [, word, numeral] = act.match(/^(\S+)\s+(\S+)$/) ?? [act, '', act]
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let stop = () => {}
    let gone = false
    import('./reveal').then(
      (m) => {
        if (!gone && ref.current) stop = m.arm(ref.current)
      },
      // Its code failing to load leaves the header as it stands.
      () => {},
    )
    return () => {
      gone = true
      stop()
    }
  }, [])
  return (
    <div ref={ref} className={cn('max-w-4xl', className)}>
      <p>
        <span data-reveal="numeral" className={NUMERAL}>
          {word ? <span className="sr-only">{word} </span> : null}
          {numeral}
        </span>
        <span className="sr-only">, </span>
        <span data-reveal="kicker" className={`mt-4 block md:mt-5 ${KICKER}`}>
          {kicker}
        </span>
      </p>
      <h2 id={id} data-reveal="title" className={`mt-4 md:mt-5 ${DISPLAY}`}>
        {title}
      </h2>
      {intro ? (
        <p data-reveal="intro" className={`mt-5 ${INTRO}`}>
          {intro}
        </p>
      ) : null}
    </div>
  )
}

/** The page column, aligned with the About block's own 1280px container. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-4 md:px-12', className)}>{children}</div>
}
