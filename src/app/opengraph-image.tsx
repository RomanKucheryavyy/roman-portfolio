import { ImageResponse } from 'next/og'
import { HIS_WORDS, SITE } from '@/lib/constants'
import { SITE_CARD } from '@/lib/seo'
import { FONT, OG_CONTENT_TYPE, OG_SIZE, STAGE, ogFonts } from './_og/frame'

/** One alt for the card, wherever it is named (seo.ts SITE_CARD). */
export const alt = SITE_CARD.alt
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

const [first, ...rest] = SITE.name.split(' ')

/**
 * The site card, drawn like the Stage's first screen, a page of the print:
 * his name in Cinzel capitals as the hero sets it (ROMAN, then the surname
 * at a third of its size, spaced out to the same measure), his tagline in
 * Cormorant italic above it, the wash welling up from the floor as the
 * print's flood (never a light from above), and the address in gold at the
 * foot.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: STAGE.ground,
          color: STAGE.ink,
          fontFamily: FONT.sans,
        }}
      >
        {/* The print's flood, welling up from the floor. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 420,
            background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${STAGE.wash} 0%, ${STAGE.wash}59 45%, ${STAGE.ground}00 80%)`,
          }}
        />
        <div style={{ display: 'flex', marginBottom: 46, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 34, color: STAGE.muted }}>
          {HIS_WORDS.tagline}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: FONT.roman,
            fontWeight: 500,
            textTransform: 'uppercase',
            lineHeight: 0.82,
          }}
        >
          <div style={{ display: 'flex', fontSize: 196, letterSpacing: 12, paddingLeft: 12 }}>{first}</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 63, letterSpacing: 34, paddingLeft: 34, color: STAGE.text }}>
            {rest.join(' ')}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            fontFamily: FONT.mono,
            fontSize: 22,
            letterSpacing: 4,
            color: STAGE.gold,
          }}
        >
          {SITE.url.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  )
}
