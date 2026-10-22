import { expect, test } from '@playwright/test'
import { ownerEmail, receiptEmail, utcStamp } from '@/lib/contact-email'
import { contactFrom, ownerAddress, receiptsEnabled } from '@/lib/env'
import { firstName } from '@/lib/first-name'
import { LINKS } from '@/lib/links'

/**
 * The two emails the contact route sends (src/lib/contact-email.ts) and the
 * settings that decide the receipt (src/lib/env.ts), tested in Node, plus
 * each email's HTML laid out in the browser at a desktop client's width and
 * a phone's. Nothing is sent: the builders only make strings.
 */

const MESSAGE = {
  name: 'Alex Rivera',
  email: 'alex+site@example.com',
  message: 'Hi Roman, <b>bold</b> & "quoted".\n\nSecond paragraph.\r\nLast line.',
}
const AT = new Date('2026-10-22T14:03:27.123Z')

/** The visible text of an HTML email, roughly: the preview text and tags out (inline ones without a gap), entities back, spaces collapsed. */
const textOf = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/, '')
    .replace(/<\/?(a|span)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#847;|&zwnj;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

test.describe('the email to Roman', () => {
  const email = ownerEmail(MESSAGE, AT)

  test('names the visitor in the subject, and carries their name, address, message, when and where', () => {
    expect(email.subject).toBe('New message from Alex Rivera')
    expect(utcStamp(AT)).toBe('2026-10-22 14:03 UTC')
    const text = textOf(email.html)
    expect(text).toContain('New message from Alex Rivera')
    expect(text).toContain('Name Alex Rivera')
    expect(text).toContain('Email alex+site@example.com')
    expect(text).toContain('Sent 2026-10-22 14:03 UTC')
    expect(text).toContain('Via the contact form at romankucheryavyy.com')
    expect(text).toContain('Hi Roman, <b>bold</b> & "quoted". Second paragraph. Last line.')
    expect(text).toContain('Replying to this email answers Alex Rivera at alex+site@example.com.')
    expect(email.html).toContain('href="mailto:alex%2Bsite@example.com"')
    expect(email.html).toContain('href="https://romankucheryavyy.com"')
  })

  test('escapes everything the visitor typed, and keeps the message’s line breaks', () => {
    expect(email.html).not.toContain('<b>bold</b>')
    expect(email.html).toContain('Hi Roman, &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;.<br><br>Second paragraph.<br>Last line.')
    const hostile = ownerEmail({ name: '<img src=x onerror=alert(1)>', email: 'a"b@example.com', message: '</td></tr></table><script>x</script>' }, AT)
    expect(hostile.html).not.toMatch(/<img|<script|a"b@/)
    expect(hostile.html).toContain('&lt;/td&gt;&lt;/tr&gt;&lt;/table&gt;&lt;script&gt;')
  })

  test('has a plain-text part with the same facts and the message as typed', () => {
    expect(email.text).toContain('New message from Alex Rivera')
    expect(email.text).toContain('Email: alex+site@example.com')
    expect(email.text).toContain('Sent:  2026-10-22 14:03 UTC')
    expect(email.text).toContain(MESSAGE.message)
    expect(email.text).toContain('Replying to this email answers Alex Rivera at alex+site@example.com.')
  })
})

test.describe('the visitor’s receipt', () => {
  test('greets them by first name, says the message reached Roman, and is signed with a link to the site', () => {
    const email = receiptEmail('Alex Rivera')
    expect(email.subject).toBe('Thanks for your message')
    const text = textOf(email.html)
    expect(text).toContain('Hi Alex, Thanks for writing. Your message reached me, and I’ll reply to this address.')
    expect(text).toContain('Roman Kucheryavyy romankucheryavyy.com')
    expect(text).toContain(
      'You’re receiving this automatic confirmation because someone used this address on the contact form at romankucheryavyy.com. If that wasn’t you, you can ignore this email.',
    )
    expect(email.html).toContain('href="https://romankucheryavyy.com"')
    expect(email.text).toBe(
      [
        'Hi Alex,',
        '',
        'Thanks for writing. Your message reached me, and I’ll reply to this address.',
        '',
        'Roman Kucheryavyy',
        'https://romankucheryavyy.com',
        '',
        '',
        'You’re receiving this automatic confirmation because someone used this address on the contact form at romankucheryavyy.com. If that wasn’t you, you can ignore this email.',
        '',
      ].join('\n'),
    )
  })

  test('carries nothing the visitor typed but a first name that passes the rule', () => {
    // A name is the only thing the receipt is given; whatever else rides in
    // it must not reach a stranger's inbox.
    const spam = receiptEmail('Winner! Claim your prize at https://spam.example now')
    expect(spam.text.startsWith('Hi there,\n')).toBe(true)
    for (const part of [spam.html, spam.text]) expect(part).not.toMatch(/Winner|prize|spam\.example|Claim/)
    const tail = receiptEmail('Alex <a href="https://spam.example">click</a>')
    expect(tail.text.startsWith('Hi Alex,\n')).toBe(true)
    for (const part of [tail.html, tail.text]) expect(part).not.toMatch(/spam\.example|click/)
  })

  test('falls back to "Hi there," for anything that is not plainly a first name', () => {
    for (const name of ['Dr. Who', 'J.R.', '<b>Al</b>', 'https://x.example', 'Al3x', '-Ann', 'a'.repeat(31), '   ', '👋 Hi']) {
      expect(receiptEmail(name).text.split('\n')[0], JSON.stringify(name)).toBe('Hi there,')
    }
  })
})

test('firstName keeps letters in any script, apostrophes and hyphens, up to 30 characters', () => {
  expect(firstName('Alex Rivera')).toBe('Alex')
  expect(firstName('  José  María ')).toBe('José')
  expect(firstName('Anne-Marie Dupont')).toBe('Anne-Marie')
  expect(firstName('O’Brien')).toBe('O’Brien')
  expect(firstName("D'Angelo")).toBe("D'Angelo")
  expect(firstName('Zoë')).toBe('Zoë')
  // Decomposed accents are composed first.
  expect(firstName('José')).toBe('José')
  expect(firstName('Юлия Петрова')).toBe('Юлия')
  expect(firstName('李雷')).toBe('李雷')
  expect(firstName('a'.repeat(30))).toBe('a'.repeat(30))
  expect(firstName('a'.repeat(31))).toBeNull()
  expect(firstName('Dr.')).toBeNull()
  expect(firstName('')).toBeNull()
})

test.describe('receipts are on only with Resend and a sender of Roman’s own', () => {
  const KEYS = ['RESEND_API_KEY', 'CONTACT_FROM', 'CONTACT_TO'] as const
  let saved: Record<string, string | undefined>
  test.beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
  })
  test.afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })
  const set = (env: Partial<Record<(typeof KEYS)[number], string>>) => {
    for (const k of KEYS) delete process.env[k]
    Object.assign(process.env, env)
  }

  test('off without a Resend key, whatever the sender', () => {
    set({ CONTACT_FROM: 'Roman Kucheryavyy <hello@romankucheryavyy.com>' })
    expect(receiptsEnabled()).toBe(false)
    set({ RESEND_API_KEY: 'not-a-resend-key', CONTACT_FROM: 'Roman Kucheryavyy <hello@romankucheryavyy.com>' })
    expect(receiptsEnabled()).toBe(false)
  })

  test('off on Resend’s shared sender, the default', () => {
    set({ RESEND_API_KEY: 're_test' })
    expect(contactFrom()).toBe('Portfolio <onboarding@resend.dev>')
    expect(receiptsEnabled()).toBe(false)
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'onboarding@RESEND.dev' })
    expect(receiptsEnabled()).toBe(false)
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'Portfolio <x@mail.resend.dev>' })
    expect(receiptsEnabled()).toBe(false)
  })

  test('off when CONTACT_FROM is not an address', () => {
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'Roman Kucheryavyy' })
    expect(receiptsEnabled()).toBe(false)
  })

  test('on with a key and a sender on another domain, bare or named', () => {
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'Roman Kucheryavyy <hello@romankucheryavyy.com>' })
    expect(receiptsEnabled()).toBe(true)
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'hello@romankucheryavyy.com' })
    expect(receiptsEnabled()).toBe(true)
    // A look-alike is not Resend's domain.
    set({ RESEND_API_KEY: 're_test', CONTACT_FROM: 'hello@notresend.dev' })
    expect(receiptsEnabled()).toBe(true)
  })

  test('the receipt replies to CONTACT_TO’s first address, bare, or the site’s own', () => {
    set({ CONTACT_TO: 'Roman <roman@example.com>, other@example.com' })
    expect(ownerAddress()).toBe('roman@example.com')
    set({ CONTACT_TO: 'roman@example.com' })
    expect(ownerAddress()).toBe('roman@example.com')
    set({})
    expect(ownerAddress()).toBe(LINKS.email)
    set({ CONTACT_TO: 'not an address' })
    expect(ownerAddress()).toBe(LINKS.email)
  })
})

test.describe('the HTML lays out in a client', () => {
  const emails = { owner: ownerEmail({ ...MESSAGE, message: `${MESSAGE.message}\n${'https://example.com/' + 'long-path-'.repeat(12)}` }, AT), receipt: receiptEmail('Alex Rivera') }
  for (const [name, email] of Object.entries(emails)) {
    for (const width of [600, 375]) {
      test(`${name} at ${width}px: one column, nothing wider than the window`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await page.setContent(email.html, { waitUntil: 'load' })
        const scroll = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(scroll).toBeLessThanOrEqual(width)
        await expect(page).toHaveTitle(email.subject)
        // The preview text is in the page but not drawn.
        await expect(page.locator('body > div').first()).toBeHidden()
      })
    }
  }
})
