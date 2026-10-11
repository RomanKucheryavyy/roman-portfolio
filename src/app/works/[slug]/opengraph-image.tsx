import { notFound } from 'next/navigation'
import { FONT, OG_CONTENT_TYPE, OG_SIZE, OgKicker, keyGradient, ogImage } from '../../_og/frame'
import { publishedStudies, studyOf } from '@/lib/case-studies'
import { ROUTES } from '@/lib/routes'
import { actionOf } from '@/lib/work'
import { keysOf, splitTitle, workFor } from './study'

/** A program-notes page's share card: the kicker, the piece's title in its key, and one line of what it is. */
export const alt = 'Program notes by Roman Kucheryavyy'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

/**
 * Like the page: only published slugs get a card, and any other slug is a 404,
 * never an on-demand render. twitter-image.tsx declares this again, because
 * Next reads route segment config from each file's own source, not re-exports.
 */
export const dynamicParams = false

export function generateStaticParams() {
  return publishedStudies().map((study) => ({ slug: study.slug }))
}

export default async function ProgramNotesImage({ params }: { params: Promise<{ slug: string }> }) {
  const study = studyOf((await params).slug)
  // Belt and braces with dynamicParams: a 404, not a thrown 500 and a logged function error.
  if (!study?.published) notFound()
  const work = workFor(study)
  const title = splitTitle(study.title)
  const [from, to] = keysOf(work)
  const line = work.tagline ?? work.status ?? actionOf(work).label

  return ogImage(
    <>
      <OgKicker>{'// program notes'}</OgKicker>
      <div
        style={{
          fontSize: 88,
          fontWeight: 900,
          fontFamily: FONT.display,
          letterSpacing: -2,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 1040,
        }}
      >
        {title.lead ? <span style={{ marginRight: 24 }}>{title.lead}</span> : null}
        <span style={{ backgroundImage: keyGradient(from, to), backgroundClip: 'text', color: 'transparent' }}>
          {title.accent}
        </span>
      </div>
      <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.55)', marginTop: 26, display: 'flex' }}>{line}</div>
    </>,
    { footer: `romankucheryavyy.com${ROUTES.works}/${study.slug}` },
  )
}
