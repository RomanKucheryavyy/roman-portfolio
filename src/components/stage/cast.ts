/**
 * The cast: three of the four photographs kedhareswer/old-masters-preloader
 * stages by default, all from Unsplash (free to use under the Unsplash License),
 * served from this origin (public/images/cast/, written by
 * scripts/fetch-cast.mjs). The alt texts and the credits are the
 * component's own (its DEFAULT_FIGURES); nothing here names more than it
 * did. The fourth, the component's marble figure holding flowers, is left
 * out (Roman, 2026-10-31: "can we remove the girl tho cuz she looks
 * naked").
 *
 * The two figures are pre-keyed: their alpha comes from their luminance
 * through the component's own transfer, so they show only the statue even
 * where a browser ignores the component's CSS mask. The David is the
 * backdrop, opaque (the component greys, darkens and blurs it).
 *
 * Plain values: the intro (intro.tsx) and the products' title cards read
 * them, and the data spec can check them in Node.
 */

export interface CastPhoto {
  /** Served from this origin. */
  src: string
  /** The component's alt text; "" for the backdrop, which is decoration. */
  alt: string
  /** The photographer, as the component credits them (on Unsplash). */
  credit: string
  /** The Unsplash photo id the file was made from. */
  photo: string
  /** The file's size in pixels. */
  width: number
  height: number
}

export const CAST = {
  apollo: {
    src: '/images/cast/apollo.webp',
    alt: 'The Apollo Belvedere, a cloak over one arm',
    credit: 'Nayani Teixeira',
    photo: '1574359587026-daf1bfd26baa',
    width: 2103,
    height: 1600,
  },
  hercules: {
    src: '/images/cast/hercules.webp',
    alt: 'The torso of a marble Hercules',
    credit: 'Şafak Atalay',
    photo: '1567522874215-d5e2f1bee83d',
    width: 2133,
    height: 1600,
  },
  david: {
    src: '/images/cast/david-backdrop.webp',
    alt: '',
    credit: 'Jack Hunter',
    photo: '1601887389937-0b02c26b602c',
    width: 1200,
    height: 2133,
  },
} as const satisfies Record<string, CastPhoto>

/**
 * Where to stand a figure (its centre, in percent of the stage's width, as
 * old-masters-preloader places it) `h` percent of the stage's height tall so
 * that its right edge falls just past the stage's: for a photograph that
 * cuts its statue off at that side (Apollo's arm), so the cut never shows.
 * Mirror it (100 - x) for the left.
 */
export function pastEdge(photo: CastPhoto, h: number, stageW: number, stageH: number): number {
  if (!(stageW > 0) || !(stageH > 0)) return 0
  const half = ((h / 100) * stageH * (photo.width / photo.height)) / 2
  return Math.ceil(((stageW - half) / stageW) * 100) + 1
}
