import next from 'eslint-config-next'

/**
 * There was no ESLint config in the repo at all, so `npm run lint` had never
 * actually linted anything: Next 16 dropped `next lint`, `next build` no longer
 * lints, and ESLint 9 wants a flat config. This is that config.
 */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts'] },
  ...next,
]

export default config
