/**
 * A best-effort per-IP throttle.
 *
 * Extracted from the contact route, which was the only endpoint that had one.
 * The two resume endpoints call Claude with max_tokens 8000 and bill a real
 * account, and the PIN check guarding them was brute-forceable at line rate —
 * all three were wide open.
 *
 * Serverless instances are short-lived and not shared, so this trims bursts
 * rather than promising a hard limit. That is the right trade for a portfolio:
 * it stops a script, not a determined attacker, and it costs no infrastructure.
 */

interface Bucket {
  /** Namespaces the counter. Without it every endpoint shares one tally per
   *  IP, so failed PIN attempts would spend the AI allowance. */
  name: string
  windowMs: number
  max: number
}

const hits = new Map<string, number[]>()

/** Reads the caller's address from whichever header the host actually sets. */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-nf-client-connection-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

/**
 * Returns true when this key has exceeded its allowance and should be refused.
 * Call once per request — it records the attempt as a side effect.
 */
export function rateLimited(ip: string, { name, windowMs, max }: Bucket): boolean {
  const now = Date.now()
  const key = `${name}:${ip}`
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    }
  }

  return recent.length > max
}

/** Allowances, kept together so the costs are visible in one place. */
export const LIMITS = {
  /** Cheap, but a lead is worth more than a blocked bot. */
  contact: { name: 'contact', windowMs: 10 * 60_000, max: 5 },
  /** Guards a short numeric PIN — the tightest of the three. */
  pin: { name: 'pin', windowMs: 10 * 60_000, max: 8 },
  /** Each call is an 8k-token Claude completion on Roman's account. */
  ai: { name: 'ai', windowMs: 60 * 60_000, max: 10 },
} as const
