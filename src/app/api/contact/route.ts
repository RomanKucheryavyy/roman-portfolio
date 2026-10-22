import { NextResponse } from 'next/server'
import { ownerEmail, receiptEmail, type ContactMessage, type Email } from '@/lib/contact-email'
import { contactFrom, contactTo, netlifyOrigin, ownerAddress, receiptsEnabled, resendApiKey } from '@/lib/env'
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
 *
 * Once at least one channel has delivered, the visitor gets a receipt by
 * Resend, when receipts are on (src/lib/env.ts receiptsEnabled(): Resend
 * configured, and CONTACT_FROM on a domain of Roman's own, not resend.dev).
 * It repeats nothing they typed but a first name (src/lib/contact-email.ts
 * says why), and replies to it reach Roman. A receipt that fails is logged
 * and never fails the request: the message itself went.
 *
 * The contract:
 *   200 {ok: true, delivered: ('email' | 'forms')[], receipt: boolean}
 *       delivered names the channels that took the message, never empty;
 *       receipt is true only when Resend accepted the visitor's receipt.
 *   200 {ok: true, delivered: []}   honeypot or too fast: binned, unsent
 *   400 {error: 'invalid_body' | 'missing_fields' | 'invalid_email'}
 *   429 {error: 'rate_limited'}
 *   502 {error: 'delivery_failed'}  no channel delivered
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX = { name: 100, email: 200, message: 5000 } as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Strips CR/LF so a crafted name can't inject extra mail headers. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

/**
 * How long each outside call may take. Resend and Netlify answer in well
 * under a second; these only stop a hung call from holding the request until
 * the function itself times out, which would fail a message that had already
 * gone. The two channels run side by side on the longer wait, the receipt
 * follows on the shorter, and the whole stays under ten seconds.
 */
const TIMEOUT = { channel: 6000, receipt: 3000 } as const

/**
 * One email through Resend's REST API (no SDK, same as the other sites).
 * True when Resend accepted it. `what` names it in the logs.
 */
async function resend(
  what: string,
  key: string,
  email: Email & { to: string[]; replyTo: string },
  timeoutMs: number,
): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: contactFrom(),
        to: email.to,
        reply_to: email.replyTo,
        subject: oneLine(email.subject),
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) {
      console.error(`resend rejected the ${what}:`, res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error(`resend request for the ${what} failed:`, err)
    return false
  }
}

/** The message, to Roman, with the visitor as reply-to. */
async function sendViaResend(payload: ContactMessage, sentAt: Date): Promise<boolean> {
  const key = resendApiKey()
  if (!key) return false
  // CONTACT_FROM: Resend's shared sender only delivers to the account owner's
  // own address. Verify romankucheryavyy.com in Resend to use the domain.
  return resend('message', key, { ...ownerEmail(payload, sentAt), to: contactTo(), replyTo: payload.email }, TIMEOUT.channel)
}

/**
 * The visitor's receipt, with Roman as reply-to. Only the name goes into it
 * (receiptEmail takes nothing else), so the form can't be used to send a
 * stranger someone else's words.
 */
async function sendReceipt({ name, email }: ContactMessage): Promise<boolean> {
  const key = resendApiKey()
  if (!key || !receiptsEnabled()) return false
  return resend('receipt', key, { ...receiptEmail(name), to: [email], replyTo: ownerAddress() }, TIMEOUT.receipt)
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
async function recordInNetlifyForms({ name, email, message }: ContactMessage): Promise<boolean> {
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
      signal: AbortSignal.timeout(TIMEOUT.channel),
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

  const payload: ContactMessage = { name: oneLine(name), email: oneLine(email), message }
  const sentAt = new Date()

  // Both channels run together — one failing must not delay or block the other.
  const [emailed, recorded] = await Promise.all([
    sendViaResend(payload, sentAt),
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

  // Only now that the message has gone: a receipt for a message that went
  // nowhere would be a false success in the visitor's inbox.
  const receipt = await sendReceipt(payload)

  return NextResponse.json({ ok: true, delivered, receipt })
}
