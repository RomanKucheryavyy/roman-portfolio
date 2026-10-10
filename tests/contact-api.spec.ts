import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * The contact route's contract, with no delivery channel configured (the
 * webServer blanks RESEND_API_KEY, URL and DEPLOY_PRIME_URL), so nothing here
 * can reach Roman's inbox or the Netlify dashboard.
 *
 * Four POSTs per project, never more than five: the route allows five per IP
 * per ten minutes. Each run also sends its own x-forwarded-for, which is the
 * header the limiter keys on, so a reused local server never carries one run's
 * count into the next.
 */

const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`
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

  test('the honeypot answers 200 and delivers nothing', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: { ...valid, botField: 'https://spam.example' } })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true, delivered: [] })
  })

  test('a valid message with no channel answers 502, never a false success', async ({ request }) => {
    const res = await request.post('/api/contact', { headers, data: valid })
    expect(res.status()).toBe(502)
    expect(await res.json()).toEqual({ error: 'delivery_failed' })
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
