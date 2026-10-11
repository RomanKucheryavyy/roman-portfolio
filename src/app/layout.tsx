import type { Metadata, Viewport } from 'next'
import { Archivo, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { SITE } from '@/lib/constants'
import './globals.css'

// Self-hosted at build time, on each family's full variable weight axis (no
// `weight` list). The Google Fonts @import this replaces was render-blocking,
// went to two third-party origins on every visit, and asked for JetBrains Mono
// only up to 600, so every font-bold mono line was silently drawn at 600.
// globals.css points --font-display / --font-body / --font-mono at these.
const archivo = Archivo({ subsets: ['latin'], display: 'swap', variable: '--font-archivo' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-space-grotesk' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  manifest: '/manifest.json',
  alternates: { canonical: '/' },
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
  robots: { index: true, follow: true },
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
        {children}
      </body>
    </html>
  )
}
