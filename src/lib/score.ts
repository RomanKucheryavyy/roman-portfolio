/**
 * The score: every movement on the home page, named once.
 *
 * Each section used to carry its own name in three or four places (its kicker,
 * the nav, the transition caption before it, the scroll staff), and they
 * drifted: the third section's kicker said "Original Works" while the nav said
 * "Compositions". Everything that names a movement reads this table instead,
 * so renaming one is a one-line edit here.
 *
 * - `label` is the plain noun a recruiter scans for (the kicker, the nav's
 *   front face).
 * - `score` is the musical name (every H2, the nav's flip face).
 * - `key` is the movement's spectrum colour, in scale order from the hero's
 *   red round to the purple of the last movement, which resolves back to red.
 *   A heading's accent runs from its own key to the next movement's key.
 * - `caption` is the code comment on the transition into the movement.
 */

export type MovementId = 'hero' | 'measures' | 'symphony' | 'compositions' | 'interlude' | 'conductor' | 'compose'

/** The seven `--color-spectrum-*` tokens in globals.css. */
export type SpectrumKey = 'red' | 'orange' | 'amber' | 'green' | 'teal' | 'blue' | 'purple'

export interface Movement {
  id: MovementId
  /** "01" to "05" for the numbered movements; null for the hero and the interlude. */
  numeral: string | null
  label: string | null
  score: string | null
  key: SpectrumKey
  caption: string | null
}

export interface NumberedMovement extends Movement {
  numeral: string
  label: string
  score: string
}

/** In page order. */
export const MOVEMENTS: readonly Movement[] = [
  // The overture keeps the animated full spectrum; red is where the scale starts.
  { id: 'hero', numeral: null, label: null, score: null, key: 'red', caption: null },
  { id: 'measures', numeral: '01', label: 'Credentials', score: 'Measures', key: 'orange', caption: '// loading credentials...' },
  { id: 'symphony', numeral: '02', label: 'Work', score: 'Symphony', key: 'amber', caption: '/* compiling the work */' },
  { id: 'compositions', numeral: '03', label: 'Products', score: 'Compositions', key: 'green', caption: '// premiering the compositions...' },
  { id: 'interlude', numeral: null, label: null, score: null, key: 'teal', caption: '/* decoding signal */' },
  { id: 'conductor', numeral: '04', label: 'About', score: 'Conductor', key: 'blue', caption: '// the conductor speaks...' },
  { id: 'compose', numeral: '05', label: 'Contact', score: 'Compose', key: 'purple', caption: '/* opening a channel */' },
]

/** The five movements with a numeral, in order: the nav's items and the kickers. */
export const NUMBERED: readonly NumberedMovement[] = MOVEMENTS.filter(
  (m): m is NumberedMovement => m.numeral !== null && m.label !== null && m.score !== null,
)

export function movementOf(id: MovementId): Movement {
  const movement = MOVEMENTS.find((m) => m.id === id)
  if (!movement) throw new Error(`score.ts: no movement "${id}"`)
  return movement
}

/**
 * The kicker above a movement's heading: `// 01. Credentials`. The unnumbered
 * movements fall back to their id (`// interlude`), the form the interlude
 * already uses.
 */
export function kickerOf(id: MovementId): string {
  const m = movementOf(id)
  return m.numeral && m.label ? `// ${m.numeral}. ${m.label}` : `// ${m.id}`
}

export function keyOf(id: MovementId): SpectrumKey {
  return movementOf(id).key
}

/** The key of the movement after this one. The last movement resolves to the hero's red. */
export function nextKeyOf(id: MovementId): SpectrumKey {
  const i = MOVEMENTS.findIndex((m) => m.id === id)
  return MOVEMENTS[(i + 1) % MOVEMENTS.length].key
}

/** The CSS colour for a key, as a reference to its token (never a hex literal). */
export function keyColor(key: SpectrumKey): string {
  return `var(--color-spectrum-${key})`
}
