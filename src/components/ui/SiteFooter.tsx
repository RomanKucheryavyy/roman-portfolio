import Link from 'next/link'
import { BootInert, FooterCopyButton } from '@/components/ui/SiteChrome'
import { BUILD_TIME, REPO_URL, commitUrl, sha7 } from '@/lib/build-info'
import { LINKS, SITE } from '@/lib/constants'
import { RESUME_HREF, ROUTES } from '@/lib/routes'

const LINK = 'inline-flex min-h-11 items-center transition-colors hover:text-white focus-visible:text-white'
const PART = 'flex items-center whitespace-nowrap'

/** The stamp's separator, spaced like the gap before it. */
function Dot({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`mr-2 ${className}`}>
      ·
    </span>
  )
}

/**
 * The foot of every route: a real build stamp and the ways out.
 *
 * The © line used to be part of the contact section, so only the home page
 * had one, and its "Built with" note was hand-typed. The stamp here is this
 * build's own commit (Netlify's COMMIT_REF, through build-info.ts), linked to
 * the public repo, or "local build" when there is none. Nothing in it is
 * typed by hand.
 *
 * Hidden from md up on a page with a full-screen stage (the /works wheel
 * marks its stage with data-stage), where there is no "below" to put it.
 */
export default function SiteFooter() {
  const built = BUILD_TIME ? new Date(BUILD_TIME) : null
  const year = (built ?? new Date()).getFullYear()
  const day = built ? built.toISOString().slice(0, 10) : null
  const sha = sha7()

  return (
    <BootInert>
      <footer className="relative z-10 border-t border-white/10 px-[clamp(1.5rem,5vw,4rem)] md:[body:has([data-stage])_&]:hidden">
        {/* One row only from xl: below that the stamp and the links don't
            both fit on a line, and the stamp broke in the middle. */}
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 py-6 font-mono text-label text-ink-meta xl:flex-row xl:items-center xl:justify-between xl:gap-6">
          {/* Each part carries the dot before it and never breaks inside, so
              a line that wraps starts on a part instead of ending on a dot.
              On a phone the name takes its own line and the build details
              the next, with no dot between them. */}
          <p className="flex flex-wrap items-center gap-x-2">
            <span className="whitespace-nowrap max-md:basis-full">
              © {year} {SITE.name}
            </span>
            <span className={PART}>
              <Dot className="max-md:hidden" />
              {sha ? `build ${sha}` : 'local build'}
            </span>
            {day && (
              <span className={PART}>
                <Dot />
                <time dateTime={BUILD_TIME}>{day}</time>
              </span>
            )}
            <span className={PART}>
              <Dot />
              <a href={commitUrl ?? REPO_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
                source<span aria-hidden="true">&nbsp;↗</span>
              </a>
            </span>
          </p>
          <ul className="flex flex-wrap items-center gap-x-5">
            <li>
              <Link href={ROUTES.works} className={LINK}>
                All work
              </Link>
            </li>
            <li>
              {/* No prefetch: on a build without /colophon yet (it lands with
                  the proof routes), every page would log a 404 for it. */}
              <Link href={ROUTES.colophon} prefetch={false} className={LINK}>
                Liner notes
              </Link>
            </li>
            {RESUME_HREF && (
              <li>
                <Link href={RESUME_HREF} className={LINK}>
                  Résumé
                </Link>
              </li>
            )}
            <li>
              <a href={LINKS.github} target="_blank" rel="noopener noreferrer" className={LINK}>
                github
              </a>
            </li>
            <li>
              <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={LINK}>
                linkedin
              </a>
            </li>
            <li>
              <FooterCopyButton text={LINKS.email} />
            </li>
          </ul>
        </div>
      </footer>
    </BootInert>
  )
}
