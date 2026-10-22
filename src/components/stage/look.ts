import type { CSSProperties } from 'react'

/**
 * The Stage's page look, shared by the page itself (stage.tsx) and the pages
 * outside it (the 404 and the error page), so all three are one black, one
 * violet and one focus ring. Plain values: no client code, so the server-only
 * 404 can use them without shipping anything.
 *
 * - --background: Stage black (the About block's own #060606, so the
 *   sections meet without a seam).
 * - --stage-accent / --stage-accent-ink: the one accent (the violet wash that
 *   block's glow already uses), as a fill and as an ink that reads on black.
 * - --ring: lifts shadcn's focus ring from dark grey to near white.
 */
export const STAGE_STYLE = {
  '--background': '#060606',
  '--stage-accent': '#16106d',
  '--stage-accent-ink': '#9d94ff',
  '--ring': 'oklch(0.95 0 0)',
} as CSSProperties

/** One focus ring for every link and button inside: the violet ink, clear of the shape. */
export const STAGE_FOCUS =
  '[&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[var(--stage-accent-ink)]'

/** The small line above every heading: the act in violet, then the kicker. */
export const KICKER = 'text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground'

/** Every section heading's display type. */
export const DISPLAY = 'text-[2.5rem] font-bold leading-[0.95] tracking-[-0.045em] text-balance md:text-7xl'

/** The intro under a heading. */
export const INTRO = 'max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg'
