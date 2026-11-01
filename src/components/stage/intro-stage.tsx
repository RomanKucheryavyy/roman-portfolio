'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import OldMastersPreloader, { omSimulated } from '@/components/ui/old-masters-preloader'
import { CERTIFICATIONS, PERSON, PROJECTS, ROLES } from '@/lib/content'
import { toRoman } from '@/lib/roman'
import { CAST, pastEdge } from './cast'
import { IMPERIAL, WORD_HALO } from './imperial'
import { INTRO_FIGURES, INTRO_KEY, TALL_QUERY } from './intro-gate'
import { ROMAN_FONTS } from './roman-type'
import { SECTIONS } from './top-bar'

/**
 * The intro's stage (loaded by the gate in intro.tsx, only when the intro
 * shows): old-masters-preloader in a portal on <body>, a modal dialog above
 * everything (the top bar and the skip link included), over the real page.
 *
 * While it is up every other child of <body> is inert and the document does
 * not scroll (globals.css, on data-intro). The component gets an empty
 * fragment as its page, so its own gate works (its call to action, a scroll
 * at the landing), and its root is transparent from outside (its stage stays
 * opaque), so when the stage lifts, the real page is what it reveals.
 *
 * Ways out, every one lifting the stage straight off onto the page (the
 * component's `lift`, [site edit] 4), from any phase: Enter (the call to
 * action, which shows during the unveil already), a wheel down or an upward swipe, Escape, ArrowDown, PageDown or
 * End, and the nav links, which land on their section. A click, Space or
 * Enter on the stage during the load, or its Skip button, rushes the load,
 * as the component does on its own. When it has lifted, focus goes to
 * <main> (or the section a link named) without moving the page.
 *
 * Every word is from the records (src/lib/content.ts) or a label.
 */

/** Shorter than the component's demo: a prologue, not a wait. */
const DURATION_MS = 3600
const MIN_LOAD_MS = 2200
/** The count holds below this until the cast has arrived. */
const HOLD_AT = 92

const NAV_IDS = ['work', 'products', 'experience', 'contact'] as const
const NAV = NAV_IDS.map((id) => {
  const section = SECTIONS.find((s) => s.id === id)!
  return { label: section.label, href: `#${section.id}` }
})

const year = toRoman(new Date().getFullYear())

/**
 * From outside, by descendant classes (the component as published; its own
 * CSS is unlayered, so whatever it sets is overridden with !):
 * - its root is transparent (the stage stays opaque), so the lift reveals
 *   the page beneath;
 * - its interface stands above the cast and the word (they painted over
 *   it), so no figure ever hides a word of it;
 * - the copy keeps below the pills on short screens (16.5% of the height,
 *   19% on phones, came up under them), and its two asides stand higher,
 *   beside it, clear of the faces;
 * - the scroll hint moves up onto the line above the word (it sat behind
 *   the letters), with the barcode and the plate; on phones it takes the
 *   barcode's place, and the plate keeps the right; on a screen under 480px
 *   tall (a phone on its side) there is no room for it under the copy;
 *   and the foot, a row as wide as the stage that holds nothing to press,
 *   lets the pointer through (on a phone on its side it rises level with
 *   ENTER, and took its taps);
 * - on short phones the two upper stars keep below the pills;
 * - everything else of the component's animation plays as published (Roman,
 *   2026-11-01, of the stage stripped of it: "but the animation from2 1st
 *   dev for this roman theme is now gone"): the word filling in, the
 *   flood opening as its circle, the flash and the sheen at the unveil, the
 *   figures rising and then breathing and leaning with the pointer, the
 *   shafts of light and the dust in them, the spotlight on the pointer, the
 *   moving grain, the stars twinkling, the rule drawing in, the scroll
 *   hint's falling line, the counts in their pills and ENTER as it draws it
 *   (outlined). Under reduced motion it holds all of it still itself;
 * - nothing under the page's 12px floor: the eyebrow, the counts, the
 *   asides, the count's ratio, ENTER, Skip, the plate and the scroll hint;
 *   so that the two pills still stand apart on a phone (360px wide and
 *   up; 12px set them 32px into each other there), they hug their words
 *   a little closer;
 * - the plate, small type that lands on marble, sits on an opaque label of
 *   the ground (a museum plate: its muted ink is 9.5:1 there, where a
 *   see-through label let the lit statue show behind its first letters),
 *   and the hint keeps a firmer dark halo than its own, in the text ink
 *   (the muted ink is 4.9:1 on the flood's lit end, too near the floor
 *   while the hint fades in; the text ink is 9.0:1);
 * - the labels the light passes beneath keep the hint's dark halo too (the
 *   brand, the nav, the eyebrow and the counts): the spotlight under the
 *   muted eyebrow left it barely 4.5:1, and the sheen's bright core,
 *   sweeping the stage at the unveil, left the counts and the nav near 2:1
 *   for a moment (with the halo, 6.6:1 and more at the light's brightest;
 *   the light itself is as published);
 * - the word keeps a dark halo, so it reads over the marble behind it,
 *   and stands in front of the sheen rather than under it (as on the
 *   title cards): the band passes behind the letters, so it brightens
 *   the stage round them but never washes out their halo (under it, the
 *   word fell to 2.8:1 for a moment as the band crossed it on a phone);
 * - the tagline's lines are balanced;
 * - on phones the component hides its nav's links but keeps the two <nav>s,
 *   empty landmarks: they go too;
 * - its root, a Tab stop while it loads, shows a gold ring when it has
 *   keyboard focus (the component rings only what is inside it);
 * - Enter and Skip fade in late (2.2 s and 1.6 s), and the nav's links
 *   shortly after the stage comes up, but each can take focus at once:
 *   with keyboard focus its fade is cancelled, so it shows at once (a
 *   new delay would not touch a fade already under way).
 */
const LOOK = [
  'bg-transparent!',
  '[&_.om-chrome]:z-[6]!',
  'max-sm:[&_.om-copy]:top-[max(19%,146px)]! sm:[&_.om-copy]:top-[max(16.5%,138px)]! [&_.om-aside]:top-[27%]!',
  '[&_.om-hint]:bottom-[calc(var(--om-fs)*(var(--om-cap)+0.03)+1.4vh+18px)]!',
  'max-sm:[&_.om-bars]:hidden! max-sm:[&_.om-foot]:justify-end! [@media(max-height:480px)]:[&_.om-hint]:hidden! [&_.om-foot]:pointer-events-none!',
  'max-sm:[&_.om-star:not(.om-star-s)]:top-[max(15.5%,124px)]!',
  '[&_.om-eyebrow]:text-xs! [&_.om-eyebrow]:tracking-[0.26em]! [&_.om-pill]:text-xs! [&_.om-aside]:text-[13px]! [&_.om-aside_b]:text-xs! [&_.om-ratio]:text-xs! [&_.om-cta]:text-xs! [&_.om-skip]:text-xs! [&_.om-plate]:text-xs! [&_.om-hint]:text-xs!',
  'max-sm:[&_.om-pill]:px-[10px]! max-sm:[&_.om-pill]:tracking-[0.16em]!',
  '[&_.om-plate]:rounded-[2px] [&_.om-plate]:bg-(--om-ground) [&_.om-plate]:px-2 [&_.om-plate]:py-1',
  '[&_.om-hint]:text-(--om-text)! [&_.om-hint]:[text-shadow:0_0_1px_var(--om-ground),0_0_4px_var(--om-ground),0_0_12px_var(--om-ground)]!',
  '[&_:is(.om-brand,.om-top_a,.om-eyebrow,.om-pill)]:[text-shadow:0_0_1px_var(--om-ground),0_0_4px_var(--om-ground),0_0_12px_var(--om-ground)]',
  WORD_HALO,
  '[&_.om-wordclip]:z-[1]',
  '[&_.om-tagline]:text-balance',
  'max-sm:[&_.om-top_nav]:hidden!',
  'focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-8 focus-visible:outline-gold',
  '[&_.om-cta:focus-visible]:opacity-100! [&_.om-cta:focus-visible]:transition-none! [&_.om-skip:focus-visible]:opacity-100! [&_.om-skip:focus-visible]:transition-none!',
  '[&_.om-top_li:has(:focus-visible)]:opacity-100! [&_.om-top_li:has(:focus-visible)]:transition-none!',
].join(' ')

/** The wide cast, Apollo's cut-off arm past the edge of a screen this size. */
function wideFigures(w: number, h: number) {
  return INTRO_FIGURES.wide.map((f) => (f.src === CAST.apollo.src ? { ...f, x: Math.max(f.x, pastEdge(CAST.apollo, f.h, w, h)) } : f))
}

/** Watches a media query; false on the server. */
function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (change) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', change)
      return () => mq.removeEventListener('change', change)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** The window's size, "w h"; "0 0" on the server. */
function useWindowSize(): [number, number] {
  const size = useSyncExternalStore(
    (change) => {
      window.addEventListener('resize', change)
      return () => window.removeEventListener('resize', change)
    },
    () => `${window.innerWidth} ${window.innerHeight}`,
    () => '0 0',
  )
  const [w, h] = size.split(' ').map(Number)
  return [w, h]
}

/** Focuses an element without scrolling to it; a section that takes no focus takes it once. */
function focusQuietly(el: HTMLElement) {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.style.outline = 'none'
    el.addEventListener(
      'blur',
      () => {
        el.removeAttribute('tabindex')
        el.style.outline = ''
      },
      { once: true },
    )
  }
  el.focus({ preventScroll: true })
}

export default function IntroStage({ cast, onDone }: { cast: Promise<void>; onDone: () => void }) {
  const html = typeof document === 'undefined' ? null : document.documentElement
  // Claimed on the first render: the gate's fail-safe may have given the
  // page back already (a chunk that came too late), and then this never shows.
  const [mine] = useState(() => html?.getAttribute('data-intro') === '')
  const [lift, setLift] = useState(false)
  const [progress, setProgress] = useState(0)
  const layerRef = useRef<HTMLDivElement>(null)
  const target = useRef<string | null>(null)
  /** What the intro made inert, to give back. */
  const stilled = useRef<Element[]>([])
  const tall = useMedia(TALL_QUERY)
  const wide = useMedia('(min-width: 768px)')
  const roomy = useMedia('(min-width: 360px)')
  const [winW, winH] = useWindowSize()

  // Up: the page beneath goes inert, the intro is remembered, focus comes in.
  useEffect(() => {
    if (!mine || !html) {
      onDone()
      return
    }
    html.setAttribute('data-intro', 'up')
    try {
      localStorage.setItem(INTRO_KEY, String(Date.now()))
    } catch {
      // Private modes can refuse storage; the intro then shows next time too.
    }
    const layer = layerRef.current!
    const made = stilled.current
    const still = (el: Element) => {
      if (el === layer || el.hasAttribute('inert') || el.tagName === 'SCRIPT') return
      el.setAttribute('inert', '')
      made.push(el)
    }
    for (const el of Array.from(document.body.children)) still(el)
    // Anything added to <body> while the intro is up (a portal, the route
    // announcer) is held still too.
    const added = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && still(n))
    })
    added.observe(document.body, { childList: true })
    // The component's two asides are <aside>s with no name: two
    // complementary landmarks nobody can tell apart (axe: landmark-unique).
    // Each is named by its own title, from outside, as the component renders
    // no prop for it.
    for (const aside of layer.querySelectorAll('.om-aside')) {
      const title = aside.querySelector('b')?.textContent
      if (title) aside.setAttribute('aria-label', title)
    }
    // The stage's root takes focus while it loads (Enter or Space skips).
    const root = layer.querySelector<HTMLElement>('.om-root')
    ;(root ?? layer).focus({ preventScroll: true })
    return () => {
      added.disconnect()
      for (const el of made.splice(0)) el.removeAttribute('inert')
      // Gone without lifting (an error took it down): give the page back.
      html.removeAttribute('data-intro')
    }
    // Once: the intro mounts once and leaves through onDone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The count: the component's own surge and stall, held short of the end
  // until the cast has arrived (the gate fetched it, capped at 8 s).
  useEffect(() => {
    if (!mine) return
    let arrived = false
    let live = true
    cast.then(() => {
      arrived = true
    })
    const start = performance.now()
    const tick = window.setInterval(() => {
      const simulated = omSimulated((performance.now() - start) / DURATION_MS) * 100
      const next = arrived ? simulated : Math.min(simulated, HOLD_AT)
      if (live) setProgress(next)
      if (arrived && next >= 100) window.clearInterval(tick)
    }, 80)
    return () => {
      live = false
      window.clearInterval(tick)
    }
  }, [cast, mine])

  // The ways out: a wheel down, an upward swipe, Escape and the keys that
  // scroll down, and the nav links (which land on their section).
  useEffect(() => {
    const layer = layerRef.current
    if (!mine || !layer) return
    const out = (id?: string) => {
      if (id) target.current = id
      setLift(true)
    }
    const navLink = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('.om-top a[href^="#"]')
      return a ? a.getAttribute('href')!.slice(1) : null
    }
    const onClick = (e: MouseEvent) => {
      // The call to action shows from the unveil on, while the component's
      // own handler only acts on it at the landing: it lifts from any phase.
      if ((e.target as Element | null)?.closest?.('.om-cta')) {
        out()
        return
      }
      const id = navLink(e)
      if (!id) return
      e.preventDefault()
      out(id)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Before the component's own key handler, which would take Enter as a skip.
        const id = navLink(e)
        if (!id) return
        e.preventDefault()
        out(id)
      } else if (e.key === 'Escape' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End') {
        e.preventDefault()
        out()
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 2) out()
    }
    let y0 = -1
    const onTouchStart = (e: TouchEvent) => {
      y0 = e.touches[0]?.clientY ?? -1
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (y0 >= 0 && y !== undefined && y0 - y > 40) out()
    }
    layer.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey, true)
    layer.addEventListener('wheel', onWheel, { passive: true })
    layer.addEventListener('touchstart', onTouchStart, { passive: true })
    layer.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      layer.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey, true)
      layer.removeEventListener('wheel', onWheel)
      layer.removeEventListener('touchstart', onTouchStart)
      layer.removeEventListener('touchmove', onTouchMove)
    }
  }, [mine])

  // The lift, however it began (one of the ways out above, or the
  // component's own call to action or scroll at the landing): the page shows
  // beneath the rising stage, already at the section a link named.
  useEffect(() => {
    const root = layerRef.current?.querySelector('.om-root')
    if (!mine || !root || !html) return
    const watch = new MutationObserver(() => {
      // Skip leaves with the load, and focus with it: bring it back in.
      const focus = document.activeElement
      if (!focus || focus === document.body) (root as HTMLElement).focus({ preventScroll: true })
      if (root.getAttribute('data-phase') !== 'exit' || html.getAttribute('data-intro') !== 'up') return
      html.setAttribute('data-intro', 'lift')
      const id = target.current
      if (id) {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
        // In place of the address, not after it: Back leaves the site, as it
        // would have before the intro.
        history.replaceState(history.state, '', `#${id}`)
      }
    })
    watch.observe(root, { attributes: true, attributeFilter: ['data-phase'] })
    return () => watch.disconnect()
  }, [mine, html])

  // Lifted: the page is the page again, and focus lands on it.
  const complete = () => {
    for (const el of stilled.current.splice(0)) el.removeAttribute('inert')
    html?.removeAttribute('data-intro')
    const id = target.current
    const landing = (id && document.getElementById(id)) || document.getElementById('main')
    if (landing) focusQuietly(landing)
    onDone()
  }

  if (!mine || !html) return null

  const projects = toRoman(PROJECTS.length)
  const certs = toRoman(CERTIFICATIONS.length)
  // The two pills must never overlap or overflow, 320 to 1920 wide.
  const labels = wide
    ? [`${projects} client projects`, `${certs} Salesforce certifications`]
    : roomy
      ? [`${projects} projects`, `${certs} certifications`]
      : [`${projects} projects`]

  return createPortal(
    <div
      ref={layerRef}
      data-intro-layer=""
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
      tabIndex={-1}
      className="fixed inset-0 z-[100] overscroll-contain outline-none [touch-action:pinch-zoom]"
    >
      <OldMastersPreloader
        progress={progress}
        durationMs={DURATION_MS}
        minLoadMs={MIN_LOAD_MS}
        holdMs={0}
        lift={lift}
        onComplete={complete}
        figures={tall ? INTRO_FIGURES.tall : wideFigures(winW, winH)}
        backdrop={CAST.david.src}
        duotone
        tone="noir"
        palette={IMPERIAL}
        fontHref={null}
        fonts={ROMAN_FONTS}
        wordmark={PERSON.first}
        wordAs="p"
        tagline={PERSON.tagline}
        eyebrow={`Prologue · ${year}`}
        brand="R·K"
        nav={NAV}
        labels={labels}
        asides={[
          { title: 'By day', text: `${ROLES[0].title}, ${ROLES[0].company}` },
          { title: 'By calling', text: PERSON.music },
        ]}
        annotations={[]}
        plate="Tab. I"
        loadingLabel="Loading"
        cta={{ label: 'Enter' }}
        formatCount={toRoman}
        height="100dvh"
        className={LOOK}
      >
        <></>
      </OldMastersPreloader>
    </div>,
    document.body,
  )
}
