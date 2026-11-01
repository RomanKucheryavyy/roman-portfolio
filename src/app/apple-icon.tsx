import { ImageResponse } from 'next/og'
import { FONT, STAGE, ogFonts } from './_og/frame'

/** The home-screen icon: the page's monogram, R·K in Cinzel, marble on its ground with the point in gold (the top bar's and the intro's). */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: STAGE.ground,
          color: STAGE.ink,
          fontFamily: FONT.roman,
          fontWeight: 500,
          fontSize: 76,
          letterSpacing: 4,
        }}
      >
        R<span style={{ color: STAGE.gold }}>·</span>K
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
