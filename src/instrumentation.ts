/**
 * Runs once when a server instance starts (next start, and each cold start of
 * a Netlify function). It logs one line naming the features that are off and
 * the settings being ignored, so a missing key shows up in the deploy log
 * instead of as a contact form that quietly falls back to mailto, or a
 * résumé builder that refuses every PIN.
 *
 * It warns and never throws: CI and deploy previews run with no keys at all,
 * and that is a supported way to run the site.
 */
export async function register() {
  // env.ts uses node:crypto, and the edge runtime has nothing to report.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  try {
    const { describeFeatures, featureReport, hasDisabledFeatures } = await import('./lib/env')
    const report = featureReport()
    const line = describeFeatures(report)
    if (hasDisabledFeatures(report)) console.warn(line)
    else console.info(line)
  } catch (err) {
    console.warn('[env] feature report failed:', err)
  }
}
