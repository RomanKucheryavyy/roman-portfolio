import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PALETTE } from '@/components/stage/imperial'

/**
 * What every generated image (the share cards, the apple icon) draws with:
 * the Stage's palette (imperial.ts; next/og has no CSS variables, so the
 * values themselves) and its type: Cinzel for his name (the hero's face),
 * Cormorant Garamond italic for his words, Geist for what is read.
 *
 * The fonts are read from ./fonts at build time (Geist and Geist Mono from
 * the `geist` package, OFL, see fonts/OFL.txt; Cinzel Medium and Cormorant
 * Garamond Italic from Google Fonts as static TrueType, cut to printable
 * ASCII and the page's typographic marks, OFL, see fonts/OFL-Cinzel.txt and
 * fonts/OFL-Cormorant.txt), so an image never goes to the network for a
 * font. Every glyph an image draws must be in one of these files, or
 * next/og fetches a fallback.
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
  /** The surname, as the hero sets it in the body ink. */
  text: PALETTE.text,
} as const

export const FONT = { sans: 'Geist', mono: 'Geist Mono', roman: 'Cinzel', serif: 'Cormorant Garamond' } as const

const FONT_DIR = join(process.cwd(), 'src/app/_og/fonts')

const FILES = [
  { name: FONT.sans, file: 'Geist-Regular.ttf', weight: 400 },
  { name: FONT.sans, file: 'Geist-Bold.ttf', weight: 700 },
  { name: FONT.mono, file: 'GeistMono-Regular.ttf', weight: 400 },
  { name: FONT.roman, file: 'Cinzel-Medium.ttf', weight: 500 },
  { name: FONT.serif, file: 'CormorantGaramond-Italic.ttf', weight: 400, style: 'italic' },
] as const

interface OgFont {
  name: string
  data: Buffer
  weight: 400 | 500 | 700
  style: 'normal' | 'italic'
}

/** The font files, read once per process. */
let fonts: Promise<OgFont[]> | null = null
export function ogFonts(): Promise<OgFont[]> {
  fonts ??= Promise.all(
    FILES.map(async (f) => ({
      name: f.name,
      data: await readFile(join(FONT_DIR, f.file)),
      weight: f.weight,
      style: 'style' in f ? f.style : ('normal' as const),
    })),
  )
  return fonts
}
