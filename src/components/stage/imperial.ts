import type { OldMastersPalette } from '@/components/ui/old-masters-preloader'

/**
 * The imperial palette: the one source of the page's colours, for the
 * intro and the products' title cards (IMPERIAL, below) and for the rest of
 * the Stage (look.ts turns these into its CSS variables). Plain values, so
 * the server-only 404 and the contact emails can read them too. Every text
 * colour clears WCAG AA on both the violet and the ground: text 13.8:1 on
 * the violet and 17.5:1 on the ground, muted 7.5:1 and 9.5:1, gold 7.9:1
 * and 10.0:1, marble 13.6:1 and 17.2:1.
 *
 * globals.css repeats the ground, the gold and the violet for what loads
 * before any of this (the intro's gate, the skip link): keep them in step.
 */
export const PALETTE = {
  /** The page's ground, and the print's deepest shadow. */
  ground: '#07050f',
  /** Imperial violet: washes, glows, the curtain, fills at low alpha. */
  violet: '#24115e',
  /** Gold, the one accent: numerals, rules, the focus ring, small marks. Never a large fill. */
  gold: '#d6b25e',
  /** The rare highlight. */
  glow: '#ffdf9e',
  /** Marble: headings and primary text. */
  marble: '#f2ece2',
  /** Body text. */
  text: '#f3eee6',
  /** Secondary text: a lavender grey. */
  muted: '#b6acd6',
  /** Borders and dividers (at partial alpha on the ground). */
  rule: '#4b3a8a',
  /** The lit marble of the two-ink print. */
  highlight: '#efe3cc',
} as const

/**
 * Struck gold, for Act IV's rank (rank-honour.tsx): the gold and its glow
 * with the darker shades the laurel's gradient and its edge need, and the
 * sheen that crosses the rank's name. Drawing only, never text: the rank's
 * words are the palette's gold, lavender and marble.
 */
export const GILT = {
  sheen: '#fff4d6',
  light: PALETTE.glow,
  gold: PALETTE.gold,
  deep: '#9c7633',
  shadow: '#5a3f14',
} as const

/**
 * The word's halo, set from outside on both stages: a tight dark edge round
 * each letter, then a soft one, so the marble word reads where it crosses a
 * lit statue (marble on marble had no edge at all).
 */
export const WORD_HALO =
  '[&_.om-word]:[filter:drop-shadow(0_0_1.5px_rgba(7,5,15,0.95))_drop-shadow(0_0_10px_rgba(7,5,15,0.6))_drop-shadow(0_4px_22px_rgba(7,5,15,0.6))]'

/** The imperial look of the old-masters stages (the intro, and the products' title cards): Roman purple and gold over marble. */
export const IMPERIAL: OldMastersPalette = {
  /** Imperial violet, once the stage has flooded. */
  stage: PALETTE.violet,
  /** The dark before the flood, and the print's deepest shadow. */
  ground: PALETTE.ground,
  text: PALETTE.text,
  muted: PALETTE.muted,
  /** Gold: the meander, the stars, the tags. */
  accent: PALETTE.gold,
  /** Marble. */
  word: PALETTE.marble,
  rule: PALETTE.rule,
  glow: PALETTE.glow,
  highlight: PALETTE.highlight,
}
