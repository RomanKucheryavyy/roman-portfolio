import type Lenis from 'lenis'

/**
 * The page's one Lenis instance, for the few things outside page.tsx that have
 * to talk to it. A modal is the reason: Lenis drives the scroll from its own
 * wheel listener, so locking the body does not stop the page moving behind an
 * open dialog. Only stopping Lenis does.
 */
let instance: Lenis | null = null

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis
}

export const getLenis = () => instance
