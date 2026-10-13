import { SITE_CARD } from '@/lib/seo'
import { BRAND_GRADIENT, FONT, OG_CONTENT_TYPE, OG_SIZE, OgKicker, ogImage } from './_og/frame'

/** One alt for the card, wherever it is named (seo.ts SITE_CARD). */
export const alt = SITE_CARD.alt
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function OpengraphImage() {
  return ogImage(
    <>
      <OgKicker>{'// Orchestrating Logic & Art'}</OgKicker>
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          fontFamily: FONT.display,
          color: '#ffffff',
          letterSpacing: -2,
          display: 'flex',
        }}
      >
        Roman
        <span
          style={{
            marginLeft: 28,
            backgroundImage: BRAND_GRADIENT,
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Kucheryavyy
        </span>
      </div>
      <div
        style={{
          // 28, not 30: in Space Grotesk at 30 the line ran to within 30px of the edges.
          fontSize: 28,
          color: 'rgba(255,255,255,0.55)',
          marginTop: 26,
          display: 'flex',
        }}
      >
        Salesforce engineer by day. Full-stack builder by nature. Conductor by calling.
      </div>
    </>,
  )
}
