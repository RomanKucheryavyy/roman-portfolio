import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { pin } = await req.json()
    if (typeof pin === 'string' && process.env.RESUME_PIN && pin === process.env.RESUME_PIN) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
