'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { CAST } from './cast'
import { savesData } from './intro-gate'

/**
 * The hero's painting: the intro's Old Masters print (old-masters-preloader)
 * on the hero's page, Hercules standing in it with the blurred David behind
 * (Roman, 2026-10-31: "the hero can still have the painting thingy"; and on
 * 2026-11-01, of the curtain it stood on: "i like the roman theme better").
 * The composition and the look are hero-painting-stage.tsx's; this is the
 * box, and when it plays.
 *
 * Decoration only: aria-hidden and inert, so nothing in it is read, takes
 * focus or catches the pointer. The hero's words and its print's ground
 * (the flood, the vignette, the grain) are the page's, in its server HTML.
 *
 * It loads after the page: the stage, the component and the two photographs
 * are fetched once the browser is idle after hydration (next/dynamic, no
 * server render), so the name is the first paint and the largest. The box
 * is absolute over the whole hero from the start, so nothing moves when the
 * painting lands; the stage fades it in. It runs only while the hero is on
 * screen and the intro is not: while the intro is up (data-intro on <html>,
 * intro.tsx) it waits (the intro fetches the component itself, and the
 * David, and on a wide screen Hercules too), and mounts once the intro has
 * lifted off, so the visitor sees Hercules rise onto the page the intro has
 * just revealed and the two stages never draw at once; once the hero has
 * left the screen the stage unmounts (the component's frame loop stops with
 * it), and it comes back when the hero does.
 *
 * Never at all (the hero is then its print's ground and its words) for a
 * browser that asks to save data or reports a 2G connection (the intro's
 * own test: the stage and the photographs are about 200 KB more), nor for
 * one with no WebGL, the sign of a machine drawing every frame in software,
 * where a full-screen blended print beneath the page would take frames the
 * page needs.
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

/** Whether this browser draws WebGL at all; the probe's context is let go at once. */
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
      // The photographs start on their way with the stage's code, not after
      // it. (While the intro is up it is already fetching what it needs, and
      // nothing here should compete with it.)
      if (clear) for (const photo of [CAST.hercules, CAST.david]) new Image().src = photo.src
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
