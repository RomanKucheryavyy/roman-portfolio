import type { CSSProperties } from 'react'
import { PALETTE } from './imperial'

/**
 * The Stage's look, the "Imperial Stage": the intro's palette (imperial.ts)
 * and type (roman-type.ts) carried onto the whole page, shared by the page
 * itself (stage.tsx) and the pages outside it (the 404 and the error page),
 * so all of them are one ground, one wash, one gold and one focus ring.
 * Plain values: no client code, so the server-only 404 (and the contact
 * emails) can use them without shipping anything.
 *
 * STAGE_STYLE re-points shadcn's tokens on the wrapper, and adds the
 * Stage's own. Every value is PALETTE's (imperial.ts), so the names say
 * what a colour does and imperial.ts says what it is:
 *
 * - --background: the ground (the intro's dark before the flood).
 * - --foreground: marble, for headings and primary text.
 * - --muted-foreground: the muted ink, for secondary text.
 * - --border / --input: the rule, at 60% on the ground: a field's edge.
 * - --primary / --primary-foreground: marble with ground ink, so a stock
 *   shadcn Button reads as the Stage's primary until it takes stageButton().
 * - --accent / --accent-foreground: an outline Button's hover, in the wash.
 * - --stage-wash: the wash, for light and glow (the curtain's lit fold, the
 *   glows behind things); a fill only at low alpha or graded into the ground.
 * - --stage-gold: gold, the one accent: act numerals, links' underline,
 *   small marks, the focus ring. Never a large fill.
 * - --stage-glow: the rare highlight (a primary button's hover, a link's).
 * - --stage-rule: the rule at full strength, for a firmer edge.
 * - --stage-text: body copy where marble would be too strong.
 * - --stage-shadow: the deepest shadow a surface casts.
 * - --ring: gold.
 *
 * In classes they are Tailwind colours (globals.css): text-gold, bg-wash/40,
 * hover:text-glow, border-rule/60, with shadcn's foreground, muted-foreground
 * and background.
 */
export const STAGE_STYLE = {
  '--background': PALETTE.ground,
  '--foreground': PALETTE.marble,
  '--muted-foreground': PALETTE.muted,
  '--border': `${PALETTE.rule}99`,
  '--input': `${PALETTE.rule}99`,
  '--primary': PALETTE.marble,
  '--primary-foreground': PALETTE.ground,
  '--accent': PALETTE.wash,
  '--accent-foreground': PALETTE.marble,
  '--stage-wash': PALETTE.wash,
  '--stage-gold': PALETTE.gold,
  '--stage-glow': PALETTE.glow,
  '--stage-rule': PALETTE.rule,
  '--stage-text': PALETTE.text,
  '--stage-shadow': PALETTE.shadow,
  '--ring': PALETTE.gold,
} as CSSProperties

/** One focus ring for every link and button inside: gold, 2px, clear of the shape. */
export const STAGE_FOCUS =
  '[&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-gold'

/** The stage's light for a page with no curtain (the 404, the error page): the wash falling from above, graded into the ground. */
export const WASH =
  'pointer-events-none absolute inset-x-0 top-0 h-[70svh] bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--stage-wash)_85%,transparent),transparent)]'

/** The small line above every heading, after the act's numeral: Geist capitals, muted. */
export const KICKER = 'font-sans text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground'

/** The act's numeral, in gold Cinzel ("II"), and the short gold hairline after it. */
export const NUMERAL = 'font-roman text-[2rem] font-medium leading-none tracking-[0.04em] text-gold md:text-[2.5rem]'
export const HAIRLINE = 'h-px w-10 shrink-0 bg-gold/65 md:w-14'

/** Every section heading's display type: Cinzel, marble (lowercase draws as small capitals). */
export const DISPLAY =
  'font-roman text-[2.125rem] font-medium leading-[1.08] tracking-[0.015em] text-balance text-foreground sm:text-5xl md:text-[3.75rem] lg:text-[4.25rem]'

/** The intro under a heading: his voice, Cormorant italic, muted (20px and up: it is small on the body). */
export const INTRO = 'max-w-xl font-serif text-xl italic leading-snug text-muted-foreground text-pretty md:text-[1.625rem]'

/**
 * The Stage's button, the intro's ENTER: rectangular, a 1px edge, a 2px
 * radius, Geist capitals with wide tracking. `primary` is marble with ground
 * ink (glow on hover); `secondary` is a gold edge on the dark. `sm` is for a
 * row's own link. A class string for a plain <a> or <button>, so the
 * server-only 404 can use it too; the focus ring is the wrapper's
 * (STAGE_FOCUS).
 */
const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-[2px] border font-sans font-medium uppercase transition-[background-color,border-color,color] duration-300 [&_svg]:pointer-events-none [&_svg]:shrink-0'
const BUTTON_SIZE = {
  md: 'h-11 px-5 text-xs tracking-[0.2em] sm:px-7 sm:tracking-[0.24em] [&_svg]:size-3.5',
  sm: 'h-9 px-4 text-[11px] tracking-[0.2em] [&_svg]:size-3',
} as const
const BUTTON_KIND = {
  primary:
    'border-foreground bg-foreground text-background hover:border-glow hover:bg-glow',
  secondary:
    'border-gold/70 bg-background/45 text-foreground hover:border-gold hover:bg-gold/12 hover:text-glow',
} as const

export function stageButton(kind: keyof typeof BUTTON_KIND = 'primary', size: keyof typeof BUTTON_SIZE = 'md'): string {
  return `${BUTTON_BASE} ${BUTTON_SIZE[size]} ${BUTTON_KIND[kind]}`
}
