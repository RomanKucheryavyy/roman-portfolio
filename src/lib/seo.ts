import type { Metadata } from 'next'
import { HIS_WORDS, SITE } from '@/lib/constants'

/** How a page title reads in the tab: "Résumé builder — Roman Kucheryavyy". */
export const TITLE_TEMPLATE = `%s — ${SITE.name}`

/** A page's full title; the site title when it has none of its own. */
export function fullTitle(title?: string): string {
  return title ? TITLE_TEMPLATE.replace('%s', title) : SITE.title
}

/**
 * The site card, app/opengraph-image.tsx (and twitter-image.tsx, its twin), as
 * a page names it: the URL alone used to go out with no og:image:width,
 * height, type or alt. A route below app/ that sets its own openGraph replaces
 * the root segment's file-convention images, so it has to carry these itself.
 */
export const SITE_CARD = {
  url: '/opengraph-image',
  alt: `${SITE.name}: ${HIS_WORDS.tagline}`,
  width: 1200,
  height: 630,
  type: 'image/png',
} as const
const SITE_TWITTER_CARD = { ...SITE_CARD, url: '/twitter-image' } as const

export interface PageMetaInput {
  /** The page's own path, which becomes its canonical URL ("/resume"). */
  path: string
  title?: string
  description?: string
  /**
   * OG images. By default the site card, with its size, type and alt.
   * `false` names none, and Next's file convention supplies the card with
   * all of that plus its cache-busting hash: right for the home page, whose
   * segment holds the site card's file.
   */
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
  images,
}: PageMetaInput): Metadata {
  const og = images === undefined ? [SITE_CARD] : images
  const tw = images === undefined ? [SITE_TWITTER_CARD] : images
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
      ...(og ? { images: og } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: full,
      description,
      ...(tw ? { images: tw } : {}),
    },
  }
}
