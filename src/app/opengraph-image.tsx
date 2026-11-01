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
 * The site card, drawn like the Stage's first screen: his name in heavy
 * Geist on the ground, his tagline under it, the wash glowing up from the
 * stage floor as light, and the address in gold at the foot.
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
        {/* The wash, rising from the floor as light. */}
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 150,
            fontWeight: 700,
            lineHeight: 0.86,
            letterSpacing: -9,
          }}
        >
          <div style={{ display: 'flex' }}>{first}</div>
          <div style={{ display: 'flex' }}>{rest.join(' ')}</div>
        </div>
        <div style={{ display: 'flex', marginTop: 44, fontSize: 28, color: STAGE.muted }}>
          {HIS_WORDS.tagline}
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
