import type { NextConfig } from 'next'
import path from 'node:path'

const config: NextConfig = {
  // The lab is its own project inside the portfolio repo; keep Turbopack from
  // walking up to the site's lockfile.
  turbopack: { root: path.resolve(__dirname) },
}

export default config
