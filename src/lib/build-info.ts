/**
 * Which commit this build is, so the footer and the colophon can say so and
 * link it. Netlify sets COMMIT_REF and CONTEXT at build time; next.config.ts
 * copies them into BUILD_SHA, BUILD_TIME and BUILD_CONTEXT so they are inlined
 * everywhere. A local build has no SHA, and every surface then says "local build"
 * instead of inventing one.
 */

/** The public repo: any visitor can open a commit or a file in it. */
export const REPO_URL = 'https://github.com/RomanKucheryavyy/roman-portfolio'

export const BUILD_SHA: string = process.env.BUILD_SHA || process.env.COMMIT_REF || ''

/** ISO time of the build, or '' when unknown. */
export const BUILD_TIME: string = process.env.BUILD_TIME || ''

/** "production", "deploy-preview", "branch-deploy", or "local". */
export const BUILD_CONTEXT: string = process.env.BUILD_CONTEXT || process.env.CONTEXT || 'local'

/** "abc1234def…" → "abc1234". Empty for a local build. */
export function sha7(sha: string = BUILD_SHA): string {
  return sha.slice(0, 7)
}

export function commitUrlOf(sha: string): string {
  return `${REPO_URL}/commit/${sha}`
}

/** This build's commit on GitHub, or null for a local build. */
export const commitUrl: string | null = BUILD_SHA ? commitUrlOf(BUILD_SHA) : null

/**
 * A file in the repo, optionally at a line or a range: ".../blob/<ref>/<path>#L3-L9".
 * `ref` defaults to this build's commit (or main for a local build), so the
 * lines are the ones this build was made from.
 */
export function blobUrlOf(path: string, lines?: number | [number, number], ref: string = BUILD_SHA || 'main'): string {
  const anchor = lines === undefined ? '' : Array.isArray(lines) ? `#L${lines[0]}-L${lines[1]}` : `#L${lines}`
  return `${REPO_URL}/blob/${ref}/${path.replace(/^\//, '')}${anchor}`
}
