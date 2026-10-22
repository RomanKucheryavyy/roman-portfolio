'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'error'

/**
 * The pre-Clipboard-API way: select a hidden textarea and execCommand('copy').
 * It moves the selection and the focus, so both are put back afterwards; a
 * keyboard visitor who pressed a copy button stays on that button.
 */
function copyWithExecCommand(text: string): boolean {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const selection = document.getSelection()
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  // Fixed and invisible so nothing scrolls; 16px so iOS doesn't zoom to it.
  Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0', fontSize: '16px' })
  document.body.appendChild(area)
  area.select()

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }

  document.body.removeChild(area)
  if (selection && previous) {
    selection.removeAllRanges()
    selection.addRange(previous)
  }
  active?.focus({ preventScroll: true })
  return ok
}

/**
 * Copy text, and say how it went. Adapted from Copy Button's hook (21st.dev
 * 23529, ddoemonn), logic as written: the Clipboard API first, the
 * execCommand fallback when it is missing or refuses (an insecure origin, a
 * denied permission), and a state that settles back to idle after `timeout`.
 * Its onCopy / onError callbacks are left out (nothing here needs them, and
 * they were kept current by writing refs during render). The fallback also
 * puts focus back, which the original didn't.
 *
 * `state` is idle | copied | error. A second copy while one is showing
 * restarts the timer.
 */
export function useCopyToClipboard({ timeout = 2000 }: { timeout?: number } = {}) {
  const [state, setState] = useState<CopyState>('idle')
  const [ticket, setTicket] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) return false
    let ok = false
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      } else {
        ok = copyWithExecCommand(text)
      }
    } catch {
      try {
        ok = copyWithExecCommand(text)
      } catch {
        ok = false
      }
    }
    if (mounted.current) {
      setState(ok ? 'copied' : 'error')
      setTicket((t) => t + 1)
    }
    return ok
  }, [])

  const reset = useCallback(() => setState('idle'), [])

  useEffect(() => {
    if (state === 'idle') return
    const id = setTimeout(() => setState('idle'), timeout)
    return () => clearTimeout(id)
  }, [state, ticket, timeout])

  return { copy, state, reset }
}

export default useCopyToClipboard
