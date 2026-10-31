import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { PALETTE } from '@/components/stage/imperial'
import { ROMAN_TYPE } from '@/components/stage/roman-type'
import { SITE } from '@/lib/constants'
import { TITLE_TEMPLATE } from '@/lib/seo'
import './globals.css'

// Self-hosted at build time, so no request leaves for Google Fonts.
// globals.css points font-sans and font-mono at these variables, and
// font-roman and font-serif at the Roman faces' (ROMAN_TYPE: the Stage, the
// 404 and the error page draw them; roman-type.ts says why they are here).
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

// No canonical, robots or manifest here: a canonical set in the root layout is
// inherited by every route that doesn't set its own. Each page sets its own
// through pageMetadata() (src/lib/seo.ts). Indexing is the default without a
// robots tag; app/manifest.ts is linked by Next itself. The template names
// every other page "<title> — Roman Kucheryavyy".
export const metadata: Metadata = {
  title: { default: SITE.title, template: TITLE_TEMPLATE },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // No maximumScale / userScalable: false. Blocking pinch-zoom fails WCAG
  // 1.4.4; a 16px field is what stops iOS zooming in on focus.
  // The Stage's ground (imperial.ts).
  themeColor: PALETTE.ground,
  colorScheme: 'dark',
}

/**
 * Dark only. `dark` is on <html> in the server HTML, so the first paint is
 * dark with or without scripts; the ThemeProvider holds it there for the
 * components that ask next-themes (lifeline's useTheme).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${ROMAN_TYPE}`} suppressHydrationWarning>
      {/* Inline as well as in classes: Next's built-in error pages inject an
          unlayered body{background:#fff;color:#000}, which beats any
          utility. */}
      <body
        className="bg-background font-sans text-foreground antialiased"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
          {/* First in the tab order on every route. Every page renders one
              <main id="main" tabIndex={-1}>, so following it moves focus, not
              just the scroll position. Above the Stage's fixed top bar. */}
          <a
            href="#main"
            className="sr-only rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:px-4 focus:py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-solid focus-visible:outline-[var(--stage-accent-ink)]"
          >
            Skip to content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
