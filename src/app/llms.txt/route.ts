import { CERTIFICATIONS, LINKS, SITE } from '@/lib/constants'
import { publishedStudies } from '@/lib/case-studies'
import { ROUTES } from '@/lib/routes'
import { CLIENT_WORK, PRODUCTS, actionOf, type Work } from '@/lib/work'

/**
 * /llms.txt (llmstxt.org): what the site says, as markdown, for agents that
 * don't run JavaScript. The home page's server HTML is an empty boot shell,
 * so without this an agent reading the site learns nothing.
 *
 * Built at build time from the same data every card renders, so it can say
 * nothing the site doesn't. No phone number, ever.
 *
 * needs Roman: there is no role line. One goes under the summary only once
 * JOB_TITLE (src/lib/structured-data.ts, from the chrome stream) holds a title
 * he has confirmed; until then it is null and nothing is printed.
 */
export const dynamic = 'force-static'

const url = (path: string) => (path === ROUTES.home ? SITE.url : `${SITE.url}${path}`)

/** "[Title](url)" for a piece with a public address, the bare title otherwise. */
const titled = (work: Work) => (work.url ? `[${work.title}](${work.url})` : work.title)

/** The card's own action label: the domain, "App Store", or where an unlaunched piece stands. */
const workLine = (work: Work) => `- ${titled(work)} (${actionOf(work).label}): ${work.description}`

function productLine(work: Work): string {
  const parts = [work.tagline, work.status ? `Status: ${work.status}` : null, work.url ? null : 'Private build']
  return `- ${titled(work)}: ${parts.filter(Boolean).join('. ')}. ${work.description}`
}

export function GET() {
  const notes = publishedStudies()
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Work',
    '',
    ...CLIENT_WORK.map(workLine),
    '',
    '## Products',
    '',
    ...PRODUCTS.map(productLine),
    '',
    '## Certifications',
    '',
    ...CERTIFICATIONS.map((cert) => `- Salesforce Certified ${cert.name} (${cert.date})`),
    '',
    ...(notes.length
      ? ['## Program notes', '', ...notes.map((s) => `- [${s.title}](${url(`${ROUTES.works}/${s.slug}`)})`), '']
      : []),
    '## Links',
    '',
    `- [Home](${url(ROUTES.home)})`,
    `- [All work](${url(ROUTES.works)})`,
    `- [Liner notes: how this site is built](${url(ROUTES.colophon)})`,
    `- [GitHub](${LINKS.github})`,
    `- [LinkedIn](${LINKS.linkedin})`,
    `- [Email](mailto:${LINKS.email})`,
    '',
  ]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
