import type Lenis from 'lenis'

/**
 * The page's one Lenis instance, for the few things outside HomeClient that
 * have to talk to it. A modal is the reason: Lenis drives the scroll from its
 * own wheel listener, so locking the body does not stop the page moving behind
 * an open dialog. Only stopping Lenis does.
 *
 * There is no instance under reduced motion (HomeClient skips Lenis then) or
 * off the home page, so every caller has a native-scroll path.
 */
let instance: Lenis | null = null
const listeners = new Set<(lenis: Lenis | null) => void>()

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis
  listeners.forEach((listener) => listener(lenis))
}

export const getLenis = () => instance

/**
 * Calls `listener` with the current instance now and again whenever it
 * changes. For effects that mount before HomeClient creates Lenis (a child's
 * effect runs before its parent's). Returns the unsubscribe.
 */
export function onLenis(listener: (lenis: Lenis | null) => void): () => void {
  listeners.add(listener)
  listener(instance)
  return () => {
    listeners.delete(listener)
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Moves keyboard focus to a section after a jump, so the next Tab continues
 * from there instead of from the nav link that started it. The heading takes
 * it (a section is not a control); the section itself when it has none.
 */
export function focusSection(el: HTMLElement) {
  const heading = el.querySelector<HTMLElement>('h1, h2') ?? el
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
}

export interface ScrollToTargetOptions {
  /**
   * Pixels added to the target's top. By default, minus the target's own
   * scroll-margin-top, so a Lenis jump lands where a native one does:
   * SectionShell sets that margin to clear the fixed nav, and Lenis doesn't
   * read it.
   */
  offset?: number
  /** Jump without easing. Reduced motion always jumps. */
  immediate?: boolean
}

/**
 * The one way to scroll to a place on the page: a section (by id, with or
 * without "#", or the element) or the top (0). Through Lenis when it is
 * running, natively otherwise; instant under reduced motion. A section jump
 * ends with focus on its heading. Returns false when the target isn't on the
 * page.
 */
export function scrollToTarget(target: string | HTMLElement | 0, { offset, immediate = false }: ScrollToTargetOptions = {}): boolean {
  const el = target === 0 ? null : typeof target === 'string' ? document.getElementById(target.replace(/^#/, '')) : target
  if (target !== 0 && !el) return false

  const jump = prefersReducedMotion() || immediate
  const shift = offset ?? (el ? -(parseFloat(getComputedStyle(el).scrollMarginTop) || 0) : 0)
  const done = () => {
    if (el) focusSection(el)
  }

  const lenis = getLenis()
  if (lenis) {
    // force: a jump the visitor asked for goes through even if something
    // stopped Lenis a moment ago (the phone menu restarts it as it closes).
    lenis.scrollTo(el ?? 0, { offset: shift, immediate: jump, force: true, onComplete: done })
    return true
  }

  const behavior: ScrollBehavior = jump ? 'auto' : 'smooth'
  if (el) {
    // scrollIntoView reads scroll-margin-top itself; an explicit offset can't
    // be passed to it, so that case scrolls by coordinates.
    if (offset === undefined) el.scrollIntoView({ behavior, block: 'start' })
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior })
  } else {
    window.scrollTo({ top: 0, behavior })
  }
  done()
  return true
}
