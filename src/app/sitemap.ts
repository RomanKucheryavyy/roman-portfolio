import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'
import { RESUME_HREF } from '@/lib/routes'

/**
 * The live pages, and nothing that changes between two builds of the same
 * content: a `new Date()` here would stamp every URL as modified on every
 * deploy, which teaches crawlers to ignore lastmod.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: 'monthly', priority: 1 },
    // The résumé is listed only once it is a public page (Option A). While it
    // is Roman's PIN-gated builder it serves 200 with a noindex, so it is
    // crawlable (robots.ts) but not advertised.
    ...(RESUME_HREF ? [{ url: `${SITE.url}${RESUME_HREF}`, changeFrequency: 'monthly' as const, priority: 0.7 }] : []),
  ]
}
