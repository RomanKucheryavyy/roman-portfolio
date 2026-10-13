'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollToTarget } from '@/lib/lenis'
import { MOVEMENTS, type MovementId } from '@/lib/score'

/** The reading line: a section is current once its top has passed 35% of the viewport. */
const READING_LINE = 0.35
/** Longest a jump may hold the spy: Lenis's 1.2s glide plus a margin. */
const RELEASE = 1600

interface UseScrollSpyOptions {
  /** Off the home page there are no sections to watch. */
  enabled: boolean
  /** Called with every movement as it becomes current, the hero and the interlude included. */
  onChange: (id: MovementId) => void
  /** What a jump announces once it lands: the movement's name. */
  labelOf: (id: MovementId) => string
}

/**
 * Which movement is being read, from one measurement of where the sections
 * sit. Adapted from Scroll Spy's useScrollSpy hook (21st.dev 23554,
 * ddoemonn), the hook only; its pill UI is not used.
 *
 * It retires the seven IntersectionObservers the home page used to run, one
 * per section, which set a section when 15% of it showed and never cleared
 * one: two sections in view raced, and the winner was whichever fired last.
 * Here there is one answer per frame: the last section whose top has crossed
 * a reading line 35% down the viewport, except at the very bottom of the
 * page, where the last section wins (Contact is too short to ever reach the
 * line otherwise).
 *
 * `jumpTo(id)` is a nav jump: it scrolls through scrollToTarget (Lenis, or
 * native under reduced motion), marks the target current at once, and holds
 * the spy there while the page glides past the sections in between. A wheel
 * or a touch hands control back to the visitor. Only a jump is announced:
 * scrolling past sections is not news, arriving where you asked to go is.
 */
export function useScrollSpy({ enabled, onChange, labelOf }: UseScrollSpyOptions) {
  const [announce, setAnnounce] = useState('')
  const current = useRef<MovementId | null>(null)
  const lock = useRef<MovementId | null>(null)
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frame = useRef(0)
  const emit = useRef(onChange)
  const label = useRef(labelOf)
  useEffect(() => {
    emit.current = onChange
    label.current = labelOf
  })

  const set = useCallback((id: MovementId) => {
    if (current.current === id) return
    current.current = id
    emit.current(id)
  }, [])

  const measure = useCallback((): MovementId | null => {
    const line = window.innerHeight * READING_LINE
    let found: MovementId | null = null
    let last: MovementId | null = null
    for (const { id } of MOVEMENTS) {
      const node = document.getElementById(id)
      if (!node) continue
      last = id
      if (!found || node.getBoundingClientRect().top <= line) found = id
    }
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    return atEnd && last ? last : found
  }, [])

  const release = useCallback(() => {
    lock.current = null
    if (lockTimer.current) clearTimeout(lockTimer.current)
    lockTimer.current = null
  }, [])

  const sync = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const next = measure()
      if (!next) return
      if (lock.current) {
        if (lock.current !== next) return
        setAnnounce(label.current(next))
        release()
      }
      set(next)
    })
  }, [measure, release, set])

  useEffect(() => {
    if (!enabled) return
    const abandon = () => {
      if (!lock.current) return
      // A jump cut short by the reader's own wheel or touch: the hash the nav
      // wrote for it names a section they never reached, and a copied URL
      // would open there. Drop it; the spy goes on naming what is read.
      if (window.location.hash === `#${lock.current}`) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      release()
    }
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    window.addEventListener('wheel', abandon, { passive: true })
    window.addEventListener('touchstart', abandon, { passive: true })
    // The sections mount after hydration and grow as their images and fonts
    // arrive; any change in the page's size can move the answer.
    const observer = new ResizeObserver(sync)
    observer.observe(document.body)
    sync()
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.removeEventListener('wheel', abandon)
      window.removeEventListener('touchstart', abandon)
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      frame.current = 0
      release()
      current.current = null
    }
  }, [enabled, sync, release])

  const jumpTo = useCallback(
    (id: MovementId) => {
      if (!scrollToTarget(id)) return
      setAnnounce('')
      lock.current = id
      set(id)
      if (lockTimer.current) clearTimeout(lockTimer.current)
      lockTimer.current = setTimeout(() => {
        release()
        sync()
      }, RELEASE)
      // An instant jump (reduced motion) has already landed.
      sync()
    },
    [release, set, sync],
  )

  return { jumpTo, announce }
}

export default useScrollSpy
