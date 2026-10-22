import next from 'eslint-config-next'

/**
 * There was no ESLint config in the repo at all, so `npm run lint` had never
 * actually linted anything: Next 16 dropped `next lint`, `next build` no longer
 * lints, and ESLint 9 wants a flat config. This is that config.
 */

/**
 * The 21st.dev components in src/components/ui, as their authors published
 * them: a component is edited only where it cannot work otherwise, so lint
 * findings in them are not fixed in place. React Compiler's render-purity
 * rules flag patterns they use on purpose (refs read during render for
 * measured layout, a `this` in d3 code), so those three rules are off for
 * these files only. Everything else still applies to them.
 */
const publishedComponents = {
  files: [
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
    'src/components/ui/contact-with-globe.tsx',
    'src/components/ui/footer-section-5.tsx',
    'src/components/ui/kokonut-*.tsx',
    'src/components/ui/kokonut-*-utils/**',
    'src/components/ui/lifeline.tsx',
    'src/components/ui/lifeline-utils/**',
    'src/components/ui/portfolio-hero-physics.tsx',
    'src/components/ui/stacking-cards.tsx',
    'src/components/ui/toolchain-marquee.tsx',
    'src/components/ui/toolchain-marquee-utils/**',
  ],
  rules: {
    'react-hooks/refs': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/unsupported-syntax': 'off',
  },
}

const config = [
  // .claude/worktrees holds agents' throwaway checkouts during local sessions.
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts', '.claude/worktrees/**', 'test-results/**', 'playwright-report/**', 'design-lab/**'] },
  ...next,
  publishedComponents,
]

export default config
