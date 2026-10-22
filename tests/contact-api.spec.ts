import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * The contact route's contract, with no Resend key (the webServer blanks
 * RESEND_API_KEY) and the Netlify Forms channel pointed at the stand-in in
 * tests/stubs/netlify-forms.mjs, so nothing here can reach Roman's inbox or
 * the Netlify dashboard. The stand-in records a message only when it carries
 * RECORD, so one run sees both a message no channel takes and one that
 * Netlify Forms records: the site in production until Resend is set up.
 *
 * The route allows five valid posts per IP per ten minutes, and the limiter
 * keys on x-forwarded-for, so each run sends its own address (a reused local
 * server never carries one run's count into the next), and the 429 test has
 * an address of its own.
 */

const RECORD = '[forms-stub: record]'
// Documentation addresses (RFC 3849), random enough that no two runs or projects share one.
const randomIp = () => `2001:db8::${Math.random().toString(16).slice(2, 6)}:${Math.random().toString(16).slice(2, 6)}`
const ip = randomIp()
const headers = { 'x-forwarded-for': ip }
const valid = { name: 'Playwright', email: 'e2e@example.com', message: 'Contract test, not a lead.', elapsedMs: 5000 }

test.describe('POST /api/contact', () => {
  test('missing fields answer 400', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, message: '' } })
    expect(res.status()).toBe(400)
    expect(await res.json()).toEqual({ error: 'missing_fields' })
  })

  test('a malformed email answers 400', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, email: 'not-an-email' } })
    expect(res.status()).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_email' })
  })

  test('a body that is not JSON answers 400', async ({ request }) => {
    // A Buffer goes as it is; a string would be sent JSON-encoded, which parses.
    const res = await request.post('/api/contact', { headers: { ...headers, 'content-type': 'application/json' }, data: Buffer.from('{"name":') })
    expect(res.status()).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_body' })
  })

  test('the honeypot answers 200 and delivers nothing', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, botField: 'https://spam.example', message: RECORD } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true, delivered: [] })
  })

  test('a post sooner than 1.5s after the form opened answers 200 and delivers nothing', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, elapsedMs: 400, message: RECORD } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true, delivered: [] })
  })

  test('a valid message no channel takes answers 502, never a false success', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: valid })
    expect(res.status()).toBe(502)
    expect(await res.json()).toEqual({ error: 'delivery_failed' })
  })

  test('a message Netlify Forms records answers 200 with delivered ["forms"], and no receipt without Resend', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, message: `${valid.message} ${RECORD}` } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true, delivered: ['forms'], receipt: false })
  })

  test('the sixth valid post from one address in ten minutes answers 429', async ({ request }) => {
    const own = { 'x-forwarded-for': randomIp() }
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/contact', { headers: own, data: valid })
      expect(res.status(), `post ${i + 1}`).toBe(502)
    }
    const res = await request.post('/api/contact', { headers: own, data: valid })
    expect(res.status()).toBe(429)
    expect(await res.json()).toEqual({ error: 'rate_limited' })
  })
})

test('public/__forms.html registers the fields the route posts', () => {
  // Netlify detects the form from this static file at build time; the route
  // posts form-name, name, email and message to it, and bot-field is the
  // honeypot Netlify filters on. A rename on either side loses submissions.
  const html = readFileSync(path.join(process.cwd(), 'public', '__forms.html'), 'utf8')
  expect(html).toMatch(/<form[^>]*\bname="contact"/)
  expect(html).toMatch(/netlify-honeypot="bot-field"/)
  for (const field of ['form-name', 'name', 'email', 'message', 'bot-field']) {
    expect(html, `field "${field}"`).toMatch(new RegExp(`<(input|textarea)[^>]*\\bname="${field}"`))
  }
  expect(html).toMatch(/name="form-name"[^>]*value="contact"/)

  const route = readFileSync(path.join(process.cwd(), 'src', 'app', 'api', 'contact', 'route.ts'), 'utf8')
  expect(route).toMatch(/new URLSearchParams\(\{\s*'form-name': 'contact', name, email, message\s*\}\)/)
})
