'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { INTRO_FAILSAFE_MS, TALL_QUERY, introFiles } from './intro-gate'

/**
 * The Roman intro: kedhareswer/old-masters-preloader, staged as the home
 * page's prologue (Roman, on 2026-10-30: "this for my porfolio woudl be
 * sick, redesign it to like roman theme since my name is roman").
 *
 * When it shows: on / only, at most once every 12 hours per browser
 * (localStorage `rk:intro` holds when it last showed), never with a hash in
 * the address (a deep link such as /#contact goes straight there), never
 * under prefers-reduced-motion, never without scripts. `?intro` in the
 * query shows it regardless of the 12 hours.
 *
 * The decision is made before the first paint by INTRO_GATE (intro-gate.ts), an
 * inline script at the start of the home page's body (app/page.tsx). It
 * sets data-intro on <html>, and globals.css keeps the page hidden on the
 * intro's ground while the attribute is there, so the hero never flashes
 * before the intro. If the intro has not mounted 8 s later (a chunk that
 * never arrives), the script takes the attribute away and the page shows as
 * normal. The attribute is the one source of truth:
 *
 *   ""      decided, not yet mounted (the page is hidden)
 *   "up"    the intro is on screen (the page is hidden and inert)
 *   "lift"  the stage is lifting off (the page shows beneath it, still inert)
 *   absent  no intro, or it is over
 *
 * This file is the gate, the only part every visitor downloads: it reads the
 * attribute once on hydration and, when it says so, fetches the faces and
 * the cast and loads the stage itself (intro-stage.tsx, with the component)
 * with next/dynamic. Visitors without scripts, and anything that reads the
 * HTML, get the page as before: the server HTML only gains the script.
 */

/**
 * The cast's files, fetched as soon as the gate decides. Resolves once each
 * has arrived (or failed), or after `cap` ms, whichever is first: the stage
 * holds its count short of the end until then.
 */
function fetchCast(cap: number): Promise<void> {
  const each = introFiles(window.matchMedia(TALL_QUERY).matches).map(
    (src) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = img.onerror = () => resolve()
        img.src = src
      }),
  )
  return Promise.race([Promise.all(each).then(() => undefined), new Promise<void>((resolve) => window.setTimeout(resolve, cap))])
}

/**
 * If the stage's chunk fails to load, the page comes back at once (rather
 * than after the fail-safe's 8 s), and the failure stays here instead of
 * reaching the page's error boundary.
 */
function GiveBack({ onDone }: { cast: Promise<void>; onDone: () => void }) {
  useEffect(() => {
    const html = document.documentElement
    if (html.getAttribute('data-intro') === '') html.removeAttribute('data-intro')
    onDone()
  }, [onDone])
  return null
}

const IntroStage = dynamic(() => import('./intro-stage').catch(() => ({ default: GiveBack })), { ssr: false })

export function Intro() {
  const [cast, setCast] = useState<Promise<void> | null>(null)
  const done = useCallback(() => setCast(null), [])

  useEffect(() => {
    // Read once: the gate script decided before the first paint. Absent
    // means no intro (or the fail-safe already gave the page back).
    if (document.documentElement.getAttribute('data-intro') !== '') return
    // The faces' @font-face rules come with this import (preload is off; see
    // roman-type.ts), so a visit without the intro loads neither.
    import('./roman-type').then((m) => m.loadRomanFaces())
    setCast(fetchCast(INTRO_FAILSAFE_MS))
  }, [])

  if (!cast) return null
  return <IntroStage cast={cast} onDone={done} />
}
