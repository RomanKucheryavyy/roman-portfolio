import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageBlock } from '@/app/_components/PageBlock'
import { PageHeader, SectionShell } from '@/components/ui/SectionShell'
import FactList from '@/components/ui/FactList'
import WorkCard from '@/components/ui/WorkCard'
import { getAppStoreFacts, siteAppStoreId } from '@/lib/app-store'
import { assertPublishable, publishedStudies, studyOf } from '@/lib/case-studies'
import { ROUTES } from '@/lib/routes'
import { pageMetadata } from '@/lib/seo'
import {
  citeOf,
  factsOf,
  keysOf,
  liveRatingOf,
  numberedBlocks,
  positionOf,
  splitTitle,
  structuredDataOf,
  workFor,
} from './study'

/**
 * Program notes: one case study per piece, where every sentence carries a
 * footnote to something a stranger can open (a commit, a file, the App Store
 * listing, the live site, or Roman's dated confirmation).
 *
 * Only published studies get a page, and a published study must pass
 * assertPublishable(): the build fails, naming the slug and every open gap,
 * rather than shipping a thin or speculative page. Every study is a draft
 * today, so no /works/<slug> exists outside the CASE_STUDY_FIXTURE build.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return publishedStudies().map((study) => {
    assertPublishable(study)
    return { slug: study.slug }
  })
}

type Props = { params: Promise<{ slug: string }> }

/** The study for a generated slug. Drafts and unknown slugs never reach here (dynamicParams). */
function publishedStudyOf(slug: string) {
  const study = studyOf(slug)
  return study?.published ? study : undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = publishedStudyOf((await params).slug)
  if (!study) return {}
  const work = workFor(study)
  return pageMetadata({
    path: `${ROUTES.works}/${study.slug}`,
    title: `Program notes: ${study.title}`,
    description: work.description,
    // The segment's own opengraph-image and twitter-image are the card.
    images: false,
  })
}

export default async function ProgramNotesPage({ params }: Props) {
  const study = publishedStudyOf((await params).slug)
  if (!study) notFound()
  const work = workFor(study)
  const { index, total } = positionOf(work)
  const title = splitTitle(study.title)
  const blocks = numberedBlocks(study)
  const claims = blocks.flatMap((block) => block.claims)
  const cites = claims.some((c) => c.source.kind === 'app-store')
  const facts = await getAppStoreFacts(cites ? siteAppStoreId() : null)
  const live = liveRatingOf(study, facts)

  return (
    <main id="main" tabIndex={-1} className="relative min-h-svh w-full bg-black outline-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredDataOf(study, work) }} />
      <SectionShell className="pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="mb-8 font-mono text-label text-ink-meta">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={ROUTES.works} className="inline-block py-1 transition-colors hover:text-white">
                works
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink-body">
              {study.title}
            </li>
          </ol>
        </nav>

        <PageHeader kicker="// program notes" lead={title.lead} accent={title.accent} keys={keysOf(work)} />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* The frontispiece: the same card every surface draws. Products keep
              their text card; they are private builds with nothing to shoot. */}
          <WorkCard
            work={work}
            index={index}
            total={total}
            size="lg"
            layout="stacked"
            titleAs="p"
            imageSizes="(max-width: 1024px) 92vw, 640px"
            imageLoading="eager"
          />
          <FactList items={factsOf(work)} bordered />
        </div>

        <div className="mt-12 md:mt-16">
          {blocks.map(({ key, letter, heading, claims: blockClaims }) => {
            // A block with nothing sourced to say is left out, never padded.
            if (blockClaims.length === 0) return null
            return (
              <PageBlock key={key} id={`block-${key}`} heading={heading} mark={letter}>
                <p className="text-body text-ink-body">
                  {blockClaims.map((claim) => (
                    <span key={claim.n}>
                      {claim.text}
                      <sup className="ml-0.5 font-mono text-label">
                        <a
                          id={`cite-${claim.n}`}
                          href={`#src-${claim.n}`}
                          aria-label={`Source ${claim.n}`}
                          className="text-ink-meta transition-colors hover:text-white"
                        >
                          {claim.n}
                        </a>
                      </sup>{' '}
                    </span>
                  ))}
                </p>
                {key === 'outcome' && live ? (
                  <p className="mt-3 font-mono text-label text-ink-meta">{live}</p>
                ) : null}
              </PageBlock>
            )
          })}
        </div>

        <section aria-labelledby="sources" className="border-t border-white/10 pt-8">
          <h2 id="sources" className="font-mono text-label uppercase tracking-[0.3em] text-ink-meta">
            Sources
          </h2>
          <ol className="mt-4 grid gap-2 text-small text-ink-body">
            {claims.map((claim) => {
              const cite = citeOf(claim.source, facts)
              return (
                <li key={claim.n} id={`src-${claim.n}`} className="flex gap-3 scroll-mt-28">
                  <span className="w-6 shrink-0 text-right font-mono text-label text-ink-meta">
                    {claim.n}.
                  </span>
                  <span className="min-w-0">
                    {cite.href ? (
                      <a href={cite.href} className="break-words underline decoration-white/25 underline-offset-4 transition-colors hover:text-white">
                        {cite.label}
                      </a>
                    ) : (
                      cite.label
                    )}
                    {cite.detail ? `, ${cite.detail}` : null}{' '}
                    <a
                      href={`#cite-${claim.n}`}
                      aria-label={`Back to claim ${claim.n}`}
                      className="font-mono text-label text-ink-meta transition-colors hover:text-white"
                    >
                      ↩
                    </a>
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      </SectionShell>
    </main>
  )
}
