import { CERTIFICATIONS, EDUCATION, PERSON, PRODUCTS, PROJECTS, RANK, ROLES, linkLabel, type Product, type Project } from '@/lib/content'

/**
 * /llms.txt (llmstxt.org): what the home page says, as markdown, for agents
 * that would rather not parse it. Built at build time from the same records
 * the page draws (src/lib/content.ts), so it can say nothing the page
 * doesn't. Public facts only: no phone number, ever.
 */
export const dynamic = 'force-static'

/** "[Title](url)" for a piece with a public address, the bare title otherwise. */
const titled = (item: { title: string; url?: string }) => (item.url ? `[${item.title}](${item.url})` : item.title)

/** The card's own link label: the domain, "App Store", or where an unlaunched piece stands. */
const workLine = (p: Project) => `- ${titled(p)} (${linkLabel(p)}): ${p.description}`

const productLine = (p: Product) => `- ${titled(p)}: ${p.tagline}. Status: ${p.status}. ${p.description}`

export function GET() {
  const lines = [
    `# ${PERSON.name}`,
    '',
    `> ${PERSON.tagline}`,
    '',
    '## Client work',
    '',
    ...PROJECTS.map(workLine),
    '',
    '## My own products',
    '',
    ...PRODUCTS.map(productLine),
    '',
    '## Experience',
    '',
    ...ROLES.map((r) => `- ${r.title}, ${[r.company, r.team].filter(Boolean).join(', ')} (${r.dates})`),
    ...EDUCATION.map((e) => `- ${e.degree}, ${e.school} (${e.start} – ${e.end})`),
    '',
    `## ${RANK.platform}`,
    '',
    `- ${RANK.name}: ${RANK.standing}`,
    '',
    '## Certifications',
    '',
    ...CERTIFICATIONS.map((cert) => `- Salesforce Certified ${cert.name} (${cert.date})`),
    '',
    '## Links',
    '',
    `- [Home](${PERSON.url})`,
    `- [GitHub](${PERSON.links.github})`,
    `- [LinkedIn](${PERSON.links.linkedin})`,
    `- [Email](mailto:${PERSON.links.email})`,
    '',
  ]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
