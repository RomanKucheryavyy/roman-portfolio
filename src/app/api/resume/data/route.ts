import { NextResponse } from 'next/server'
import { clientIp, rateLimited, LIMITS } from '@/lib/rate-limit'
import { RESUME_DATA } from '@/lib/resume-data'

/**
 * The résumé builder's data, behind the PIN.
 *
 * The builder page is a client component and used to import RESUME_DATA
 * directly, so the phone number and the case metrics shipped in the public
 * /resume JS chunk: the PIN hid them from people, not from anyone reading the
 * bundle. The data now lives only on the server and leaves it only for the
 * right PIN.
 *
 * Same comparison and the same rate-limit bucket as verify-pin, so this is not
 * a second, separately budgeted way to guess the PIN.
 */
export async function POST(req: Request) {
  if (rateLimited(clientIp(req), LIMITS.pin)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const { pin } = await req.json()
    if (typeof pin === 'string' && process.env.RESUME_PIN && pin === process.env.RESUME_PIN) {
      return NextResponse.json(RESUME_DATA, { headers: { 'Cache-Control': 'private, no-store' } })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
