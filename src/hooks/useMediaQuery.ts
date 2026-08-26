'use client'
import { useCallback, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * A media query as React state.
 *
 * The pattern this replaces — `useState(false)` plus a post-mount effect that
 * calls `setState` — had two problems. It rendered one frame of the wrong
 * layout on every visit before correcting itself, and it read the query exactly
 * once, so rotating a phone or dragging a window across a breakpoint never
 * changed the answer. `useSyncExternalStore` fixes both: the first client
 * render already has the real value, and the subscription keeps it live.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverFallback,
  )
}

/**
 * False while server-rendering, true once hydrated — the mount gate, without
 * the setState-in-an-effect that React now warns about.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}
