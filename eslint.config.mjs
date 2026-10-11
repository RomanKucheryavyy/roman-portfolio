import next from 'eslint-config-next'

/**
 * There was no ESLint config in the repo at all, so `npm run lint` had never
 * actually linted anything: Next 16 dropped `next lint`, `next build` no longer
 * lints, and ESLint 9 wants a flat config. This is that config.
 */

/**
 * The type and ink guard. Two class patterns are on their way out, and new
 * code must not add more of them:
 *
 * - `text-[Npx]` / `text-[N.Nrem]`: use a type step (text-label, text-small,
 *   text-body, text-lead) or, for display type, Tailwind's ramp from text-2xl.
 * - `text-white/NN`: use an ink role (text-ink-body, text-ink-meta,
 *   text-ink-faint), or text-white for primary type.
 *
 * Both are warnings, not errors, while the streams migrate their own files;
 * W12 turns them into errors. Legitimate exceptions (SVG axis ticks, the
 * résumé's print preview) take an inline
 * `// eslint-disable-next-line no-restricted-syntax -- constraint 7`.
 *
 * The slash in the second pattern is written /: esquery ends a selector
 * regex at the first `/`, escaped or not.
 */
const ARBITRARY_SIZE = '/\\btext-\\[\\d/'
const WHITE_ALPHA = '/\\btext-white\\u002F\\d/'
const SIZE_MESSAGE = 'Use a type step (text-label / text-small / text-body / text-lead) instead of an arbitrary text-[N] size.'
const INK_MESSAGE = 'Use an ink token (text-ink-body / text-ink-meta / text-ink-faint) instead of text-white/NN.'

const typeAndInkGuard = {
  files: ['**/*.{js,jsx,mjs,ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'warn',
      { selector: `Literal[value=${ARBITRARY_SIZE}]`, message: SIZE_MESSAGE },
      { selector: `TemplateElement[value.raw=${ARBITRARY_SIZE}]`, message: SIZE_MESSAGE },
      { selector: `Literal[value=${WHITE_ALPHA}]`, message: INK_MESSAGE },
      { selector: `TemplateElement[value.raw=${WHITE_ALPHA}]`, message: INK_MESSAGE },
    ],
  },
}

/** Exempt at file level: the protected hero and ocean, and two drawings whose sizes are the design. */
const typeAndInkExempt = {
  files: [
    'src/components/sections/Hero.tsx',
    'src/components/ui/fft-ocean.tsx',
    'src/components/ui/fft-ocean-utils/**',
    'src/components/canvas/DNAHelix.tsx',
    'src/components/ui/Loader.tsx',
  ],
  rules: { 'no-restricted-syntax': 'off' },
}

const config = [
  // .claude/worktrees holds agents' throwaway checkouts during local sessions.
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts', '.claude/worktrees/**', 'test-results/**', 'playwright-report/**'] },
  ...next,
  typeAndInkGuard,
  typeAndInkExempt,
]

export default config
