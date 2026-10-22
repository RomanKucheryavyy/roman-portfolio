import { expect, test, type Locator, type Page, type Request, type Route } from '@playwright/test'
import { collectConsole, gotoHome } from './helpers'

/**
 * The message box in the contact card (src/components/stage/composer.tsx):
 * kokonut's AI Autocomplete finishes the visitor's sentence, kokonut's Undo
 * Button gives five seconds to take it back, and only then does the message
 * go to /api/contact. Every POST here is intercepted with page.route, so
 * nothing reaches the real route (contact-api.spec.ts covers that).
 *
 * Send is pressed from the keyboard: the undo clock holds while a mouse
 * hovers the button (so nobody loses the chance while reading it), and a
 * click would leave the pointer there.
 *
 * Once the route answers, a panel takes the fields' place: "Message sent"
 * only for a 2xx that delivered something, with the receipt line only when
 * the route says receipt: true; otherwise the failure panel, which keeps the
 * message for Try again and Edit message. Either takes focus as it appears.
 */

const EMAIL = 'kucheryavyyroman@gmail.com'
const MESSAGE = 'Hi Roman, this is a test from the suite.'

async function openBox(page: Page) {
  await gotoHome(page, '/#contact')
  await page.locator('#contact form').scrollIntoViewIfNeeded()
  return boxOf(page)
}

/** The form's parts, as they are now (no navigation). */
function boxOf(page: Page) {
  const box = page.locator('#contact form')
  return {
    box,
    name: box.getByLabel('Name', { exact: true }),
    email: box.getByLabel('Email', { exact: true }),
    message: box.getByRole('textbox', { name: 'Message', exact: true }),
    send: page.locator('#contact form button[aria-label^="Send"]'),
    status: box.locator('p[aria-live="polite"]').last(),
  }
}

async function fill(page: Page) {
  const f = await openBox(page)
  await f.name.fill('Playwright')
  await f.email.fill('e2e@example.com')
  await f.message.fill(MESSAGE)
  return f
}

/** Presses Send from the keyboard and returns when it was pressed. */
async function pressSend(page: Page, send: Locator) {
  await send.focus()
  await page.keyboard.press('Enter')
  return Date.now()
}

/**
 * Collects the POSTs to /api/contact and answers them with `answer`, or with
 * each of a list of answers in turn (the last one for every post after).
 */
async function interceptContact(page: Page, answer: Answer | Answer[]) {
  const answers = Array.isArray(answer) ? answer : [answer]
  const posts: { at: number; request: Request }[] = []
  await page.route('**/api/contact', async (route) => {
    posts.push({ at: Date.now(), request: route.request() })
    await answers[Math.min(posts.length, answers.length) - 1](route)
  })
  return posts
}
type Answer = (route: Route) => Promise<void>

const delivered =
  (receipt: boolean, channels = ['forms']): Answer =>
  (route) =>
    route.fulfill({ json: { ok: true, delivered: channels, receipt } })
const refused: Answer = (route) => route.fulfill({ status: 502, json: { error: 'delivery_failed' } })

const THANKS = 'Thanks, Playwright. Your message reached me, and I’ll reply to e2e@example.com.'
const RECEIPT = 'A confirmation is on its way to your inbox.'
const FAILED = 'Your message didn’t go through'
const KEPT = 'It’s still here. Try again, or write to me directly.'

/** The panel that took the fields' place, found by its heading. */
const panelHeading = (page: Page, name: string) => page.locator('#contact').getByRole('heading', { name, exact: true })

test.describe('the suggestion', () => {
  test('typing "Hi" offers a greeting, Tab takes it, and the next sentence is offered', async ({ page }) => {
    const log = collectConsole(page)
    const { message } = await openBox(page)
    await message.click()
    await page.keyboard.type('Hi')
    const hint = page.locator('#contact form p.sr-only[aria-live="polite"]')
    await expect(hint).toHaveText(/^Suggestion:\s+Roman,\. Press Tab to accept\.$/)
    await page.keyboard.press('Tab')
    await expect(message).toHaveValue('Hi Roman,')
    await expect(message).toBeFocused()
    // Between sentences, the first opener.
    await expect(hint).toHaveText(/^Suggestion:\s+I'm looking for a new website for my business\.\. Press Tab to accept\.$/)
    await page.keyboard.press('Tab')
    await expect(message).toHaveValue("Hi Roman, I'm looking for a new website for my business.")
    log.expectClean()
  })

  test('the Accept bar takes the suggestion with a tap', async ({ page }) => {
    const { message, box } = await openBox(page)
    await message.click()
    await page.keyboard.type('Hello')
    const accept = box.getByRole('button', { name: /Accept/ })
    await expect(accept).toBeVisible()
    await accept.click()
    await expect(message).toHaveValue('Hello Roman,')
  })
})

test.describe('sending', () => {
  test('Send waits for a name, an email address and a message', async ({ page }) => {
    const f = await openBox(page)
    await expect(f.send).toBeDisabled()
    await expect(f.status).toHaveText('Add your name, email and a message to send.')
    await f.name.fill('Playwright')
    await f.email.fill('not-an-email')
    await f.message.fill(MESSAGE)
    await expect(f.send).toBeDisabled()
    await f.email.fill('e2e@example.com')
    await expect(f.send).toBeEnabled()
    await expect(f.status).toHaveText('You get five seconds to take it back.')
  })

  test('while the message is out, "Sending…" is said once, by the button', async ({ page }) => {
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    await interceptContact(page, async (route) => {
      await held
      await route.fulfill({ json: { ok: true, delivered: ['forms'], receipt: false } })
    })
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(f.send).toHaveAttribute('aria-label', 'Sending…', { timeout: 15_000 })
    await expect(f.status).toHaveText('')
    const said = await page.locator('#contact [aria-live]').evaluateAll((nodes) => nodes.map((n) => n.textContent?.trim()).filter(Boolean))
    expect(said).toEqual(['Sending…'])
    release()
    await expect(panelHeading(page, 'Message sent')).toBeFocused()
  })

  test('Send opens a five-second undo window, and Undo sends nothing', async ({ page }) => {
    const posts = await interceptContact(page, (route) => route.fulfill({ json: { ok: true, delivered: ['resend'] } }))
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(f.send).toHaveAttribute('aria-label', /^Sending\. Undo, [45] seconds left$/)
    await page.keyboard.press('Enter') // the same button, now Undo
    await expect(f.send).toHaveAttribute('aria-label', 'Send')
    await page.waitForTimeout(6000)
    expect(posts).toHaveLength(0)
    await expect(f.message).toHaveValue(MESSAGE)
  })

  test('after the window the message goes out once, with the honeypot and the time, and a delivery shows the sent panel', async ({ page }) => {
    const log = collectConsole(page)
    const posts = await interceptContact(page, delivered(false))
    const f = await fill(page)
    const pressed = await pressSend(page, f.send)
    const heading = panelHeading(page, 'Message sent')
    await expect(heading).toBeVisible({ timeout: 15_000 })
    expect(posts).toHaveLength(1)
    expect(posts[0].at - pressed, 'the POST waits out the undo window').toBeGreaterThanOrEqual(4500)
    const body = posts[0].request.postDataJSON()
    expect(body).toMatchObject({ name: 'Playwright', email: 'e2e@example.com', message: MESSAGE, botField: '' })
    expect(body.elapsedMs).toBeGreaterThan(1500)

    // The panel in place of the fields, and focus on its heading, which reads out the rest.
    await expect(heading).toBeFocused()
    await expect(heading).toHaveAccessibleDescription(THANKS)
    const contact = page.locator('#contact')
    await expect(contact).toContainText(THANKS)
    await expect(contact).not.toContainText(RECEIPT)
    await expect(contact.locator('blockquote')).toHaveText(MESSAGE)
    await expect(page.locator('#contact form')).toHaveCount(0)
    log.expectClean()
  })

  test('with receipt: true the panel says a confirmation is on its way', async ({ page }) => {
    await interceptContact(page, delivered(true, ['email', 'forms']))
    const f = await fill(page)
    await pressSend(page, f.send)
    const heading = panelHeading(page, 'Message sent')
    await expect(heading).toBeFocused({ timeout: 15_000 })
    await expect(heading).toHaveAccessibleDescription(`${THANKS} ${RECEIPT}`)
    await expect(page.locator('#contact')).toContainText(RECEIPT)
  })

  test('a name that is not plainly a first name gets a plain thank-you', async ({ page }) => {
    await interceptContact(page, delivered(false))
    const f = await fill(page)
    await f.name.fill('Dr. Playwright')
    await pressSend(page, f.send)
    await expect(panelHeading(page, 'Message sent')).toBeFocused({ timeout: 15_000 })
    await expect(page.locator('#contact')).toContainText('Thanks. Your message reached me, and I’ll reply to e2e@example.com.')
  })

  test('Send another message starts a fresh, empty form with the cursor in Name, and sends nothing', async ({ page }) => {
    const log = collectConsole(page)
    const posts = await interceptContact(page, delivered(false))
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(panelHeading(page, 'Message sent')).toBeFocused({ timeout: 15_000 })
    // From the heading, the panel's one control is the next stop.
    await page.keyboard.press('Tab')
    const another = page.locator('#contact').getByRole('button', { name: 'Send another message' })
    await expect(another).toBeFocused()
    await page.keyboard.press('Enter')
    const fresh = boxOf(page)
    await expect(fresh.name).toBeFocused()
    await expect(fresh.name).toHaveValue('')
    await expect(fresh.email).toHaveValue('')
    await expect(fresh.message).toHaveValue('')
    await expect(fresh.send).toHaveAttribute('aria-label', 'Send')
    await expect(fresh.send).toBeDisabled()
    await expect(panelHeading(page, 'Message sent')).toHaveCount(0)
    await page.waitForTimeout(500)
    expect(posts).toHaveLength(1)
    log.expectClean()
  })

  test('a message emptied during the undo window is not sent, and the form says what is missing', async ({ page }) => {
    const posts = await interceptContact(page, delivered(false))
    const f = await fill(page)
    await pressSend(page, f.send)
    await f.message.fill('')
    await expect(f.box.getByRole('alert')).toHaveText('Add your name, a full email address and a message, then press Send again.', { timeout: 15_000 })
    expect(posts).toHaveLength(0)
    await expect(page.locator('#contact')).not.toContainText('Message sent')
  })

  const failures: [string, Answer, RegExp[]][] = [
    ['a 502 (no channel delivered)', refused, [/status of 502/]],
    ['a network failure', (route) => route.abort('failed'), [/net::ERR_FAILED/]],
    ['a 2xx that delivered nothing', (route) => route.fulfill({ json: { ok: true, delivered: [] } }), []],
  ]
  for (const [what, answer, allow] of failures) {
    test(`${what} shows the failure panel with his email, Copy email and a mailto, and keeps the message`, async ({ page }) => {
      const log = collectConsole(page, allow)
      const posts = await interceptContact(page, answer)
      const f = await fill(page)
      await pressSend(page, f.send)
      const heading = panelHeading(page, FAILED)
      await expect(heading).toBeFocused({ timeout: 15_000 })
      await expect(heading).toHaveAccessibleDescription(KEPT)
      const contact = page.locator('#contact')
      await expect(contact).toContainText(EMAIL)
      await expect(contact.getByRole('button', { name: 'Copy email' })).toBeVisible()
      const mailto = contact.getByRole('link', { name: 'Open in your mail app' })
      await expect(mailto).toHaveAttribute('href', new RegExp(`^mailto:${EMAIL}\\?subject=Message%20from%20Playwright&body=`))
      expect(decodeURIComponent((await mailto.getAttribute('href'))!.split('&body=')[1])).toContain(MESSAGE)
      await expect(contact.locator('blockquote')).toHaveText(MESSAGE)
      await expect(contact.getByRole('button', { name: 'Try again' })).toBeVisible()
      await expect(contact.getByRole('button', { name: 'Edit message' })).toBeVisible()
      expect(posts).toHaveLength(1)
      await expect(contact).not.toContainText(/sent/i)
      log.expectClean()
    })
  }

  test('Try again sends the same message at once, and a delivery then shows the sent panel', async ({ page }) => {
    const log = collectConsole(page, [/status of 502/])
    const posts = await interceptContact(page, [refused, delivered(true, ['email', 'forms'])])
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(panelHeading(page, FAILED)).toBeFocused({ timeout: 15_000 })
    const retry = page.locator('#contact').getByRole('button', { name: 'Try again' })
    await retry.focus()
    await page.keyboard.press('Enter')
    const heading = panelHeading(page, 'Message sent')
    await expect(heading).toBeFocused({ timeout: 10_000 })
    expect(posts).toHaveLength(2)
    expect(posts[1].request.postDataJSON()).toMatchObject({ name: 'Playwright', email: 'e2e@example.com', message: MESSAGE, botField: '' })
    await expect(heading).toHaveAccessibleDescription(`${THANKS} ${RECEIPT}`)
    log.expectClean()
  })

  test('a Try again that fails too says so, and keeps the message', async ({ page }) => {
    const log = collectConsole(page, [/status of 502/])
    const posts = await interceptContact(page, refused)
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(panelHeading(page, FAILED)).toBeFocused({ timeout: 15_000 })
    await page.locator('#contact').getByRole('button', { name: 'Try again' }).click()
    const again = panelHeading(page, 'Your message still didn’t go through')
    await expect(again).toBeFocused({ timeout: 10_000 })
    // "still" once, not twice.
    await expect(again).toHaveAccessibleDescription('It’s kept here. Try again in a moment, or write to me directly.')
    expect(posts).toHaveLength(2)
    await expect(page.locator('#contact blockquote')).toHaveText(MESSAGE)
    log.expectClean()
  })

  test('Edit message brings the form back as it was, and the fixed message sends', async ({ page }) => {
    const log = collectConsole(page, [/status of 502/])
    const posts = await interceptContact(page, [refused, delivered(false)])
    const f = await fill(page)
    // A long letter: the panel quotes four lines of it; the form has all of it.
    const letter = Array.from({ length: 10 }, (_, i) => `Paragraph ${i + 1} of a longer letter.`).join('\n\n')
    await f.message.fill(letter)
    await pressSend(page, f.send)
    await expect(panelHeading(page, FAILED)).toBeFocused({ timeout: 15_000 })
    const edit = page.locator('#contact').getByRole('button', { name: 'Edit message' })
    await edit.focus()
    await page.keyboard.press('Enter')

    const back = boxOf(page)
    await expect(back.message).toBeFocused()
    await expect(back.message).toHaveValue(letter)
    expect(await back.message.evaluate((area: HTMLTextAreaElement) => [area.selectionStart, area.selectionEnd])).toEqual([letter.length, letter.length])
    await expect(back.name).toHaveValue('Playwright')
    await expect(back.email).toHaveValue('e2e@example.com')
    await expect(panelHeading(page, FAILED)).toHaveCount(0)

    // Fix the address and send again.
    await back.email.fill('e2e+fixed@example.com')
    await pressSend(page, back.send)
    await expect(panelHeading(page, 'Message sent')).toBeFocused({ timeout: 15_000 })
    expect(posts).toHaveLength(2)
    expect(posts[1].request.postDataJSON()).toMatchObject({ name: 'Playwright', email: 'e2e+fixed@example.com', message: letter })
    log.expectClean()
  })

  test('the quote drops blank lines and fades a long message out instead of an ellipsis', async ({ page }) => {
    await interceptContact(page, delivered(false))
    const f = await fill(page)
    const letter = Array.from({ length: 10 }, (_, i) => `Paragraph ${i + 1}.`).join('\n\n')
    await f.message.fill(letter)
    await pressSend(page, f.send)
    await expect(panelHeading(page, 'Message sent')).toBeFocused({ timeout: 15_000 })
    const quote = page.locator('#contact blockquote')
    await expect(quote).toHaveText(letter.replace(/\n\n/g, '\n'))
    const look = await quote.evaluate((node) => ({
      clipped: node.scrollHeight > node.clientHeight,
      lines: Math.round(node.clientHeight / parseFloat(getComputedStyle(node).lineHeight)),
      clamp: getComputedStyle(node).webkitLineClamp,
      mask: getComputedStyle(node).maskImage,
    }))
    expect(look).toMatchObject({ clipped: true, lines: 4, clamp: 'none' })
    expect(look.mask).toContain('linear-gradient')
  })

  test('a short message is quoted whole, with no fade', async ({ page }) => {
    await interceptContact(page, delivered(false))
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(panelHeading(page, 'Message sent')).toBeFocused({ timeout: 15_000 })
    const quote = page.locator('#contact blockquote')
    await expect(quote).toHaveText(MESSAGE)
    expect(await quote.evaluate((node) => getComputedStyle(node).maskImage)).toBe('none')
  })

  test('a 429 says the box is pausing, offers his address, and leads with the mail app rather than Try again', async ({ page }) => {
    const log = collectConsole(page, [/status of 429/])
    await interceptContact(page, (route) => route.fulfill({ status: 429, json: { error: 'rate_limited' } }))
    const f = await fill(page)
    await pressSend(page, f.send)
    const heading = panelHeading(page, FAILED)
    await expect(heading).toBeFocused({ timeout: 15_000 })
    await expect(heading).toHaveAccessibleDescription(
      'That’s a few messages in a row, so the box is pausing for ten minutes. Your message is kept here: try again after that, or write to me directly.',
    )
    const contact = page.locator('#contact')
    await expect(contact).toContainText(EMAIL)
    await expect(contact.getByRole('button', { name: 'Try again' })).toHaveAttribute('data-variant', 'outline')
    await expect(contact.getByRole('link', { name: 'Open in your mail app' })).toHaveAttribute('data-variant', 'default')
    log.expectClean()
  })
})

test.describe('Copy email', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })
  test('puts his address on the clipboard and says Copied', async ({ page }) => {
    const log = collectConsole(page, [/status of 502/])
    await interceptContact(page, refused)
    const f = await fill(page)
    await pressSend(page, f.send)
    await expect(panelHeading(page, FAILED)).toBeFocused({ timeout: 15_000 })
    await page.locator('#contact').getByRole('button', { name: 'Copy email' }).click()
    await expect(page.locator('#contact').getByRole('button', { name: 'Copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL)
    await expect(page.locator('#contact')).toContainText('Email address copied.')
    log.expectClean()
  })
})

/**
 * iOS Safari zooms into any field under 16px. Below sm, and on a touch screen
 * at any width (a phone in landscape is wider than sm), the fields and both
 * layers of the message box are 16px; with a mouse from sm up the box keeps
 * its published 15px. The two layers stay the same, so the suggestion stays
 * on the caret's line.
 */
async function expectPhoneText(page: Page) {
  const f = await openBox(page)
  const sizes = await f.message.evaluate((area) => ({
    area: getComputedStyle(area).fontSize,
    mirror: getComputedStyle(area.previousElementSibling!).fontSize,
    areaLine: getComputedStyle(area).lineHeight,
    mirrorLine: getComputedStyle(area.previousElementSibling!).lineHeight,
  }))
  const touch = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
  const want = touch || (page.viewportSize()?.width ?? 0) < 640 ? '16px' : '15px'
  expect(sizes).toEqual({ area: want, mirror: want, areaLine: '24px', mirrorLine: '24px' })
  for (const field of [f.name, f.email]) {
    const size = await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    if (want === '16px') expect(size).toBeGreaterThanOrEqual(16)
  }
  return want
}

test('the message box text is 16px on phones (iOS zooms into anything smaller) and its suggestion layer matches', async ({ page }) => {
  await expectPhoneText(page)
})

test.describe('a phone held sideways', () => {
  test.use({ viewport: { width: 844, height: 390 } })
  test('still gets 16px text, though it is wider than sm', async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, 'a touch screen only')
    expect(await expectPhoneText(page)).toBe('16px')
  })
})
