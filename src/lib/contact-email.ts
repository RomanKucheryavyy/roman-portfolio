import 'server-only'
import { STAGE_STYLE } from '@/components/stage/look'
import { SITE } from '@/lib/constants'
import { firstName } from '@/lib/first-name'

/**
 * The two emails the contact route (src/app/api/contact/route.ts) sends
 * through Resend, each as HTML and plain text:
 *
 * - ownerEmail: the visitor's message, to CONTACT_TO. The route sets the
 *   visitor as reply_to, so answering it answers them.
 * - receiptEmail: a short confirmation to the visitor. It takes the name
 *   and nothing else on purpose. The receipt goes to whatever address was
 *   typed into the form, so anything it repeated from the form could be
 *   sent to a stranger's inbox under this domain; it carries no visitor
 *   text but a first name that passes firstName()'s rule.
 *
 * The HTML is the kind every mail client renders the same: tables for
 * layout, every style inline (the <style> block only tightens the padding on
 * phones, and the email reads fine where a client drops it), widths in
 * attributes as well as CSS, a fixed 560px column for Outlook's Word engine,
 * system fonts, a light page. The accents are the site's
 * (src/components/stage/look.ts): its wash, a deep umber, for the label
 * and links (15.2:1 on white), and its gold for the card's top edge and the
 * quote's edge only, since it is too pale for text on white (2.0:1).
 *
 * Every value from the form is HTML-escaped here. The route passes the name
 * and the address through oneLine() first, which also keeps the subject on
 * one line.
 */

/**
 * For the name and the address, which go into the subject and into the
 * emails' sentences. Line breaks and every other control character become a
 * space, so a crafted name can't inject extra mail headers; format
 * characters go (bidi overrides and isolates, zero-width spaces and joiners),
 * so a name can't turn the rest of a line around ("exe.png") or hide text.
 */
export function oneLine(s: string): string {
  return s
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ')
    .replace(/\p{Cf}/gu, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

export interface ContactMessage {
  name: string
  email: string
  message: string
}

export interface Email {
  subject: string
  html: string
  text: string
}

const look = STAGE_STYLE as unknown as Record<string, string>
/** The wash, as an ink on white: the label and links (15.2:1). */
const INK = look['--stage-wash']
/** The gold the page draws on the dark: decoration only here. */
const TINT = look['--stage-gold']
const PAGE = '#f4f4f5'
const CARD = '#ffffff'
const RULE = '#e4e4e7'
const QUOTE = '#fafafa'
const TEXT = '#18181b'
const BODY = '#3f3f46'
const MUTED = '#71717a'
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
/**
 * On everything that carries the visitor's name, address or message: a long
 * address or a name with no spaces breaks wherever it must instead of
 * pushing the column wider than a phone.
 */
const WRAP = 'word-break:break-word;overflow-wrap:anywhere;'

const HOST = new URL(SITE.url).host

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Escaped, with its line breaks kept. */
const paragraphs = (s: string) => esc(s).replace(/\r\n?|\n/g, '<br>')

/** An address for a mailto: href, percent-encoded but for its @. */
const mailto = (address: string) => `mailto:${encodeURIComponent(address).replace(/%40/g, '@')}`

/** 2026-10-22 14:03 UTC */
export function utcStamp(at: Date): string {
  return `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

const link = (href: string, label: string) =>
  `<a href="${esc(href)}" style="color:${INK};text-decoration:underline;">${label}</a>`

const siteLink = () => link(SITE.url, esc(HOST))

/**
 * The text a client shows next to the subject in the inbox. The run of
 * zero-width characters after it keeps the client from filling the preview
 * with the body.
 */
const preheader = (text: string) =>
  `<div style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE};opacity:0;">${esc(text)}${'&#847;&zwnj;&nbsp;'.repeat(60)}</div>`

function layout({ title, preview, header, card, footer }: { title: string; preview: string; header: string; card: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
<style>
  body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  @media (max-width: 600px) {
    .shell { padding: 24px 12px !important; }
    .card { padding: 28px 22px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};">
${preheader(preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="width:100%;background-color:${PAGE};">
<tr>
<td class="shell" align="center" style="padding:40px 16px;">
<!--[if mso]><table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
<tr>
<td style="padding:0 4px 16px;font-family:${FONT};font-size:14px;line-height:20px;color:${TEXT};font-weight:600;">${header}</td>
</tr>
<tr>
<td bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${RULE};border-top:4px solid ${TINT};border-radius:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="card" style="padding:36px 40px;font-family:${FONT};color:${TEXT};">
${card}
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">${footer}</td>
</tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</body>
</html>
`
}

const detail = (label: string, value: string, first = false) => `<tr>
<td width="72" valign="top" style="width:72px;padding:${first ? '0' : '10px'} 16px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${label}</td>
<td valign="top" style="padding:${first ? '0' : '10px'} 0 0;font-family:${FONT};font-size:14px;line-height:20px;color:${TEXT};${WRAP}">${value}</td>
</tr>`

/** The visitor's message, for Roman. `sentAt` is when the route received it. */
export function ownerEmail({ name, email, message }: ContactMessage, sentAt: Date): Email {
  const subject = `New message from ${name}`
  const stamp = utcStamp(sentAt)
  const reply = `Replying to this email answers ${name} at ${email}.`

  const card = `<p style="margin:0 0 8px;font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${INK};">Contact form</p>
<h1 style="margin:0 0 24px;font-size:22px;line-height:30px;font-weight:700;color:${TEXT};${WRAP}">New message from ${esc(name)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
${detail('Name', esc(name), true)}
${detail('Email', link(mailto(email), esc(email)))}
${detail('Sent', esc(stamp))}
${detail('Via', `the contact form at ${siteLink()}`)}
</table>
<p style="margin:0 0 10px;font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">Message</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td bgcolor="${QUOTE}" style="padding:16px 20px;background-color:${QUOTE};border-left:3px solid ${TINT};font-family:${FONT};font-size:15px;line-height:24px;color:${BODY};${WRAP}">${paragraphs(message)}</td>
</tr>
</table>
<p style="margin:24px 0 0;font-size:14px;line-height:22px;color:${BODY};${WRAP}">Replying to this email answers ${esc(name)} at ${link(mailto(email), esc(email))}.</p>`

  const html = layout({
    title: subject,
    preview: message.replace(/\s+/g, ' ').trim().slice(0, 140),
    header: esc(HOST),
    card,
    footer: `Sent by the contact form at ${siteLink()} on ${esc(stamp)}.`,
  })

  const text = [
    `New message from ${name}`,
    '',
    `Name:  ${name}`,
    `Email: ${email}`,
    `Sent:  ${stamp}`,
    `Via:   the contact form at ${HOST}`,
    '',
    'Message:',
    '',
    message,
    '',
    '',
    reply,
    '',
  ].join('\n')

  return { subject, html, text }
}

/**
 * The visitor's confirmation. It is given the name only: see the note at the
 * top for why it must never carry the message, or anything else they typed.
 */
export function receiptEmail(name: string): Email {
  const subject = 'Thanks for your message'
  const first = firstName(name)
  const greeting = first ? `Hi ${first},` : 'Hi there,'
  const body = 'Thanks for writing. Your message reached me, and I’ll reply to this address.'
  const signature = SITE.name
  const notice = `You’re receiving this automatic confirmation because someone used this address on the contact form at ${HOST}. If that wasn’t you, you can ignore this email.`

  const card = `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${TEXT};">${esc(greeting)}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:26px;color:${BODY};">${esc(body)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:20px 0 0;border-top:1px solid ${RULE};font-family:${FONT};">
<p style="margin:0;font-size:15px;line-height:22px;font-weight:600;color:${TEXT};">${esc(signature)}</p>
<p style="margin:2px 0 0;font-size:14px;line-height:22px;">${siteLink()}</p>
</td>
</tr>
</table>`

  const html = layout({
    title: subject,
    preview: body,
    header: esc(SITE.name),
    card,
    footer: `You’re receiving this automatic confirmation because someone used this address on the contact form at ${siteLink()}. If that wasn’t you, you can ignore this email.`,
  })

  const text = [greeting, '', body, '', signature, SITE.url, '', '', notice, ''].join('\n')

  return { subject, html, text }
}
