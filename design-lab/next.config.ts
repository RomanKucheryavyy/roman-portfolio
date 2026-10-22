import type { NextConfig } from 'next'
import path from 'node:path'

const config: NextConfig = {
  // Screenshots are the deliverable; keep the dev badge out of them.
  devIndicators: false,
  // The lab is its own project inside the portfolio repo; keep Turbopack from
  // walking up to the site's lockfile.
  turbopack: { root: path.resolve(__dirname) },
  // LAB_EXPORT=1 next build writes a static copy to out/, for hosted previews.
  ...(process.env.LAB_EXPORT
    ? { output: 'export' as const, distDir: '.next-export', images: { unoptimized: true } }
    : {}),
}

export default config
