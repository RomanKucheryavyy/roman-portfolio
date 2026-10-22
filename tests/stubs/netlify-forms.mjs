/**
 * A stand-in for Netlify's form handler, for the e2e run only.
 * playwright.config.ts starts it next to `next start` and points the app's
 * URL at it, so the contact route's Netlify Forms channel posts here instead
 * of nowhere (or to a real site).
 *
 * It answers like Netlify does: a 200 for a submission to a registered form,
 * a 404 for anything else (an unregistered form falls through to the app's
 * 404). It records a submission only when the message carries RECORD, so one
 * run covers both outcomes: tests/contact-api.spec.ts sends one message that
 * no channel takes (the route's 502) and one that Netlify Forms records (a
 * 200 with delivered: ['forms'] and, with no Resend key, receipt: false),
 * which is the site in production until Resend is set up.
 *
 *   node tests/stubs/netlify-forms.mjs <port>
 */
import { createServer } from 'node:http'

const RECORD = '[forms-stub: record]'
const port = Number(process.argv[2] ?? 3101)

createServer((req, res) => {
  // The webServer's readiness check.
  if (req.method !== 'POST') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('netlify forms stub')
    return
  }
  let body = ''
  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    body += chunk
    if (body.length > 1_000_000) req.destroy()
  })
  req.on('end', () => {
    const form = new URLSearchParams(body)
    const registered =
      req.url === '/__forms.html' && form.get('form-name') === 'contact' && ['name', 'email', 'message'].every((field) => form.get(field))
    const recorded = registered && form.get('message').includes(RECORD)
    res.writeHead(recorded ? 200 : 404, { 'content-type': 'text/html' }).end(recorded ? 'Thank you!' : 'Not Found')
  })
}).listen(port, '127.0.0.1')
