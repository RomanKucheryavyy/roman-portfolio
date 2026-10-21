import { Stage } from '@/components/stage/stage'
import { Container } from '@/components/stage/section-header'
import { CERTIFICATIONS, EDUCATION, PERSON, PRODUCTS, PROJECTS, ROLES, linkLabel } from '@/lib/content'
import { ROUTES } from '@/lib/routes'
import { pageMetadata } from '@/lib/seo'
import { jsonLd, siteGraph } from '@/lib/structured-data'

// images: false, so the root segment's own opengraph-image / twitter-image
// files supply the card with its hash, size and alt.
export const metadata = pageMetadata({ path: ROUTES.home, images: false })

const H3 = 'mt-10 text-lg font-semibold tracking-tight text-foreground'
const ITEM = 'text-sm leading-relaxed text-muted-foreground'
const LINK = 'text-foreground underline underline-offset-4'

/**
 * Without scripts the Stage still renders its server HTML, but the pieces
 * that only exist in the browser stay out: the certification badges, the
 * Experience timeline, the About block, the contact card and the footer
 * (the last four load after the page; see "lazy parts" in stage.tsx). This
 * is the whole page in plain text for that visitor, and for anything that
 * reads the HTML without running it. Every line comes from the same records
 * the page draws.
 */
function Summary() {
  return (
    <noscript>
      <section aria-labelledby="summary-title" className="border-t border-white/[0.06] py-16 md:py-24">
        <Container>
          <h2 id="summary-title" className="text-[2.5rem] font-bold leading-[0.95] tracking-[-0.045em] md:text-7xl">
            At a glance
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{PERSON.tagline}</p>

          <h3 className={H3}>Client work</h3>
          <ul className="mt-3 space-y-1.5">
            {PROJECTS.map((project) => (
              <li key={project.id} className={ITEM}>
                <span className="text-foreground">{project.title}</span>
                {' · '}
                {project.url ? (
                  <a href={project.url} className={LINK}>
                    {linkLabel(project)}
                  </a>
                ) : (
                  linkLabel(project)
                )}
              </li>
            ))}
          </ul>

          <h3 className={H3}>My own products</h3>
          <ul className="mt-3 space-y-1.5">
            {PRODUCTS.map((product) => (
              <li key={product.id} className={ITEM}>
                <span className="text-foreground">{product.title}</span> · {product.tagline} · {product.status}
              </li>
            ))}
          </ul>

          <h3 className={H3}>Experience</h3>
          <ul className="mt-3 space-y-1.5">
            {ROLES.map((role) => (
              <li key={`${role.company}-${role.start}`} className={ITEM}>
                <span className="text-foreground">{role.title}</span> · {[role.company, role.team].filter(Boolean).join(', ')} ·{' '}
                {role.dates}
              </li>
            ))}
            {EDUCATION.map((school) => (
              <li key={school.school} className={ITEM}>
                <span className="text-foreground">{school.degree}</span> · {school.school} · {school.start} – {school.end}
              </li>
            ))}
          </ul>

          <h3 className={H3}>Salesforce certifications</h3>
          <ul className="mt-3 space-y-1.5">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert.id} className={ITEM}>
                {cert.name} · {cert.date}
              </li>
            ))}
          </ul>

          <h3 className={H3}>In my own words</h3>
          {PERSON.about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className={`mt-3 max-w-2xl ${ITEM}`}>
              {paragraph}
            </p>
          ))}
          <p className={`mt-3 max-w-2xl ${ITEM}`}>{PERSON.manifesto}</p>

          <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href={`mailto:${PERSON.links.email}`} className={LINK}>
              {PERSON.links.email}
            </a>
            <a href={PERSON.links.linkedin} className={LINK}>
              LinkedIn
            </a>
            <a href={PERSON.links.github} className={LINK}>
              GitHub
            </a>
          </p>
        </Container>
      </section>
    </noscript>
  )
}

/**
 * The home page: the Stage (client components, rendered on the server as
 * well), the site's JSON-LD, and the summary above for visitors without
 * scripts.
 */
export default function Home() {
  return (
    <>
      <Stage>
        <Summary />
      </Stage>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteGraph()) }} />
    </>
  )
}
