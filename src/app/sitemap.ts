import type { MetadataRoute } from 'next'
import { publishedStudies } from '@/lib/case-studies'
import { SITE } from '@/lib/constants'
import { RESUME_HREF, ROUTES } from '@/lib/routes'

/**
 * The real route set, and nothing that changes between two builds of the same
 * content: a `new Date()` here stamped every URL as modified on every deploy,
 * which teaches crawlers to ignore lastmod. Only a program-notes page has a
 * date, and it is the day its content last changed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}${ROUTES.works}`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}${ROUTES.colophon}`, changeFrequency: 'monthly', priority: 0.3 },
    ...publishedStudies().map((study) => ({
      url: `${SITE.url}${ROUTES.works}/${study.slug}`,
      lastModified: study.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // The résumé is listed only once it is a public page (Option A). While it
    // is Roman's PIN-gated builder it serves 200 with a noindex, so it is
    // crawlable (robots.ts) but not advertised.
    ...(RESUME_HREF ? [{ url: `${SITE.url}${RESUME_HREF}`, changeFrequency: 'monthly' as const, priority: 0.7 }] : []),
  ]
}
