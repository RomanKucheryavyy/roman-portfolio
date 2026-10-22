/**
 * Where to find Roman, and nothing else, in a module of its own so anything
 * that needs only an address can import it without the whole of
 * constants.ts (the work, the certifications, the roles). constants.ts
 * re-exports it; content.ts hands it to the Stage as PERSON.links.
 */
export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  email: 'kucheryavyyroman@gmail.com',
} as const
