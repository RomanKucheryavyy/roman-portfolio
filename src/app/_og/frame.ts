import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * What every generated image (the share cards, the apple icon) draws with:
 * the Stage's colours as literals (next/og has no CSS variables; the values
 * are look.ts's and the shadcn dark theme's) and its type, Geist.
 *
 * The fonts are read from ./fonts at build time (Geist and Geist Mono from
 * the `geist` package, OFL, see fonts/OFL.txt), so an image never goes to the
 * network for a font. Every glyph an image draws must be in one of these
 * files, or next/og fetches a fallback.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

export const STAGE = {
  black: '#060606',
  /** The accent as a fill: the About block's violet wash. */
  accent: '#16106d',
  /** The accent as an ink that reads on black. */
  accentInk: '#9d94ff',
  ink: '#fafafa',
  muted: '#a1a1a1',
} as const

export const FONT = { sans: 'Geist', mono: 'Geist Mono' } as const

const FONT_DIR = join(process.cwd(), 'src/app/_og/fonts')

const FILES = [
  { name: FONT.sans, file: 'Geist-Regular.ttf', weight: 400 },
  { name: FONT.sans, file: 'Geist-Bold.ttf', weight: 700 },
  { name: FONT.mono, file: 'GeistMono-Regular.ttf', weight: 400 },
] as const

interface OgFont {
  name: string
  data: Buffer
  weight: 400 | 700
  style: 'normal'
}

/** The three font files, read once per process. */
let fonts: Promise<OgFont[]> | null = null
export function ogFonts(): Promise<OgFont[]> {
  fonts ??= Promise.all(
    FILES.map(async ({ name, file, weight }) => ({
      name,
      data: await readFile(join(FONT_DIR, file)),
      weight,
      style: 'normal' as const,
    })),
  )
  return fonts
}
