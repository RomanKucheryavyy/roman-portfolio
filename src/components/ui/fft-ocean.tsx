'use client'

import { useEffect, useRef, useState } from 'react'
import { createRenderer, type OceanRendererOptions } from './fft-ocean-utils/renderer'

type ExampleProps = Omit<OceanRendererOptions, 'canvas'> & {
  className?: string
  /** Called if the GPU can't run the simulation, so a host can fall back. */
  onUnsupported?: () => void
}

export function Example({ className = '', onUnsupported, ...rendererOptions }: ExampleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  // The options object is spread fresh on every render, so it cannot be an
  // effect dependency without tearing the simulation down on each one. The
  // renderer reads them at construction and never again, so the first render's
  // values are the only ones that were ever going to apply — no need to keep
  // this ref current, which would mean writing to it during render.
  const optionsRef = useRef(rendererOptions)

  const unsupportedRef = useRef(onUnsupported)
  useEffect(() => {
    unsupportedRef.current = onUnsupported
  }, [onUnsupported])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = createRenderer({ canvas, ...optionsRef.current })
    renderer.ready.catch((err: unknown) => {
      // No WebGL2, or no float render targets. Not an error worth a red console
      // on a decorative background — the host just shows something else.
      console.info('fft-ocean: falling back —', err instanceof Error ? err.message : err)
      setFailed(true)
      unsupportedRef.current?.()
    })
    return () => renderer.dispose()
  }, [])

  if (failed) return null

  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  )
}

export default Example
