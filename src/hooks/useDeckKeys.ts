'use client'
import { useEffect, useRef, type RefObject } from 'react'

/**
 * Which keys turn a deck. The desktop deck is dragged up and down and has
 * always taken all four arrows. The phone deck is swiped sideways, so only
 * left and right turn it: up and down still scroll the page, as they must on
 * a deck that sits in the middle of a long one.
 */
const KEYS = {
  y: { prev: ['ArrowUp', 'ArrowLeft'], next: ['ArrowDown', 'ArrowRight'] },
  x: { prev: ['ArrowLeft'], next: ['ArrowRight'] },
} as const

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el?.tagName) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/**
 * Arrow keys for a deck, shared by the desktop and the phone deck.
 *
 * The listener is on the window, so it used to fire while someone was arrowing
 * through the text they were typing into the contact form, silently shuffling
 * a section they could not even see. It acts only when the deck is on screen,
 * the key is not going into a field or the detail view, and no modifier is
 * held (so Ctrl+K and friends pass straight through).
 *
 * Turning the deck sends the focused card to the back, where it is inert. When
 * focus was inside the deck, it follows the new front card (`frontId`): its
 * open button, else its first link, else the deck region itself.
 */
export function useDeckKeys(
  deckRef: RefObject<HTMLElement | null>,
  next: () => void,
  prev: () => void,
  axis: keyof typeof KEYS,
  frontId: string,
) {
  const refocus = useRef(false)

  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    const deck = deckRef.current
    if (!deck) return
    // By id, not [data-front]: the card that just left is still in the DOM,
    // still marked front, for the length of its exit animation.
    const card = deck.querySelector<HTMLElement>(`[data-work="${frontId}"]`)
    const target =
      card?.querySelector<HTMLElement>('[data-open]') ?? card?.querySelector<HTMLElement>('a[href], button') ?? deck
    target.focus({ preventScroll: true })
  }, [frontId, deckRef])

  useEffect(() => {
    const keys = KEYS[axis]
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      // Nor while the detail view is open over the deck.
      if ((e.target as HTMLElement | null)?.closest?.('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const deck = deckRef.current
      if (!deck) return
      const { top, bottom } = deck.getBoundingClientRect()
      if (bottom < 0 || top > window.innerHeight) return

      const step = (keys.prev as readonly string[]).includes(e.key)
        ? prev
        : (keys.next as readonly string[]).includes(e.key)
          ? next
          : null
      if (!step) return
      e.preventDefault()
      refocus.current = deck.contains(document.activeElement)
      step()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deckRef, next, prev, axis])
}
