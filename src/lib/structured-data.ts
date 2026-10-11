import { CERTIFICATIONS, LINKS, SITE, TECH_SKILLS } from '@/lib/constants'
import { CURRENT_ROLE } from '@/lib/site-facts'

/**
 * The site's JSON-LD: who Roman is and which site is his, for search engines
 * and link unfurlers. One @graph, rendered once by the root layout.
 *
 * Only what the repo states. There are no ratings anywhere (a Person or a
 * WebSite with an aggregateRating is a claim nobody can check), no contact
 * details beyond the public profiles, and no job title until Roman picks the
 * exact string.
 */

/** needs Roman: the exact job title for structured data and llms.txt. Until then neither states one. */
export const JOB_TITLE: string | null = null

export const PERSON_ID = `${SITE.url}#person`
export const WEBSITE_ID = `${SITE.url}#website`

export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: SITE.name,
        url: SITE.url,
        sameAs: [LINKS.linkedin, LINKS.github],
        ...(JOB_TITLE ? { jobTitle: JOB_TITLE } : {}),
        worksFor: { '@type': 'Organization', name: CURRENT_ROLE.company },
        // source: resume-data.ts:34 ("Auburn, WA 98092"); Compose.tsx shows "Auburn, WA (PT)".
        address: { '@type': 'PostalAddress', addressLocality: 'Auburn', addressRegion: 'WA' },
        knowsAbout: [...TECH_SKILLS],
        hasCredential: CERTIFICATIONS.map((cert) => ({
          '@type': 'EducationalOccupationalCredential',
          name: `Salesforce Certified ${cert.name}`,
          credentialCategory: 'certification',
          recognizedBy: { '@type': 'Organization', name: 'Salesforce' },
          ...(cert.verifyUrl ? { url: cert.verifyUrl } : {}),
        })),
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'en-US',
        publisher: { '@id': PERSON_ID },
      },
    ],
  }
}

/**
 * JSON for a <script type="application/ld+json">, with every `<` escaped so
 * no string in the data can close the script element early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
