import { CLIENT_WORK, appStoreIdOf } from '@/lib/work'

/**
 * Live facts about Roman's App Store app, from Apple's public iTunes Lookup API
 * (no key needed). Every surface that shows a rating reads it from here, so
 * the number is never typed into the site and never goes stale.
 *
 * On any failure every field is null, and the UI shows nothing: a stale or
 * invented rating is worse than none.
 */
export interface AppStoreFacts {
  /** Average star rating, 0–5. Null when nobody has rated it yet. */
  rating: number | null
  /** Number of ratings (not written reviews). */
  count: number | null
  /** The current version, "1.1.4". */
  version: string | null
  /** ISO time the current version was released. */
  updated: string | null
  /** ISO time the app first appeared on the App Store. */
  firstRelease: string | null
  /** ISO time Apple served this answer: what "checked <date>" means. */
  checkedAt: string | null
}

/** Six hours, the same as the GitHub staff. Route files repeat the literal (Next needs it static). */
export const APP_STORE_REVALIDATE = 21600

const EMPTY: AppStoreFacts = {
  rating: null,
  count: null,
  version: null,
  updated: null,
  firstRelease: null,
  checkedAt: null,
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const iso = (v: unknown) => {
  const s = str(v)
  return s && !Number.isNaN(Date.parse(s)) ? new Date(s).toISOString() : null
}

/**
 * The id of the site's app: the one PROJECTS entry with `isApp`, read out of its
 * App Store link. APP_STORE_ID_OVERRIDE replaces it for tests ("0" finds
 * nothing, which is how the failure path is exercised end to end).
 */
export function siteAppStoreId(): string | null {
  const override = process.env.APP_STORE_ID_OVERRIDE
  if (override) return override
  const app = CLIENT_WORK.find((w) => w.isApp)
  return app ? appStoreIdOf(app) : null
}

export async function getAppStoreFacts(id: string | null): Promise<AppStoreFacts> {
  if (!id || !/^\d+$/.test(id)) return { ...EMPTY }
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=us`, {
      next: { revalidate: APP_STORE_REVALIDATE },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`iTunes Lookup responded ${res.status}`)
    const body: unknown = await res.json()
    const result = (body as { results?: unknown[] } | null)?.results?.[0] as Record<string, unknown> | undefined
    if (!result) throw new Error(`iTunes Lookup has no app with id ${id}`)

    const count = num(result.userRatingCount)
    return {
      // Apple reports an average of 0 for an app nobody has rated; that is no rating.
      rating: count ? num(result.averageUserRating) : null,
      count,
      version: str(result.version),
      updated: iso(result.currentVersionReleaseDate),
      firstRelease: iso(result.releaseDate),
      // A cached answer keeps Apple's Date header, so this is when it was really checked.
      checkedAt: iso(res.headers?.get('date')) ?? new Date().toISOString(),
    }
  } catch (err) {
    console.warn('[app-store] lookup failed:', err instanceof Error ? err.message : err)
    return { ...EMPTY }
  }
}
