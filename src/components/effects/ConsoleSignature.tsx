'use client'
import { useEffect } from 'react'

let signed = false

/** A note for the curious — printed once to the DevTools console. */
export default function ConsoleSignature() {
  useEffect(() => {
    if (signed) return
    signed = true
    console.log(
      '%c𝄞%c═══♩═══♪═══♫═══♪═══♬═══%c\n\n' +
        '%cRoman Kucheryavyy%c — Orchestrating Logic & Art\n\n' +
        '%cYou read consoles. I like you already.\n' +
        `How this site is built: ${window.location.origin}/colophon\n\n` +
        '%c$ git clone https://github.com/RomanKucheryavyy\n',
      'font-size: 28px; color: #5ac8fa;',
      'font-size: 14px; color: rgba(255,255,255,0.4);',
      '',
      'font-size: 16px; font-weight: bold; color: #fff;',
      'font-size: 13px; color: rgba(255,255,255,0.6);',
      'font-size: 12px; color: rgba(255,255,255,0.5);',
      'font-size: 12px; font-family: monospace; color: #30d158;'
    )
  }, [])

  return null
}
