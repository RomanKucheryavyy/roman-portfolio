import { ImageResponse } from 'next/og'
import { FONT, STAGE, ogFonts } from './_og/frame'

/** The home-screen icon: his initials in the Stage's heavy Geist, on its black. */
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
          backgroundColor: STAGE.black,
          color: STAGE.ink,
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 84,
          letterSpacing: -5,
        }}
      >
        RK
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  )
}
