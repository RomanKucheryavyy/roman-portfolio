import type { OldMastersPalette } from '@/components/ui/old-masters-preloader'

/**
 * The palette: the one source of the page's colours, for the intro and the
 * products' title cards (IMPERIAL, below) and for the rest of the Stage
 * (look.ts turns these into its CSS variables, and globals.css names them
 * as Tailwind colours). Plain values, so the server-only 404, the share
 * images and the contact emails can read them too. The keys name what each
 * colour does, not its hue, so a new palette is a change here and in
 * globals.css's :root alone.
 *
 * Today's palette is "Chiaroscuro", an Old Masters dark: a warm umber
 * ground, the statues printed as warm sepia, gold reading as light falling
 * on the scene. Every text colour clears WCAG AA on both the wash and the
 * ground: text 13.2:1 on the wash and 17.3:1 on the ground, muted 7.2:1 and
 * 9.5:1, gold 7.5:1 and 9.9:1, marble 13.0:1 and 17.0:1.
 *
 * globals.css repeats the ground, the wash, the gold and the marble for what
 * loads before any of this (the intro's gate, the skip link): keep them in
 * step.
 */
export const PALETTE = {
  /** The page's ground, and the print's deepest shadow. */
  ground: '#0b0806',
  /**
   * The wash: light and glow, never a large flat panel. The flood of the
   * intro's print, the hero's and the title cards', the glows behind
   * things; a fill only at low alpha or graded into the ground.
   */
  wash: '#352114',
  /** Gold, the one accent: numerals, the focus ring, small marks, links' underline. Never a large fill. */
  gold: '#d6b25e',
  /** The rare highlight (a primary button's hover, a link's). */
  glow: '#ffdf9e',
  /** Marble: headings and primary text. */
  marble: '#f2ece2',
  /** Body text. */
  text: '#f3eee6',
  /** Secondary text. */
  muted: '#bfb19b',
  /** Edges that do a job (a form field's), at partial alpha on the ground. */
  rule: '#5e4630',
  /** The lit marble of the two-ink print. */
  highlight: '#f0e2c8',
  /** The deepest shadow a surface casts (darker than the ground). */
  shadow: '#040302',
} as const

/**
 * Struck gold, for Act IV's rank (rank-honour.tsx): the gold and its glow
 * with the darker shades the laurel's gradient and its edge need, and the
 * sheen that crosses the rank's name. Drawing only, never text: the rank's
 * words are the palette's gold, muted and marble.
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
 * lit statue (marble on marble had no edge at all). In the stage's own
 * ground (--om-ground, which the component sets from IMPERIAL.ground).
 */
export const WORD_HALO =
  '[&_.om-word]:[filter:drop-shadow(0_0_1.5px_color-mix(in_srgb,var(--om-ground)_95%,transparent))_drop-shadow(0_0_10px_var(--om-ground-c))_drop-shadow(0_4px_22px_var(--om-ground-c))]'

/** The look of the old-masters stages (the intro, the products' title cards, the hero's painting): gold light on a two-ink print over the wash. */
export const IMPERIAL: OldMastersPalette = {
  /** The wash, once the stage has flooded. */
  stage: PALETTE.wash,
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
