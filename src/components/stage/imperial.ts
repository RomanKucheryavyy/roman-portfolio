import type { OldMastersPalette } from '@/components/ui/old-masters-preloader'

/**
 * The word's halo, set from outside on both stages: a tight dark edge round
 * each letter, then a soft one, so the marble word reads where it crosses a
 * lit statue (marble on marble had no edge at all).
 */
export const WORD_HALO =
  '[&_.om-word]:[filter:drop-shadow(0_0_1.5px_rgba(7,5,15,0.95))_drop-shadow(0_0_10px_rgba(7,5,15,0.6))_drop-shadow(0_4px_22px_rgba(7,5,15,0.6))]'

/**
 * The imperial look of the old-masters stages (the intro, and the products'
 * title cards): Roman purple and gold over marble, in the Stage's own
 * family (its black, its deep violet --stage-accent #16106d and its ink
 * #9d94ff; look.ts). Every text colour clears WCAG AA on both: text 13.8:1
 * on the stage and 17.5:1 on the ground, muted 7.5:1 and 9.5:1, accent
 * 7.9:1 and 10.0:1.
 */
export const IMPERIAL: OldMastersPalette = {
  /** Imperial violet, once the stage has flooded. */
  stage: '#24115e',
  /** The dark before the flood, and the print's deepest shadow. */
  ground: '#07050f',
  text: '#f3eee6',
  muted: '#b6acd6',
  /** Gold: the meander, the stars, the tags. */
  accent: '#d6b25e',
  /** Marble. */
  word: '#f2ece2',
  rule: '#4b3a8a',
  glow: '#ffdf9e',
  /** The lit marble of the two-ink print. */
  highlight: '#efe3cc',
}
