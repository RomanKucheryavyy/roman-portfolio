import { Cinzel, Cormorant_Garamond } from 'next/font/google'

/**
 * The Roman type, shared by the intro (intro.tsx) and the products' title
 * cards, self-hosted by next/font like Geist (font-src 'self'; no request
 * leaves the origin):
 *
 * - Cinzel: Roman inscriptional capitals, for the wordmark.
 * - Cormorant Garamond, upright and italic: the serif (the tagline, the
 *   brand, the counter).
 * - The UI face stays the site's Geist.
 *
 * Both are variable fonts (one file per style). preload is off: the intro
 * shows at most once in 12 hours and the title cards sit below the first
 * screen, so a preload link would make every visitor fetch about 100 KB of
 * type before the page is up for something most visits never show. Their
 * @font-face rules are in the page's CSS, so a face is fetched the moment
 * text uses it or the intro asks for it (fontFaces below). display: block
 * keeps the big word from flashing in a fallback face.
 */
const cinzel = Cinzel({ subsets: ['latin'], display: 'block', preload: false })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], style: ['normal', 'italic'], display: 'block', preload: false })

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
  `400 1em ${ROMAN_FONTS.serif}`,
  `italic 400 1em ${ROMAN_FONTS.serif}`,
]

/** Starts fetching the Roman faces (each at most once; failures are ignored). */
export function loadRomanFaces(): void {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  for (const face of ROMAN_FACES) document.fonts.load(face).catch(() => {})
}
