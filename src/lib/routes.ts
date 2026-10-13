import { LINKS } from '@/lib/links'

/** The site's pages. Every internal link to one of these reads it from here. */
export const ROUTES = {
  home: '/',
  works: '/works',
  colophon: '/colophon',
} as const

/**
 * Whether the résumé is a public page (Option A) or Roman's private, PIN-gated
 * builder (Option B, the default until he chooses). Everything that would link
 * a visitor to it — nav, menu, footer, the contact form's attach line, the
 * sitemap — reads the hrefs below and shows nothing while they are null.
 * needs Roman: Option A or B.
 */
export const RESUME_PUBLIC: boolean = false

export const RESUME_HREF: string | null = RESUME_PUBLIC ? '/resume' : null
export const RESUME_PDF_HREF: string | null = RESUME_PUBLIC ? '/resume.pdf' : null

/** While the résumé is private, a visitor asks for it by email instead. */
export const RESUME_REQUEST = `mailto:${LINKS.email}?subject=${encodeURIComponent('Résumé request')}`

/**
 * A link to a home-page section from anywhere: "#compose" on the home page
 * itself (so the browser scrolls instead of navigating), "/#compose" elsewhere.
 */
export function sectionHref(id: string, pathname: string): string {
  return pathname === ROUTES.home ? `#${id}` : `${ROUTES.home}#${id}`
}
