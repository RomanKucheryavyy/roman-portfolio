import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nothing here is worth a crawl budget: /api is JSON endpoints and
      // /__forms.html is the Netlify form stub, not a page.
      disallow: ['/api/', '/__forms.html'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
