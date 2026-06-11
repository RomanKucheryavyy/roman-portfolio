'use client'
import { useEffect } from 'react'

let signed = false

/** A note for the curious — printed once to the DevTools console. */
export default function ConsoleSignature() {
  useEffect(() => {
    if (signed) return
    signed = true
    /* eslint-disable no-console */
    console.log(
      '%c𝄞%c═══♩═══♪═══♫═══♪═══♬═══%c\n\n' +
        '%cRoman Kucheryavyy%c — Orchestrating Logic & Art\n\n' +
        '%cYou read consoles. I like you already.\n' +
        'The score is open: the </> tab on the right edge shows\n' +
        "this site's own source for whatever section you're in.\n\n" +
        '%c$ git clone https://github.com/RomanKucheryavyy\n',
      'font-size: 28px; color: #5ac8fa;',
      'font-size: 14px; color: rgba(255,255,255,0.4);',
      '',
      'font-size: 16px; font-weight: bold; color: #fff;',
      'font-size: 13px; color: rgba(255,255,255,0.6);',
      'font-size: 12px; color: rgba(255,255,255,0.5);',
      'font-size: 12px; font-family: monospace; color: #30d158;'
    )
    /* eslint-enable no-console */
  }, [])

  return null
}
