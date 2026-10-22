import { expect, test } from '@playwright/test'
import { POST } from '@/app/api/contact/route'
import { oneLine, ownerEmail, receiptEmail, utcStamp } from '@/lib/contact-email'
import { contactFrom, ownerAddress, receiptsEnabled } from '@/lib/env'
import { firstName } from '@/lib/first-name'
import { LINKS } from '@/lib/links'
import { LIMITS, rateLimited } from '@/lib/rate-limit'

/**
 * The two emails the contact route sends (src/lib/contact-email.ts) and the
 * settings that decide the receipt (src/lib/env.ts), tested in Node, plus
 * each email's HTML laid out in the browser at a desktop client's width and
 * a phone's, and the route itself, called in Node with fetch faked, for what
 * it hands Resend. Nothing is sent: the builders only make strings, and the
 * faked fetch answers every call itself.
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

  test('a sentence in a script written without spaces gets "Hi there,", not a greeting that carries it', () => {
    // "Congratulations, you won a free iPhone, add us on WeChat to claim the prize, act now"
    const spam = receiptEmail('恭喜您获得免费苹果手机请加微信领取奖品立即行动 x')
    expect(spam.text.startsWith('Hi there,\n')).toBe(true)
    for (const part of [spam.html, spam.text]) expect(part).not.toContain('恭喜')
  })
})

test.describe('firstName', () => {
  test('keeps a first name: letters in one script, apostrophes and hyphens, internal capitals as names have them', () => {
    expect(firstName('Alex Rivera')).toBe('Alex')
    expect(firstName('  José  María ')).toBe('José')
    expect(firstName('Anne-Marie Dupont')).toBe('Anne-Marie')
    expect(firstName('O’Brien')).toBe('O’Brien')
    expect(firstName("D'Angelo")).toBe("D'Angelo")
    expect(firstName('Zoë')).toBe('Zoë')
    // Decomposed accents are composed first.
    expect(firstName('Jose\u0301')).toBe('José')
    for (const name of ['LaToya', 'McDonald', 'alex', 'Bjørn-Åge', 'Łukasz', 'Nguyễn', 'Siobhán', 'Юлия', 'Ελένη', 'Արամ', 'ნინო', 'محمد', 'דוד', 'प्रिया', 'สมศักดิ์', '김민준', 'さくら', '李雷']) {
      expect(firstName(name), name).toBe(name)
    }
    expect(firstName('Юлия Петрова')).toBe('Юлия')
    expect(firstName('a'.repeat(20))).toBe('a'.repeat(20))
  })

  test('refuses anything that could say more than a name', () => {
    const refused = {
      'punctuation, digits, links': ['Dr.', 'J.R.', 'Al3x', 'https://x.example', '<b>Al</b>', '-Ann', 'Ann-', 'Ann--Marie', '', '   '],
      'too long for its script': ['a'.repeat(21), '恭喜您获得免费苹果手机请加微信领取奖品立即行动', '李雷韩梅梅', 'คลิกเลยรับเงินฟรีทันทีวันนี้'],
      'CamelCase phrases and shouting': ['CallNowFreeBitcoinOnTelegram', 'VisitCheapPillsDotCom', 'FreeCash-ClickHere', 'ALEX'],
      'more than three parts': ['Mary-Jo-Ann-Lee'],
      // U+A4F8 is a Lisu letter that draws as a dot, U+01C3 a Latin letter that draws as "!".
      'look-alikes from another script or category': ['evil\uA4F8com', 'Win\u01C3', 'Alexка', 'x\u0640x', '\u00AA'],
      'mathematical letters': ['𝐀𝐥𝐞𝐱'],
      // Hangul fillers draw as nothing: "Hi ㅤ,".
      'blank letters': ['\u3164', '\u115F', '\uFFA0'],
      'format characters': ['Alex\u200Bspam', '\u202Egnp.exe'],
      'a stack of marks': ['A' + '\u0301'.repeat(29), 'Alex\u0336\u0336\u0336'],
    }
    for (const [why, names] of Object.entries(refused)) {
      for (const name of names) expect(firstName(name), `${why}: ${JSON.stringify(name)}`).toBeNull()
    }
  })
})

test('oneLine keeps a name or an address on one line, with no control or format characters', () => {
  expect(oneLine('Bob\r\nBcc: x@evil.com')).toBe('Bob Bcc: x@evil.com')
  // An unclosed right-to-left override would turn the rest of the subject and the reply line around.
  expect(oneLine('\u202Egnp.exe Admin')).toBe('gnp.exe Admin')
  expect(oneLine('Al\u2066ex\u2069 \u200BRivera\u200E')).toBe('Alex Rivera')
  expect(oneLine('a\u2028b\u2029c\u0085d\te')).toBe('a b c d e')
  expect(oneLine('x\u202E@example.com')).toBe('x@example.com')
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

  test('an address gets one receipt an hour, whoever sends the form', () => {
    const address = `once-${Math.random().toString(36).slice(2)}@example.com`
    expect(rateLimited(address, LIMITS.receipt)).toBe(false)
    expect(rateLimited(address, LIMITS.receipt)).toBe(true)
    expect(LIMITS.receipt).toMatchObject({ windowMs: 60 * 60_000, max: 1 })
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
  const emails = {
    owner: ownerEmail({ ...MESSAGE, message: `${MESSAGE.message}\n${'https://example.com/' + 'long-path-'.repeat(12)}` }, AT),
    // A long address and a name with no spaces: one unbreakable word each, in the heading, the rows and the reply line.
    'owner, long address and name': ownerEmail(
      { name: 'Christopherbartholomew'.repeat(3), email: 'christopher.vanderberg.consulting@northwesternmutual.com', message: MESSAGE.message },
      AT,
    ),
    receipt: receiptEmail('Alex Rivera'),
  }
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

/**
 * The route itself, in Node, with Resend configured and every outside call
 * answered by a fake fetch, so each request it would make is seen and none
 * leaves the process.
 */
test.describe('the route, with Resend faked', () => {
  const KEYS = ['RESEND_API_KEY', 'CONTACT_FROM', 'CONTACT_TO', 'URL', 'DEPLOY_PRIME_URL'] as const
  let saved: Record<string, string | undefined>
  let realFetch: typeof fetch
  let calls: { url: string; body: Record<string, unknown> | string }[]
  /** The status the fake gives each kind of call: Resend's message, its receipt, and Netlify Forms. */
  let answer: { message: number; receipt: number; forms: number }

  test.beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]))
    for (const k of KEYS) delete process.env[k]
    Object.assign(process.env, {
      RESEND_API_KEY: 're_test',
      CONTACT_FROM: 'Roman Kucheryavyy <hello@romankucheryavyy.com>',
      CONTACT_TO: 'roman@example.com',
      URL: 'https://forms.invalid',
    })
    calls = []
    answer = { message: 200, receipt: 200, forms: 200 }
    realFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const raw = String(init?.body ?? '')
      const resend = url.startsWith('https://api.resend.com/')
      const body = resend ? (JSON.parse(raw) as Record<string, unknown>) : raw
      calls.push({ url, body })
      const status = !resend ? answer.forms : (body as Record<string, unknown>).subject === 'Thanks for your message' ? answer.receipt : answer.message
      return new Response(status < 400 ? '{}' : 'refused', { status })
    }) as typeof fetch
  })
  test.afterEach(() => {
    globalThis.fetch = realFetch
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  // Each post from its own documentation address, so the per-IP limit never trips here.
  const post = async (data: Record<string, unknown>) => {
    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': `2001:db8::${Math.random().toString(16).slice(2, 6)}` },
        body: JSON.stringify({ elapsedMs: 5000, message: 'Hello from the route test.', ...data }),
      }),
    )
    return { status: res.status, body: await res.json() }
  }
  const unique = () => `visitor-${Math.random().toString(36).slice(2)}@example.com`
  const sentTo = () => calls.filter((c) => c.url.startsWith('https://api.resend.com/')).map((c) => c.body as Record<string, unknown>)
  const receipts = () => sentTo().filter((b) => b.subject === 'Thanks for your message')

  test('sends Roman the message with the visitor as reply-to, then the visitor a receipt marked as automatic', async () => {
    const email = unique()
    expect(await post({ name: 'Alex Rivera', email })).toEqual({ status: 200, body: { ok: true, delivered: ['email', 'forms'], receipt: true } })
    const [message, receipt] = sentTo()
    expect(message).toMatchObject({ to: ['roman@example.com'], reply_to: email, subject: 'New message from Alex Rivera' })
    expect(message.headers).toBeUndefined()
    expect(receipt).toMatchObject({
      from: 'Roman Kucheryavyy <hello@romankucheryavyy.com>',
      to: [email],
      reply_to: 'roman@example.com',
      subject: 'Thanks for your message',
      headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'OOF, AutoReply' },
    })
    for (const part of [receipt.html, receipt.text]) expect(String(part)).not.toContain('Hello from the route test.')
  })

  test('sends no receipt when only Netlify Forms took the message', async () => {
    answer.message = 500
    expect(await post({ name: 'Alex', email: unique() })).toEqual({ status: 200, body: { ok: true, delivered: ['forms'], receipt: false } })
    expect(sentTo()).toHaveLength(1)
    expect(receipts()).toHaveLength(0)
  })

  test('a receipt Resend refuses still answers 200, with receipt false', async () => {
    answer.receipt = 500
    expect(await post({ name: 'Alex', email: unique() })).toEqual({ status: 200, body: { ok: true, delivered: ['email', 'forms'], receipt: false } })
  })

  test('one receipt an hour per address, from any IP and in any case; the messages still go', async () => {
    const email = unique()
    expect((await post({ name: 'Alex', email })).body).toMatchObject({ delivered: ['email', 'forms'], receipt: true })
    expect((await post({ name: 'Alex', email: email.toUpperCase() })).body).toMatchObject({ delivered: ['email', 'forms'], receipt: false })
    expect(receipts()).toHaveLength(1)
    expect(sentTo().filter((b) => b.subject === 'New message from Alex')).toHaveLength(2)
  })

  test('strips control and format characters from the name and address before anything uses them', async () => {
    const email = unique()
    await post({ name: '‮gnp.exe Admin\r\nBcc: x@evil.example', email: `${email}​` })
    const [message, receipt] = sentTo()
    expect(message.subject).toBe('New message from gnp.exe Admin Bcc: x@evil.example')
    expect(message.reply_to).toBe(email)
    expect(String(message.html)).not.toMatch(/[‪-‮⁦-⁩​]/)
    expect(receipt.to).toEqual([email])
  })

  test('the honeypot and a too-fast post call nothing outside', async () => {
    expect((await post({ name: 'Bot', email: unique(), botField: 'x' })).body).toEqual({ ok: true, delivered: [] })
    expect((await post({ name: 'Bot', email: unique(), elapsedMs: 200 })).body).toEqual({ ok: true, delivered: [] })
    expect(calls).toHaveLength(0)
  })
})
