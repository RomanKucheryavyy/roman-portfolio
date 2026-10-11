import { NextResponse } from 'next/server'
import { SITE } from '@/lib/constants'
import { contactFrom, contactTo, netlifyOrigin, resendApiKey } from '@/lib/env'
import { clientIp, rateLimited, LIMITS } from '@/lib/rate-limit'

/**
 * Contact delivery.
 *
 * The old form POSTed straight to `/` with a `form-name` field, Netlify Forms
 * style. That silently threw every message away: Netlify detects forms by
 * parsing the *static* HTML it publishes, and this site's page is a client
 * component that renders nothing but a loading shell until React mounts — so
 * the hidden registration form never made it into the build output and the
 * "contact" form was never registered. Worse, a POST to `/` on a Next runtime
 * site is answered by Next itself with a 200 and a page of HTML, so `res.ok`
 * was true and the UI played its whole "message sent — 250 OK" celebration
 * over a message that went nowhere.
 *
 * Two independent channels now, so a single missing key can't lose a lead:
 *   1. Resend — a real email, with the sender set as reply-to.
 *   2. Netlify Forms — a durable record in the site dashboard (and Netlify's
 *      own form notifications), posted to the static /__forms.html that makes
 *      build-time detection work on a Next site.
 *
 * If neither delivers, the route returns a 502 rather than a false success, and
 * the client falls back to opening the visitor's mail app with the message
 * pre-filled. Nothing pretends to have succeeded.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX = { name: 100, email: 200, message: 5000 } as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Strips CR/LF so a crafted name can't inject extra mail headers. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

interface Payload {
  name: string
  email: string
  message: string
}

/** A real email, via Resend's REST API — no SDK, same as the other sites. */
async function sendViaResend({ name, email, message }: Payload): Promise<boolean> {
  const key = resendApiKey()
  if (!key) return false

  // CONTACT_FROM: Resend's shared sender only delivers to the account owner's
  // own address. Verify romankucheryavyy.com in Resend to use the domain.
  const from = contactFrom()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: contactTo(),
        reply_to: email,
        subject: `Portfolio — ${oneLine(name)}`,
        text: `${message}\n\n— ${name} <${email}>\nSent from ${SITE.url}`,
        html: `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;line-height:1.6;color:#111">
  <p style="margin:0 0 4px"><strong>${esc(name)}</strong> &lt;<a href="mailto:${esc(email)}">${esc(email)}</a>&gt;</p>
  <p style="margin:0 0 16px;color:#666;font-size:12px">via ${esc(SITE.url)}</p>
  <div style="white-space:pre-wrap;border-left:3px solid #ddd;padding-left:14px">${esc(message)}</div>
</div>`,
      }),
    })
    if (!res.ok) {
      console.error('resend rejected the message:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('resend request failed:', err)
    return false
  }
}

/**
 * Records the submission in Netlify Forms. Posting to the published
 * /__forms.html is the documented way to use Netlify Forms from a Next app —
 * that static file is what build-time form detection actually reads.
 *
 * Confirmed against production: Netlify answers this with its "Thank you!"
 * page and the submission appears under Forms > contact. Two prerequisites are
 * easy to miss, and both look identical to a code bug from here — form
 * detection has to be enabled for the site, and a deploy has to run after it
 * is enabled, or the parser never sees __forms.html and this POST falls
 * through to the Next handler as a 404.
 */
async function recordInNetlifyForms({ name, email, message }: Payload): Promise<boolean> {
  // Netlify sets URL/DEPLOY_PRIME_URL; nothing else does. Without one of them we
  // are not on Netlify, and there is no form handler to post to — posting to a
  // local /__forms.html would just get the static file back and read as success.
  const origin = netlifyOrigin()
  if (!origin) return false
  try {
    const res = await fetch(`${origin}/__forms.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'form-name': 'contact', name, email, message }).toString(),
      redirect: 'manual',
    })
    // Netlify answers a handled submission with a 2xx or a redirect to the
    // success page. A 405 means the form was never registered at build time.
    return res.status < 400
  } catch (err) {
    console.error('netlify forms record failed:', err)
    return false
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name = str(body.name).slice(0, MAX.name)
  const email = str(body.email).slice(0, MAX.email)
  const message = str(body.message).slice(0, MAX.message)

  // Honeypot and too-fast submissions get a 200 and go in the bin. A 4xx would
  // tell a bot exactly which check it tripped.
  const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : Number.POSITIVE_INFINITY
  if (str(body.botField) || elapsedMs < 1500) {
    return NextResponse.json({ ok: true, delivered: [] })
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  // After validation, so a malformed post doesn't spend a visitor's allowance.
  if (rateLimited(clientIp(req), LIMITS.contact)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const payload: Payload = { name: oneLine(name), email: oneLine(email), message }

  // Both channels run together — one failing must not delay or block the other.
  const [emailed, recorded] = await Promise.all([
    sendViaResend(payload),
    recordInNetlifyForms(payload),
  ])

  const delivered = [emailed && 'email', recorded && 'forms'].filter(Boolean) as string[]

  if (!delivered.length) {
    // The reason belongs in the logs, not the response: which channels exist is
    // the site owner's business, and the visitor gets the same fallback either way.
    console.error(
      resendApiKey()
        ? 'contact: every delivery channel failed'
        : 'contact: no delivery channel configured — set RESEND_API_KEY, or register the contact form in Netlify',
    )
    return NextResponse.json({ error: 'delivery_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, delivered })
}
