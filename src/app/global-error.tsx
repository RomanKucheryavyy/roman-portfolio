'use client'

import type { CSSProperties } from 'react'
import { PALETTE } from '@/components/stage/imperial'

/**
 * The last resort, when the root layout itself throws. It replaces the whole
 * document, so globals.css may not be there: every style is inline, in the
 * Stage's palette (imperial.ts, as look.ts uses it): the ground, the
 * wash's light, marble and the muted ink, the gold, the intro's
 * rectangular button, the Stage's gold-underlined text link (look.ts
 * stageLink) and the page's gold focus ring. The type asks for the
 * Stage's faces by name (Cinzel for the heading, Cormorant Garamond for the
 * line under it, Geist for the rest) and
 * falls back to the platform's serif and sans. (Loading them here through
 * next/font would preload their files on every page, unused, for a page
 * that almost never renders.)
 */
const SANS = 'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const ROMAN = 'Cinzel, "Cinzel Fallback", ui-serif, Georgia, "Times New Roman", serif'
const SERIF = '"Cormorant Garamond", "Cormorant Garamond Fallback", ui-serif, Georgia, serif'

const BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  padding: '0 28px',
  borderRadius: 2,
  font: `500 12px/16px ${SANS}`,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const SOLID: CSSProperties = { ...BUTTON, border: `1px solid ${PALETTE.marble}`, background: PALETTE.marble, color: PALETTE.ground }
/** look.ts stageLink: 13px Geist in marble over a gold line, 44px tall. */
const LINK: CSSProperties = {
  display: 'inline-block',
  padding: '12px 0',
  font: `500 13px/20px ${SANS}`,
  color: PALETTE.marble,
  textDecoration: `underline 1px ${PALETTE.gold}b3`,
  textUnderlineOffset: 5,
}

export default function GlobalError({
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  retry?: () => void
  reset: () => void
}) {
  return (
    <html lang="en" style={{ background: PALETTE.ground, colorScheme: 'dark' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          background: `radial-gradient(70% 60% at 50% 0%, ${PALETTE.wash}d9, transparent 70%) no-repeat, ${PALETTE.ground}`,
          color: PALETTE.marble,
          fontFamily: SANS,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <title>Something broke — Roman Kucheryavyy</title>
        {/* The one rule inline styles cannot say: the focus ring. */}
        <style>{`a:focus-visible,button:focus-visible{outline:2px solid ${PALETTE.gold};outline-offset:4px}`}</style>
        <main id="main" style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '96px clamp(16px, 4vw, 48px)', boxSizing: 'border-box' }}>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, lineHeight: '16px', fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: PALETTE.muted }}>
            <span style={{ color: PALETTE.gold }}>Error</span>
            <span aria-hidden="true" style={{ color: PALETTE.gold, margin: '0 -4px' }}>
              ·
            </span>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>, </span>
            Something broke
          </p>
          <h1
            style={{
              margin: '24px 0 0',
              maxWidth: '56rem',
              fontFamily: ROMAN,
              fontSize: 'clamp(2.125rem, 6vw, 4.25rem)',
              lineHeight: 1.08,
              fontWeight: 500,
              letterSpacing: '0.015em',
              textWrap: 'balance',
            }}
          >
            The page failed to load.
          </h1>
          <p role="alert" style={{ margin: '20px 0 0', maxWidth: '36rem', fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, lineHeight: 1.35, color: PALETTE.muted }}>
            Try it again, or head back to the home page.
          </p>
          <div style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 32px' }}>
            <button type="button" style={SOLID} onClick={() => (retry ?? reset)()}>
              Try again
            </button>
            {/* A full page load on purpose: the app around this page is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={LINK}>
              Back to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
