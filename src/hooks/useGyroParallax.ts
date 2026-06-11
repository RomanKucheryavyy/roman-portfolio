'use client'
import { useEffect, useRef } from 'react'

interface GyroParallaxOptions {
  maxOffset?: number
  smoothing?: number
}

/**
 * Tilts an element with the phone's gyroscope (touch devices only).
 * iOS requires a user gesture before deviceorientation fires — we request
 * permission on the first touchstart.
 */
export function useGyroParallax({ maxOffset = 15, smoothing = 0.08 }: GyroParallaxOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!isTouch) return

    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    let raf = 0

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      targetX = clamp(e.gamma / 30, -1, 1) * maxOffset
      targetY = clamp((e.beta - 45) / 30, -1, 1) * maxOffset
    }

    const loop = () => {
      x += (targetX - x) * smoothing
      y += (targetY - y) * smoothing
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      window.addEventListener('deviceorientation', onOrientation)
      raf = requestAnimationFrame(loop)
    }

    type PermissionDOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }
    const DOE = DeviceOrientationEvent as PermissionDOE
    if (typeof DOE.requestPermission === 'function') {
      const requestOnTouch = () => {
        DOE.requestPermission?.()
          .then((state) => { if (state === 'granted') start() })
          .catch(() => {})
      }
      window.addEventListener('touchstart', requestOnTouch, { once: true })
      return () => {
        window.removeEventListener('touchstart', requestOnTouch)
        window.removeEventListener('deviceorientation', onOrientation)
        cancelAnimationFrame(raf)
      }
    }

    start()
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      cancelAnimationFrame(raf)
    }
  }, [maxOffset, smoothing])

  return ref
}
