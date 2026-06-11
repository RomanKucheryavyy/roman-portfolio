'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  speed: number
  opacity: number
  fadeStart: number
  fadingOut: boolean
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let stars: Star[] = []

    const makeStar = (w: number, h: number): Star => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: Math.random() / 5 + 0.1,
      opacity: 1,
      fadeStart: Date.now() + (600 * Math.random() + 100),
      fadingOut: false,
    })

    const init = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const count = Math.floor((canvas.width * canvas.height) / 6000)
      stars = Array.from({ length: count }, () => makeStar(canvas.width, canvas.height))
    }
    init()

    let raf = 0
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const now = Date.now()
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        s.y -= s.speed
        if (s.y < 0) stars[i] = makeStar(canvas.width, canvas.height)
        if (!s.fadingOut && now > s.fadeStart) s.fadingOut = true
        if (s.fadingOut) {
          s.opacity -= 0.008
          if (s.opacity <= 0) stars[i] = makeStar(canvas.width, canvas.height)
        }
        ctx.fillStyle = `rgba(${255 - (255 * Math.random()) / 2}, 255, 255, ${s.opacity})`
        ctx.fillRect(s.x, s.y, 0.4, Math.random() * 2 + 1)
      }
      raf = requestAnimationFrame(frame)
    }
    frame()

    window.addEventListener('resize', init)
    return () => {
      window.removeEventListener('resize', init)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}
