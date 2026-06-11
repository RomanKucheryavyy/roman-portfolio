'use client'
import { useEffect } from 'react'
import { useStore } from '@/stores/useStore'

/** Redraws the favicon per active section: RK, shield, </>, ♬, ♪, envelope. */
export default function DynamicFavicon() {
  const activeSection = useStore((s) => s.activeSection)

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/png'

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    switch (activeSection) {
      case 'measures':
        ctx.beginPath()
        ctx.moveTo(16, 4)
        ctx.lineTo(28, 10)
        ctx.lineTo(26, 22)
        ctx.quadraticCurveTo(16, 30, 16, 30)
        ctx.quadraticCurveTo(16, 30, 6, 22)
        ctx.lineTo(4, 10)
        ctx.closePath()
        ctx.stroke()
        break
      case 'symphony':
        ctx.font = 'bold 16px monospace'
        ctx.fillText('</>', 16, 17)
        break
      case 'compositions':
        ctx.font = '22px serif'
        ctx.fillText('♬', 16, 17)
        break
      case 'conductor':
        ctx.font = '22px serif'
        ctx.fillText('♪', 16, 17)
        break
      case 'compose':
        ctx.strokeRect(5, 9, 22, 16)
        ctx.beginPath()
        ctx.moveTo(5, 9)
        ctx.lineTo(16, 19)
        ctx.lineTo(27, 9)
        ctx.stroke()
        break
      default:
        ctx.font = 'bold 14px monospace'
        ctx.fillText('RK', 16, 17)
    }

    link.href = canvas.toDataURL('image/png')
  }, [activeSection])

  return null
}
