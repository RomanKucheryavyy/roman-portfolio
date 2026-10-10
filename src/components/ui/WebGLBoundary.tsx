'use client'
import { Component, useSyncExternalStore, type ReactNode } from 'react'

interface WebGLBoundaryProps {
  /** What to draw instead once the 3D child has thrown. */
  fallback: ReactNode
  /** Lets the parent stop rendering the 3D child at all after a failure. */
  onError?: (error: unknown) => void
  children: ReactNode
}

/**
 * Keeps a WebGL embed's failure local. Spline rethrows a failed scene load
 * during render, and with no boundary between it and the root, React unmounted
 * the whole page: one blocked request or one machine without WebGL turned the
 * site into Next's "This page couldn't load" screen.
 */
export default class WebGLBoundary extends Component<WebGLBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.info('[webgl] unavailable', error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

let probed: boolean | undefined

/**
 * Whether this browser can create a WebGL context at all, so a 3D embed that
 * would only fail is never downloaded. Probed once per page load; the probe
 * context is released straight away, because browsers cap live contexts and
 * the hero's ocean needs one.
 */
export function canWebGL(): boolean {
  if (probed !== undefined) return probed
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    probed = !!gl
  } catch {
    probed = false
  }
  return probed
}

const noSubscription = () => () => {}

/**
 * canWebGL() as a hook. False on the server and during hydration, so the
 * server HTML and the first client render agree; the real answer follows in
 * the next render.
 */
export function useCanWebGL(): boolean {
  return useSyncExternalStore(noSubscription, canWebGL, () => false)
}
