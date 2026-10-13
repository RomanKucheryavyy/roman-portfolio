import HomeClient from './HomeClient'
import { notesHrefs } from '@/lib/case-studies'
import { CERTIFICATIONS, LINKS, SITE } from '@/lib/constants'
import { ROUTES } from '@/lib/routes'
import { movementOf } from '@/lib/score'
import { pageMetadata } from '@/lib/seo'
import { CLIENT_WORK, PRODUCTS, actionOf } from '@/lib/work'

// images: false, so the root segment's own opengraph-image / twitter-image
// files supply the card with its hash, size and alt.
export const metadata = pageMetadata({ path: ROUTES.home, images: false })

const H2 = 'mt-12 mb-4 font-display text-2xl font-bold tracking-tight text-white'
const ITEM = 'text-small text-ink-body'
const LINK = 'text-white underline decoration-ink-faint underline-offset-4 hover:decoration-white'

/**
 * The home page. Everything a visitor sees is client-rendered (HomeClient waits
 * for hydration before it draws anything), so without this the server HTML of
 * the site's main page said nothing at all: no name, no work, no way to get in
 * touch. The <noscript> summary is that HTML for a crawler, a link unfurler or
 * a browser with scripts off. Every line is read from the same data the page
 * draws.
 */
export default function Home() {
  return (
    <>
      <HomeClient notesHrefs={notesHrefs()} />
      <noscript>
        {/* HomeClient's pre-hydration screen never lifts without scripts:
            without this it covered the summary's footer and held a blank
            screen above it. */}
        <style>{'[data-boot-screen]{display:none}'}</style>
        <main id="main" className="relative z-[201] min-h-svh bg-black px-[clamp(1.5rem,5vw,4rem)] py-14 md:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">{SITE.name}</h1>
            <p className="mt-4 max-w-lg text-body text-ink-body">{SITE.description}</p>

            <h2 className={H2}>{movementOf('symphony').label}</h2>
            <ul className="space-y-2">
              {CLIENT_WORK.map((work) => {
                const action = actionOf(work)
                return (
                  <li key={work.id} className={ITEM}>
                    <span className="text-white">{work.title}</span>
                    {' · '}
                    {'href' in action ? (
                      <a href={action.href} className={LINK}>
                        {action.label}
                      </a>
                    ) : (
                      action.label
                    )}
                  </li>
                )
              })}
            </ul>

            <h2 className={H2}>{movementOf('compositions').label}</h2>
            <ul className="space-y-2">
              {PRODUCTS.map((product) => (
                <li key={product.id} className={ITEM}>
                  <span className="text-white">{product.title}</span>
                  {product.tagline ? ` · ${product.tagline}` : null}
                </li>
              ))}
            </ul>

            <h2 className={H2}>{movementOf('measures').label}</h2>
            <ul className="space-y-2">
              {CERTIFICATIONS.map((cert) => (
                <li key={cert.id} className={ITEM}>
                  Salesforce {cert.name} · {cert.date}
                </li>
              ))}
            </ul>

            <p className="mt-12 flex flex-wrap gap-x-6 gap-y-2 font-mono text-label text-ink-meta">
              <a href={ROUTES.works} className={LINK}>
                All work
              </a>
              <a href={`mailto:${LINKS.email}`} className={LINK}>
                {LINKS.email}
              </a>
              <a href={LINKS.linkedin} className={LINK}>
                LinkedIn
              </a>
              <a href={LINKS.github} className={LINK}>
                GitHub
              </a>
            </p>
          </div>
        </main>
      </noscript>
    </>
  )
}
