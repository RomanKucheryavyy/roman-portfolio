import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/works`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // /resume is PIN-gated, so it is deliberately absent: pointing crawlers at
    // a page that answers 401 earns nothing and advertises the lock.
  ]
}
