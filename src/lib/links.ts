/**
 * Where to find Roman, and nothing else, so the chrome every route loads (the
 * nav, its menu, routes.ts) can import it without pulling in constants.ts:
 * the whole work list with its descriptions, the certifications and the
 * roles, which /colophon and the 404 never draw. constants.ts re-exports it.
 */
export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  email: 'kucheryavyyroman@gmail.com',
} as const
