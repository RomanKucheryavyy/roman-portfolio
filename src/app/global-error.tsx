'use client'

import type { CSSProperties } from 'react'

/**
 * The last resort, when the root layout itself throws. It replaces the whole
 * document, so globals.css, the fonts and the tokens may not be there: every
 * style is inline, in the same values (ink-meta is white at 0.5, the outline
 * pill is a 0.25 white border, the accent runs from spectrum purple to red).
 */

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 9999,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'transparent',
  color: 'rgba(255,255,255,0.7)',
  padding: '8px 16px',
  font: `12px/16px ${MONO}`,
  textDecoration: 'none',
  cursor: 'pointer',
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
    <html lang="en" style={{ background: '#000', colorScheme: 'dark' }}>
      <body
        className="bg-black text-white"
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          background: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <title>Something broke — Roman Kucheryavyy</title>
        <main id="main" style={{ width: '100%', maxWidth: '72rem', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 4rem)' }}>
          <p
            style={{
              margin: '0 0 12px',
              font: `12px/16px ${MONO}`,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {'// error'}
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.025em' }}>
            Something{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #af52de, #ff2d55)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              broke.
            </span>
          </h1>
          <p role="alert" style={{ margin: '16px 0 0', maxWidth: '32rem', fontSize: 16, lineHeight: '26px', color: 'rgba(255,255,255,0.5)' }}>
            The page failed to load. Try it again, or head back to the top.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button type="button" style={PILL} onClick={() => (retry ?? reset)()}>
              Try again
            </button>
            {/* A full page load on purpose: the app around this page is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={PILL}>
              <span aria-hidden="true">←</span> Back to the top
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
