import type { MetadataRoute } from 'next'
import { PALETTE } from '@/components/stage/imperial'
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
    // The Stage's ground (imperial.ts), as the layout's theme-color.
    background_color: PALETTE.ground,
    theme_color: PALETTE.ground,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
