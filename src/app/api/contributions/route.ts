import { NextResponse } from 'next/server'

export const revalidate = 21600 // 6h — GitHub activity doesn't need to be fresher

const USER = 'RomanKucheryavyy'

interface Day {
  date: string
  level: number
  count: number | null
}

/**
 * Reads the public GitHub contributions calendar (no token required) and
 * aggregates it into weekly totals for the "A Year in Measures" staff.
 * Falls back to data-level sums when exact counts can't be parsed.
 */
export async function GET() {
  try {
    const res = await fetch(`https://github.com/users/${USER}/contributions`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; romankucheryavyy.com)' },
      next: { revalidate },
    })
    if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
    const html = await res.text()

    const days = new Map<string, Day>()
    for (const tag of html.match(/<td[^>]*ContributionCalendar-day[^>]*>/g) ?? []) {
      const id = /id="([^"]+)"/.exec(tag)?.[1]
      const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(tag)?.[1]
      const level = /data-level="(\d)"/.exec(tag)?.[1]
      if (id && date && level) days.set(id, { date, level: Number(level), count: null })
    }

    const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)</g
    let tip: RegExpExecArray | null
    while ((tip = tipRe.exec(html))) {
      const day = days.get(tip[1])
      if (!day) continue
      const text = tip[2].trim()
      const n = /^(\d+)\s+contribution/.exec(text)
      if (n) day.count = Number(n[1])
      else if (/^No contributions/i.test(text)) day.count = 0
    }

    const sorted = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
    if (!sorted.length) throw new Error('no contribution days parsed')

    const haveCounts = sorted.some((d) => d.count !== null && d.count > 0)
    const weeks = new Map<string, number>()
    for (const day of sorted) {
      const d = new Date(`${day.date}T00:00:00Z`)
      const weekStart = new Date(d)
      weekStart.setUTCDate(d.getUTCDate() - d.getUTCDay()) // back to Sunday
      const key = weekStart.toISOString().slice(0, 10)
      const value = haveCounts ? (day.count ?? 0) : day.level
      weeks.set(key, (weeks.get(key) ?? 0) + value)
    }

    const weekList = [...weeks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([start, count]) => ({ start, count }))

    const total = haveCounts
      ? sorted.reduce((sum, d) => sum + (d.count ?? 0), 0)
      : null

    return NextResponse.json({ user: USER, total, approximate: !haveCounts, weeks: weekList })
  } catch (err) {
    console.error('contributions fetch failed:', err)
    return NextResponse.json({ user: USER, total: null, approximate: true, weeks: [] }, { status: 200 })
  }
}
