import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'
import { RESUME_PUBLIC } from '@/lib/routes'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /api is JSON endpoints and /__forms.html is the Netlify form stub,
      // not a page. /resume is not disallowed: it serves 200 with a noindex,
      // and a crawler has to be let in to read the noindex (a disallowed URL
      // can still be indexed from links, without its content). Once the
      // résumé is public, the private builder moves to /resume/builder.
      disallow: ['/api/', '/__forms.html', ...(RESUME_PUBLIC ? ['/resume/builder'] : [])],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
