import { FONT, OG_CONTENT_TYPE, OG_SIZE, OgKicker, keyGradient, ogImage } from '../_og/frame'
import { SITE } from '@/lib/constants'
import { keyOf, kickerOf, nextKeyOf } from '@/lib/score'
import { CLIENT_WORK, counterOf } from '@/lib/work'

/** /works' own share card: the setlist itself, every title in the site's counter format. */
export const alt = `The Setlist: ${CLIENT_WORK.length} pieces by ${SITE.name}`
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function WorksOpengraphImage() {
  return ogImage(
    <>
      <OgKicker>{kickerOf('symphony')}</OgKicker>
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          fontFamily: FONT.display,
          letterSpacing: -2,
          display: 'flex',
        }}
      >
        The
        <span
          style={{
            marginLeft: 24,
            backgroundImage: keyGradient(keyOf('symphony'), nextKeyOf('symphony')),
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Setlist
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: 1080,
          marginTop: 30,
          rowGap: 12,
        }}
      >
        {CLIENT_WORK.map((work, i) => (
          <div key={work.id} style={{ display: 'flex', alignItems: 'baseline', width: 360, fontFamily: FONT.mono }}>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginRight: 12 }}>
              {counterOf(i, CLIENT_WORK.length)}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{work.title}</span>
          </div>
        ))}
      </div>
    </>,
    { footer: 'romankucheryavyy.com/works' },
  )
}
