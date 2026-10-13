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

/**
 * The Content-Security-Policy, report-only: the browser enforces nothing and
 * logs what it would have blocked, so a gap shows up in the console (and in
 * the smoke suite, which fails on any report) before the policy is ever
 * enforced. What each source is for, measured on / with the ocean, every
 * section and the Spline card at the front, one source removed at a time
 * (W12; the counts are the reports each removal caused):
 *
 * - script-src 'unsafe-inline': Next's inline scripts and the JSON-LD (3).
 *   'unsafe-eval' and 'wasm-unsafe-eval' are for the Spline phone alone: its
 *   runtime compiles WebAssembly (process.wasm, from unpkg), and that
 *   module's emscripten glue builds its function wrappers with
 *   new Function() (132 eval reports and 1 wasm-eval without them). Today's
 *   browsers let 'unsafe-eval' cover WebAssembly too; 'wasm-unsafe-eval'
 *   stays named so the need is visible. Retiring Spline (an owner question)
 *   is what would let both go.
 * - style-src 'unsafe-inline': style attributes in the markup (React style
 *   props, 32) and one inline <style> element (1).
 * - img-src data: blob:: images made in the page rather than fetched
 *   (16 data:, 3 blob:).
 * - font-src 'self': next/font self-hosts all three families.
 * - connect-src: the Spline scene (prod.spline.design, 2) and the runtime's
 *   WebAssembly (unpkg.com, 2). Every other fetch is this origin's /api.
 * - worker-src 'self' blob:: the Spline runtime has code to start blob:
 *   workers; this scene started none in testing, so it is the plan's
 *   allowance rather than a measured need.
 * - frame-ancestors 'none': X-Frame-Options DENY, in CSP terms.
 * - base-uri, form-action, object-src: they don't fall back to default-src.
 *   No page sets a <base>, every form posts to this origin's /api (by fetch),
 *   and nothing embeds a plugin.
 * - report-uri / report-to: violations go to /api/csp-report, which logs one
 *   line each on the server, so a deploy preview has a log to read. Both, for
 *   browsers with and without the Reporting API.
 *
 * Enforcing it is a later, separate change: switch the header name once a
 * deploy preview has run report-only with nothing logged.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://prod.spline.design https://unpkg.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'report-uri /api/csp-report',
  'report-to csp',
].join('; ')

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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Reporting-Endpoints', value: 'csp="/api/csp-report"' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
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
