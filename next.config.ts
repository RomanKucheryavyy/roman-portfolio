import type { NextConfig } from 'next'

/**
 * Plain URLs a recruiter can type. The mobile menu prints `cd /credentials`
 * and the like, so these make its paths true. Temporary (307), not permanent:
 * if a real page ever lives at one of these paths, browsers must not have
 * cached the hop.
 */
const SECTION_PATHS: Record<string, string> = {
  '/credentials': '/#measures',
  '/work': '/#symphony',
  '/products': '/#compositions',
  '/about': '/#conductor',
  '/contact': '/#compose',
}

const nextConfig: NextConfig = {
  turbopack: {},
  poweredByHeader: false,
  images: {
    // AVIF first: next/image negotiates on Accept and falls back to WebP.
    formats: ['image/avif', 'image/webp'],
  },
  // Read by the build stamp (SiteFooter, /colophon). COMMIT_REF and CONTEXT
  // are set by Netlify; anywhere else the stamp says "local build".
  env: {
    BUILD_SHA: process.env.COMMIT_REF ?? '',
    BUILD_TIME: new Date().toISOString(),
    BUILD_CONTEXT: process.env.CONTEXT ?? 'local',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Never list accelerometer, gyroscope or magnetometer here: the hero
          // and the Conductor photo tilt with the phone through
          // deviceorientation, and an empty allowlist would switch that off.
          // The Content-Security-Policy is W12's, report-only first.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
        ],
      },
    ]
  },
  async redirects() {
    return Object.entries(SECTION_PATHS).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }))
  },
}

export default nextConfig
