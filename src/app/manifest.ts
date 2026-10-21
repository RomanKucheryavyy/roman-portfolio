import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'

/**
 * /manifest.webmanifest, from SITE, so the installed name and description
 * can't drift from the page's. Replaces public/manifest.json, which had no
 * icons at all.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: SITE.name,
    short_name: 'RK.',
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    // The Stage black, as the layout's theme-color.
    background_color: '#060606',
    theme_color: '#060606',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
