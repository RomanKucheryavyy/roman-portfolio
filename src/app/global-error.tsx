'use client'

import type { CSSProperties } from 'react'

/**
 * The last resort, when the root layout itself throws. It replaces the whole
 * document, so globals.css may not be there: every style is inline, in the
 * Stage's values (look.ts and the shadcn dark theme): the #060606 black, the
 * violet ink, the muted grey, the hero's two pill buttons and the page's
 * violet focus ring. The type asks for the layout's Geist by name and falls
 * back to the platform's sans. (Loading Geist here through next/font would
 * preload its stylesheet on every page, unused, for a page that almost never
 * renders.)
 */
const SANS = 'Geist, "Geist Fallback", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

const INK = 'oklch(0.985 0 0)'
const MUTED = 'oklch(0.708 0 0)'
const VIOLET = '#9d94ff'

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 44,
  padding: '0 24px',
  borderRadius: 9999,
  font: `500 14px/20px ${SANS}`,
  textDecoration: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const SOLID: CSSProperties = { ...PILL, border: '1px solid transparent', background: 'oklch(0.922 0 0)', color: 'oklch(0.205 0 0)' }
const OUTLINE: CSSProperties = { ...PILL, border: '1px solid oklch(1 0 0 / 15%)', background: 'oklch(1 0 0 / 4.5%)', color: INK }

export default function GlobalError({
  retry,
  reset,
}: {
  error: Error & { digest?: string }
  retry?: () => void
  reset: () => void
}) {
  return (
    <html lang="en" style={{ background: '#060606', colorScheme: 'dark' }}>
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          background: '#060606',
          color: INK,
          fontFamily: SANS,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <title>Something broke — Roman Kucheryavyy</title>
        {/* The one rule inline styles cannot say: the focus ring. */}
        <style>{`a:focus-visible,button:focus-visible{outline:2px solid ${VIOLET};outline-offset:4px}`}</style>
        <main id="main" style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '96px clamp(16px, 4vw, 48px)', boxSizing: 'border-box' }}>
          <p style={{ margin: 0, fontSize: 12, lineHeight: '16px', fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: MUTED }}>
            <span style={{ color: VIOLET }}>Error</span>
            <span aria-hidden="true" style={{ margin: '0 8px' }}>
              ·
            </span>
            Something broke
          </p>
          <h1
            style={{
              margin: '20px 0 0',
              maxWidth: '48rem',
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: '-0.045em',
              textWrap: 'balance',
            }}
          >
            The page failed to load.
          </h1>
          <p role="alert" style={{ margin: '24px 0 0', maxWidth: '36rem', fontSize: 18, lineHeight: 1.625, color: MUTED }}>
            Try it again, or head back to the home page.
          </p>
          <div style={{ marginTop: 44, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button type="button" style={SOLID} onClick={() => (retry ?? reset)()}>
              Try again
            </button>
            {/* A full page load on purpose: the app around this page is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={OUTLINE}>
              Back to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
