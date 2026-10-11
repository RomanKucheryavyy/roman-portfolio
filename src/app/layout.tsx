import type { Metadata, Viewport } from 'next'
import { Archivo, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { SITE } from '@/lib/constants'
import { TITLE_TEMPLATE } from '@/lib/seo'
import { jsonLd, siteGraph } from '@/lib/structured-data'
import SiteChrome from '@/components/ui/SiteChrome'
import SiteFooter from '@/components/ui/SiteFooter'
import './globals.css'

// Self-hosted at build time, on each family's full variable weight axis (no
// `weight` list). The Google Fonts @import this replaces was render-blocking,
// went to two third-party origins on every visit, and asked for JetBrains Mono
// only up to 600, so every font-bold mono line was silently drawn at 600.
// globals.css points --font-display / --font-body / --font-mono at these.
const archivo = Archivo({ subsets: ['latin'], display: 'swap', variable: '--font-archivo' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' })

// No canonical, robots or manifest here: a canonical set in the root layout is
// inherited by every route that doesn't set its own, so /resume and the 404
// both told search engines they were the home page. Each page sets its own
// through pageMetadata() (src/lib/seo.ts). Indexing is the default without a
// robots tag. The manifest link moves to app/manifest.ts, which Next links by
// itself. The template names every other page "<title> — Roman Kucheryavyy".
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
  // No maximumScale / userScalable: false. Blocking pinch-zoom fails WCAG 1.4.4
  // and is not the fix for iOS auto-zooming on focus — a 16px field is, which is
  // why every input on the site is text-base below md.
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-black`}
      suppressHydrationWarning
    >
      <body className="bg-black text-white antialiased" suppressHydrationWarning>
        {/* First in the tab order on every route. Every page renders
            <main id="main" tabIndex={-1}>, so following it moves focus, not
            just the scroll position. Above the boot loader (z-200). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[210] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-label focus:text-black"
        >
          Skip to content
        </a>
        <SiteChrome />
        {children}
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph()) }} />
      </body>
    </html>
  )
}
