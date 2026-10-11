import { NextResponse } from 'next/server'
import { pinMatches } from '@/lib/env'
import { clientIp, rateLimited, LIMITS } from '@/lib/rate-limit'

export async function POST(req: Request) {
  if (rateLimited(clientIp(req), LIMITS.pin)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const { pin } = await req.json()
    if (pinMatches(pin)) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
