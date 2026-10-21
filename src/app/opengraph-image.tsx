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
 * Geist on the black, his tagline under it, the violet accent glowing up from
 * the stage floor, and the address at the foot.
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
          backgroundColor: STAGE.black,
          color: STAGE.ink,
          fontFamily: FONT.sans,
        }}
      >
        {/* The violet wash, rising from the floor. */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 420,
            background: `radial-gradient(ellipse 60% 100% at 50% 100%, ${STAGE.accent} 0%, rgba(22,16,109,0.35) 45%, rgba(6,6,6,0) 80%)`,
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
        <div style={{ display: 'flex', marginTop: 44, fontSize: 28, color: 'rgba(250,250,250,0.75)' }}>
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
            color: STAGE.accentInk,
          }}
        >
          {SITE.url.replace(/^https?:\/\//, '')}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  )
}
