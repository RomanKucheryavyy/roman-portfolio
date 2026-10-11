'use client'
import { useEffect } from 'react'
import { useStore } from '@/stores/useStore'

/**
 * Redraws the favicon per active section: RK, shield, </>, ♬, ♪, envelope.
 *
 * Mounted by the home page only, so each redraw puts the original icon back
 * when it is replaced or unmounted: leaving the home page used to leave the
 * last section's glyph in the tab of every other route.
 */
export default function DynamicFavicon() {
  const activeSection = useStore((s) => s.activeSection)

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const created = !link
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    const original = { href: link.getAttribute('href'), type: link.getAttribute('type') }
    const restore = () => {
      if (!link) return
      if (created) {
        link.remove()
        return
      }
      if (original.href === null) link.removeAttribute('href')
      else link.setAttribute('href', original.href)
      if (original.type === null) link.removeAttribute('type')
      else link.setAttribute('type', original.type)
    }
    link.type = 'image/png'

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return restore
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
    return restore
  }, [activeSection])

  return null
}
