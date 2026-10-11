import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { SpectrumKey } from '@/lib/score'

/**
 * The one frame every share card is drawn in: the night-blue ground, the
 * staff, the spotlight and three notes, with the card's own kicker, heading
 * and lines in the middle.
 *
 * The type is the site's own, read from src/app/_fonts at build time (OFL
 * instances, see OFL.txt), so a card never goes to the network for a font.
 * Before, no fonts were passed: the name asked for weight 800 and got next/og's
 * regular fallback face, and the notes' glyphs were fetched from Google Fonts
 * during the build. Every glyph a card draws must be in one of these files, or
 * next/og fetches one; the music file holds only ♩ ♪ ♫ ♬.
 */

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * The spectrum tokens of globals.css, as literals: next/og has no CSS
 * variables. Same values, same names; change both together.
 */
export const SPECTRUM: Record<SpectrumKey, string> = {
  red: '#ff2d55',
  orange: '#ff6b35',
  amber: '#ffb800',
  green: '#30d158',
  teal: '#00c7be',
  blue: '#5ac8fa',
  purple: '#af52de',
}

/** The brand gradient laid across a name (the hero's full spectrum). */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${(['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple'] as const)
  .map((k) => SPECTRUM[k])
  .join(', ')})`

/** A heading accent in a movement's key running into the next one's, as `.text-key` draws it. */
export const keyGradient = (from: SpectrumKey, to: SpectrumKey) =>
  `linear-gradient(90deg, ${SPECTRUM[from]}, ${SPECTRUM[to]})`

export const FONT = {
  display: 'Archivo',
  body: 'Space Grotesk',
  mono: 'JetBrains Mono',
  music: 'Noto Sans Symbols',
} as const

const FONT_DIR = join(process.cwd(), 'src/app/_fonts')

const FILES = [
  { name: FONT.display, file: 'Archivo-ExtraBold.ttf', weight: 800 },
  { name: FONT.display, file: 'Archivo-Black.ttf', weight: 900 },
  { name: FONT.body, file: 'SpaceGrotesk-Regular.ttf', weight: 400 },
  { name: FONT.mono, file: 'JetBrainsMono-Regular.ttf', weight: 400 },
  { name: FONT.mono, file: 'JetBrainsMono-Bold.ttf', weight: 700 },
  { name: FONT.music, file: 'NotoSansSymbols-Music.ttf', weight: 400 },
] as const

interface OgFont {
  name: string
  data: Buffer
  weight: 400 | 700 | 800 | 900
  style: 'normal'
}

/** The six font files, read once per process. */
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

const STAFF_TOPS = [170, 210, 250, 290, 330]

/** next/og lays a fragment out as a flex row of its own, so a fragment's children are lifted into the column. */
function unwrap(content: ReactNode): ReactNode {
  return isValidElement(content) && content.type === Fragment
    ? Children.toArray((content as ReactElement<{ children?: ReactNode }>).props.children)
    : content
}

/** The card: frame plus content. `footer` is the address line at the bottom. */
export async function ogImage(content: ReactNode, { footer = 'romankucheryavyy.com' }: { footer?: string } = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000010',
          position: 'relative',
          fontFamily: FONT.body,
          color: '#ffffff',
        }}
      >
        {/* staff lines */}
        {STAFF_TOPS.map((top) => (
          <div
            key={top}
            style={{
              position: 'absolute',
              top,
              left: 80,
              right: 80,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
        ))}
        {/* spotlight glow */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: 400,
            width: 400,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(124,145,182,0.25) 0%, transparent 70%)',
          }}
        />
        {/* notes: the ♪ sits above the staff's left end, clear of the kicker
            (it used to land on the kicker's "//" and read as "/♪/") */}
        <div style={{ position: 'absolute', top: 96, left: 112, color: 'rgba(255,255,255,0.25)', fontSize: 44, fontFamily: FONT.music }}>♪</div>
        <div style={{ position: 'absolute', top: 230, right: 220, color: 'rgba(255,255,255,0.2)', fontSize: 36, fontFamily: FONT.music }}>♫</div>
        <div style={{ position: 'absolute', top: 120, right: 380, color: 'rgba(255,255,255,0.14)', fontSize: 30, fontFamily: FONT.music }}>♩</div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{unwrap(content)}</div>

        <div
          style={{
            position: 'absolute',
            bottom: 44,
            fontSize: 24,
            letterSpacing: 4,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: FONT.mono,
          }}
        >
          {footer}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  )
}

/** The mono line above a card's heading, in the site's kicker style. */
export function OgKicker({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 34,
        letterSpacing: 10,
        color: 'rgba(255,255,255,0.45)',
        marginBottom: 18,
        textTransform: 'uppercase',
        fontFamily: FONT.mono,
      }}
    >
      {children}
    </div>
  )
}
