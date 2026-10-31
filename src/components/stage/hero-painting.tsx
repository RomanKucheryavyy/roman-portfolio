'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { CAST } from './cast'
import { savesData } from './intro-gate'

/**
 * The hero's painting: the intro's Old Masters staging
 * (old-masters-preloader) behind the name, on the violet curtain (Roman, on
 * 2026-10-31, of the new hero: "love it but the hero can still have the
 * painting thingy", then "make it epic"). The composition and the look are
 * hero-painting-stage.tsx's; this is the box, and when it plays.
 *
 * Decoration only: aria-hidden and inert, so nothing in it is read, takes
 * focus or catches the pointer (the curtain beneath still answers the
 * pointer). The hero's words are the page's, in its server HTML.
 *
 * It loads after the page: the stage, the component and the statue are
 * fetched once the browser is idle after hydration (next/dynamic, no server
 * render), so the name is the first paint and the largest. The box is
 * absolute over the whole hero from the start, so nothing moves when the
 * painting lands; the stage fades it in. It runs only while the hero is on
 * screen and the intro is not: while the intro is up (data-intro on <html>,
 * intro.tsx) it waits (the intro fetches the component itself, and on a
 * wide screen Hercules too), and mounts once the intro has lifted off, so
 * the visitor sees Hercules rise onto the page the intro has just revealed
 * and the two stages never draw at once; once the hero has left the screen
 * the stage unmounts (the component's light and frame loops stop with it),
 * and it comes back when the hero does.
 *
 * Never at all (the hero is then the name on the curtain, as before) for a
 * browser that asks to save data or reports a 2G connection (the intro's
 * own test: the stage and the statue are about 300 KB more), nor for one
 * with no WebGL: there the curtain is its flat ground, and the painting's
 * full-hero light, a canvas drawn every frame and blended over the hero,
 * would fall to a processor that cannot spare it (about 7 frames a second
 * at 1440 wide, against 60 without it).
 *
 * If the stage's chunk fails to load (a deploy that replaced it, a broken
 * connection, a blocker), the painting is simply not there: the failure
 * stays here instead of reaching the page's error boundary, as intro.tsx
 * does for its own stage.
 */

const HeroPaintingStage = dynamic(() => import('./hero-painting-stage').catch(() => ({ default: () => null })), { ssr: false })

/** Idle, or this long after hydration at the latest. */
const IDLE_TIMEOUT_MS = 1500

/** No intro on screen (none at all, or it has lifted off entirely). */
const introClear = () => !document.documentElement.hasAttribute('data-intro')

/** Whether this browser draws WebGL at all (the curtain's own test); the probe's context is let go at once. */
function drawsWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch {
    return false
  }
}

export function HeroPainting() {
  const ref = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let idle = false
    let inView = false
    let clear = introClear()
    const update = () => setLive(idle && inView && clear)
    const watch = new IntersectionObserver((entries) => {
      // The last entry is the box's current state.
      inView = entries[entries.length - 1].isIntersecting
      update()
    })
    const intro = new MutationObserver(() => {
      clear = introClear()
      update()
    })
    intro.observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] })
    watch.observe(el)
    const done = () => {
      // Asked once, when the browser is idle: nothing more happens for a
      // browser that saves data, or one without WebGL.
      if (savesData() || !drawsWebGL()) {
        watch.disconnect()
        intro.disconnect()
        return
      }
      idle = true
      // The statue starts on its way with the stage's code, not after it.
      // (While the intro is up it is already fetching both, and nothing
      // here should compete with it.)
      if (clear) new Image().src = CAST.hercules.src
      update()
    }
    // Safari has no requestIdleCallback: a timeout stands in.
    const ric = typeof window.requestIdleCallback === 'function'
    const id = ric ? window.requestIdleCallback(done, { timeout: IDLE_TIMEOUT_MS }) : window.setTimeout(done, 200)
    return () => {
      watch.disconnect()
      intro.disconnect()
      if (ric) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden="true" inert data-hero-painting="" className="pointer-events-none absolute inset-0">
      {live ? <HeroPaintingStage /> : null}
    </div>
  )
}
