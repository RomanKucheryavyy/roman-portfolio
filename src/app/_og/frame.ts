import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PALETTE } from '@/components/stage/imperial'

/**
 * What every generated image (the share cards, the apple icon) draws with:
 * the Stage's palette (imperial.ts; next/og has no CSS variables, so the
 * values themselves) and its type, Geist.
 *
 * The fonts are read from ./fonts at build time (Geist and Geist Mono from
 * the `geist` package, OFL, see fonts/OFL.txt), so an image never goes to the
 * network for a font. Every glyph an image draws must be in one of these
 * files, or next/og fetches a fallback.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

export const STAGE = {
  /** The page's ground. */
  ground: PALETTE.ground,
  /** The wash, as the light rising from the stage floor. */
  wash: PALETTE.wash,
  /** Gold, the one accent: the address. */
  gold: PALETTE.gold,
  /** Marble: the name. */
  ink: PALETTE.marble,
  /** The tagline. */
  muted: PALETTE.muted,
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
