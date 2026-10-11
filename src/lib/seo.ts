import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'

/** How a page title reads in the tab: "The setlist — Roman Kucheryavyy". */
export const TITLE_TEMPLATE = `%s — ${SITE.name}`

/** A page's full title; the site title when it has none of its own. */
export function fullTitle(title?: string): string {
  return title ? TITLE_TEMPLATE.replace('%s', title) : SITE.title
}

export interface PageMetaInput {
  /** The page's own path, which becomes its canonical URL ("/works"). */
  path: string
  title?: string
  description?: string
  /** OG images; the site card by default. `false` leaves them to the segment's own opengraph-image file. */
  images?: string[] | false
}

/**
 * The head every route needs, built one way: its own canonical (no page may
 * inherit the home page's), and Open Graph and Twitter tags that say the same
 * title as the tab. Relative URLs resolve against the layout's metadataBase.
 */
export function pageMetadata({
  path,
  title,
  description = SITE.description,
  images = ['/opengraph-image'],
}: PageMetaInput): Metadata {
  const full = fullTitle(title)
  return {
    // Absolute, so <title>, og:title and twitter:title are always the same string.
    title: { absolute: full },
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE.name,
      locale: 'en_US',
      type: 'website',
      url: path,
      title: full,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: full,
      description,
      ...(images ? { images } : {}),
    },
  }
}
