/**
 * Where the report-only Content-Security-Policy sends its violation reports
 * (next.config.ts: report-uri, and report-to through Reporting-Endpoints).
 * Without an endpoint the policy collected nothing outside a DevTools console,
 * so a deploy preview had no log to read before the policy is enforced. Each
 * report is logged on the server, one line, and nothing is stored or sent on.
 * It reads no environment and answers 204 whatever it is given.
 */

/** Longer than any real report; anything past it is not read. */
const MAX_BYTES = 16_384

type Violation = Record<string, unknown>

/** The violations in a body, in either format: the legacy `application/csp-report`
 *  object, or a Reporting API `application/reports+json` array. */
function violationsOf(body: unknown): Violation[] {
  if (Array.isArray(body)) {
    return body
      .filter((r): r is { type?: unknown; body?: unknown } => !!r && typeof r === 'object')
      .filter((r) => r.type === 'csp-violation' && !!r.body && typeof r.body === 'object')
      .map((r) => r.body as Violation)
  }
  if (body && typeof body === 'object' && 'csp-report' in body) {
    const report = (body as { 'csp-report': unknown })['csp-report']
    return report && typeof report === 'object' ? [report as Violation] : []
  }
  return []
}

const field = (v: Violation, ...keys: string[]) => {
  for (const key of keys) if (typeof v[key] === 'string' || typeof v[key] === 'number') return String(v[key]).slice(0, 200)
  return '?'
}

export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, MAX_BYTES)
    for (const v of violationsOf(JSON.parse(text))) {
      console.warn(
        `[csp-report] ${field(v, 'effectiveDirective', 'effective-directive', 'violated-directive')} blocked ${field(v, 'blockedURL', 'blocked-uri')} on ${field(v, 'documentURL', 'document-uri')} (${field(v, 'sourceFile', 'source-file')}:${field(v, 'lineNumber', 'line-number')})`,
      )
    }
  } catch {
    // Not JSON, or not a report: nothing to log.
  }
  return new Response(null, { status: 204 })
}
