/** The site's pages. The home page is the whole public site; /resume is Roman's private builder. */
export const ROUTES = {
  home: '/',
} as const

/**
 * Whether the résumé is a public page (Option A) or Roman's private, PIN-gated
 * builder (Option B, the default until he chooses). Everything that would
 * advertise it (the sitemap, robots.txt) reads the href below and lists
 * nothing while it is null.
 * needs Roman: Option A or B.
 */
export const RESUME_PUBLIC: boolean = false

export const RESUME_HREF: string | null = RESUME_PUBLIC ? '/resume' : null
