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
 */

const EMAIL = 'kucheryavyyroman@gmail.com'
const MESSAGE = 'Hi Roman, this is a test from the suite.'

async function openBox(page: Page) {
  await gotoHome(page, '/#contact')
  const box = page.locator('#contact form')
  await box.scrollIntoViewIfNeeded()
  return {
    box,
    name: box.getByLabel('Name', { exact: true }),
    email: box.getByLabel('Email', { exact: true }),
    message: box.getByRole('textbox', { name: 'Message', exact: true }),
    send: page.locator('#contact form button[aria-label^="Send"], #contact form button[aria-label^="Sending"], #contact form button[aria-label="Sent"]'),
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

/** Collects the POSTs to /api/contact and answers them with `answer`. */
async function interceptContact(page: Page, answer: (route: Route) => Promise<void>) {
  const posts: { at: number; request: Request }[] = []
  await page.route('**/api/contact', async (route) => {
    posts.push({ at: Date.now(), request: route.request() })
    await answer(route)
  })
  return posts
}

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

  test('after the window the message goes out once, with the honeypot and the time, and a delivery says Sent', async ({ page }) => {
    const log = collectConsole(page)
    const posts = await interceptContact(page, (route) => route.fulfill({ json: { ok: true, delivered: ['resend'] } }))
    const f = await fill(page)
    const pressed = await pressSend(page, f.send)
    await expect(f.status).toHaveText(/^Sent\. Thanks for writing\./, { timeout: 15_000 })
    expect(posts).toHaveLength(1)
    expect(posts[0].at - pressed, 'the POST waits out the undo window').toBeGreaterThanOrEqual(4500)
    const body = posts[0].request.postDataJSON()
    expect(body).toMatchObject({ name: 'Playwright', email: 'e2e@example.com', message: MESSAGE, botField: '' })
    expect(body.elapsedMs).toBeGreaterThan(1500)
    await expect(f.send).toHaveAttribute('aria-label', 'Sent')
    await expect(f.name).toBeDisabled()
    await expect(f.email).toBeDisabled()
    // Write another: a fresh, empty form.
    await f.box.getByRole('button', { name: 'Write another' }).click()
    await expect(f.box.getByLabel('Name', { exact: true })).toHaveValue('')
    await expect(f.box.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('')
    await page.waitForTimeout(500)
    expect(posts).toHaveLength(1)
    log.expectClean()
  })

  const failures: [string, (route: Route) => Promise<void>, RegExp[]][] = [
    ['a 502 (no channel delivered)', (route) => route.fulfill({ status: 502, json: { error: 'delivery_failed' } }), [/status of 502/]],
    ['a network failure', (route) => route.abort('failed'), [/net::ERR_FAILED/]],
    ['a 2xx that delivered nothing', (route) => route.fulfill({ json: { ok: true, delivered: [] } }), []],
  ]
  for (const [what, answer, allow] of failures) {
    test(`${what} shows the failure line with his email and a mailto, and keeps the message`, async ({ page }) => {
      const log = collectConsole(page, allow)
      const posts = await interceptContact(page, answer)
      const f = await fill(page)
      await pressSend(page, f.send)
      const alert = f.box.getByRole('alert')
      await expect(alert).toContainText('Your message didn’t go through, and it is still here.', { timeout: 15_000 })
      await expect(alert).toContainText(EMAIL)
      const mailto = alert.getByRole('link', { name: 'open it in your mail app' })
      await expect(mailto).toHaveAttribute('href', new RegExp(`^mailto:${EMAIL}\\?subject=`))
      expect(posts).toHaveLength(1)
      await expect(f.message).toHaveValue(MESSAGE)
      await expect(f.send).toHaveAttribute('aria-label', 'Send')
      await expect(f.box).not.toContainText('Sent. Thanks')
      log.expectClean()
    })
  }
})
