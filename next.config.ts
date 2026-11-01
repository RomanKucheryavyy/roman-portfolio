import type { NextConfig } from 'next'

/**
 * Old addresses, kept working. Every one lands on the one page there is:
 * the section paths of the old design and the retired pages (/works and its
 * program notes, all unpublished, and /colophon). The section ids are the
 * Stage's own (SECTIONS in src/components/stage/top-bar.tsx; the smoke suite
 * checks each target exists). Temporary (307), not permanent: if a real page
 * ever lives at one of these paths, browsers must not have cached the hop.
 */
const REDIRECTS: Record<string, string> = {
  '/credentials': '/#credentials',
  '/work': '/#work',
  '/products': '/#products',
  '/about': '/#about',
  '/contact': '/#contact',
  '/works': '/#work',
  '/works/:slug': '/#work',
  '/colophon': '/',
}

/**
 * The Content-Security-Policy, report-only: the browser enforces nothing and
 * logs what it would have blocked, so a gap shows up in the console (and in
 * the smoke suite, which fails on any report) before the policy is ever
 * enforced. What each source is for, measured on /, /resume and the 404 at
 * 1440x900 and 390x844 with the whole home page scrolled through, starting
 * from 'self' alone (the counts are the reports each source answers, on /):
 *
 * - script-src 'unsafe-inline': Next's inline scripts and the JSON-LD (4).
 *   Nothing evaluates code or compiles WebAssembly: the Spline phone, which
 *   needed 'unsafe-eval' and 'wasm-unsafe-eval', is gone.
 * - style-src 'unsafe-inline': style attributes in the markup (React style
 *   props, 39) and inline <style> elements (3).
 * - img-src data:: the paper shaders' 1x1 transparent pixel
 *   (@paper-design/shaders-react, behind the footer) and the hero print's
 *   grain (an SVG noise, stage.tsx).
 * - font-src 'self': next/font self-hosts Geist and Geist Mono.
 * - connect-src 'self': the globe's map (/countries-110m.json, shipped in
 *   public/) and the message box's POST to /api/contact. Nothing leaves this
 *   origin.
 * - frame-ancestors 'none': X-Frame-Options DENY, in CSP terms.
 * - base-uri, form-action, object-src: they don't fall back to default-src.
 *   No page sets a <base>, every form posts to this origin's /api (by fetch),
 *   and nothing embeds a plugin.
 * - report-uri / report-to: violations go to /api/csp-report, which logs one
 *   line each on the server, so a deploy preview has a log to read. Both, for
 *   browsers with and without the Reporting API.
 *
 * No worker-src: nothing starts a worker, and without it workers fall back to
 * script-src. No blob: anywhere: nothing on the site makes a blob: URL.
 *
 * Enforcing it is a later, separate change: switch the header name once a
 * deploy preview has run report-only with nothing logged.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Reporting-Endpoints', value: 'csp="/api/csp-report"' },
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
    ]
  },
  async redirects() {
    return Object.entries(REDIRECTS).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }))
  },
}

export default nextConfig
