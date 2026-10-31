import { Cinzel, Cormorant_Garamond } from 'next/font/google'

/**
 * The Roman type: the one place its faces are declared, for the whole Stage
 * (the hero, the top bar, every section's header), the intro, the products'
 * title cards, and the 404 and error pages. Self-hosted by next/font like
 * Geist (font-src 'self'; no request leaves the origin):
 *
 * - Cinzel: Roman inscriptional capitals (lowercase draws as small
 *   capitals), for the name, the titles and the numerals. Tailwind's
 *   `font-roman` (globals.css), through --font-cinzel.
 * - Cormorant Garamond, italic and upright: the serif, for his voice (the
 *   tagline, the sections' intros; in the intro, the brand and the
 *   counter). Tailwind's `font-serif`, through --font-cormorant.
 * - The UI face stays the site's Geist.
 *
 * ROMAN_TYPE puts both variables on <html> (layout.tsx), as Geist's are:
 * the root 404 and error boundary sit in every route's module graph, so
 * they could not import a face of their own without Next preloading it, and
 * the stylesheet next/font makes for it, on every route anyway. One set of
 * rules for the whole site also keeps the faces single: two @font-face sets
 * for one family on a page make document.fonts.load() (the intro's, and the
 * title cards') fetch both. The preloads below are on every route
 * therefore; /resume, which draws none of it, also prefetches them through
 * its link home.
 *
 * Both are variable fonts, one latin file per style: Cinzel 25.9 kB,
 * Cormorant 37.8 kB upright and 39.3 kB italic. What the first screen draws
 * is preloaded: Cinzel (the hero's name, its largest text) and Cormorant's
 * italic (the tagline). Its upright, which only the intro's counter draws,
 * is a declaration of its own, never preloaded: next/font preloads a
 * declaration whole. Both declare the family under its own name, so the
 * browser holds the two styles as one family, and ROMAN_FONTS.serif and
 * `font-serif` reach either. Measured on a throttled phone connection
 * (390x844, 150 ms, 1.6 Mbps, three runs each): with the italic preloaded
 * the tagline's face is in at about 1.0-1.3 s instead of 1.9-2.0 s, and
 * the largest paint (the name, about 1.1-1.4 s) does not move; preloading
 * both styles, 77 kB, pushed Cinzel and the largest paint back by
 * 0.1-0.2 s. display: block keeps the big words from flashing in a
 * fallback face.
 */
const cinzel = Cinzel({ subsets: ['latin'], display: 'block', variable: '--font-cinzel' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], style: ['italic'], display: 'block', variable: '--font-cormorant' })
const cormorantUpright = Cormorant_Garamond({ subsets: ['latin'], style: ['normal'], display: 'block', preload: false })

/** The class that defines --font-cinzel and --font-cormorant: on <html> (layout.tsx). */
export const ROMAN_TYPE = `${cinzel.variable} ${cormorant.variable}`

/** The faces as old-masters-preloader's `fonts` prop takes them (its [site edit] 1). */
export const ROMAN_FONTS = {
  face: { family: cinzel.style.fontFamily, weight: 500, tracking: 0.06 },
  serif: cormorant.style.fontFamily,
  ui: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
}

/**
 * The FontFaceSet descriptors that fetch every face the component draws
 * with, so a page can start them before the component's chunk arrives.
 */
export const ROMAN_FACES = [
  `${ROMAN_FONTS.face.weight} 1em ${ROMAN_FONTS.face.family}`,
  `400 1em ${cormorantUpright.style.fontFamily}`,
  `italic 400 1em ${ROMAN_FONTS.serif}`,
]

/** Starts fetching the Roman faces (each at most once; failures are ignored). */
export function loadRomanFaces(): void {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  for (const face of ROMAN_FACES) document.fonts.load(face).catch(() => {})
}
