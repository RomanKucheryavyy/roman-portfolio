import { ImageResponse } from 'next/og'
import { FONT, ogFonts } from './_og/frame'

/** The home-screen icon: the favicon's RK, in the site's own mono, on black. */
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
          backgroundColor: '#000000',
          color: '#ffffff',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 76,
          letterSpacing: -2,
        }}
      >
        RK
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
