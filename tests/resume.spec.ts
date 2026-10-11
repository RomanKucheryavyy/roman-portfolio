import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import type { ResumeData } from '@/lib/resume-data'
import { PAPER } from '@/components/resume/paper'
import { collectConsole, parseColor } from './helpers'

/**
 * The résumé builder and the server routes behind it (W9).
 *
 * The e2e server runs with no RESUME_PIN, so nothing here can unlock the real
 * builder: the UI tests mock /api/resume/* with a fixture (never the real
 * résumé), and the real routes are hit only where no PIN is needed (the 401s
 * and the rate limits). Each run keys its own rate-limit buckets with a random
 * x-nf-client-connection-ip, the first header the limiter reads, so a reused
 * server never carries one run's count into the next, and no other spec's
 * bucket is touched.
 */

const ROOT = process.cwd()
const ip = () => `198.18.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`

const FIXTURE: ResumeData = {
  name: 'Roman Kucheryavyy',
  location: 'Fixture City, WA',
  phone: '(000) 000-0000',
  email: 'fixture@example.com',
  linkedin: 'https://www.linkedin.com/in/example/',
  github: 'https://github.com/example',
  website: 'https://example.com',
  summary: 'A fixture résumé for the builder tests, long enough to wrap onto a few lines in the summary field.',
  experience: [
    { company: 'Acme', location: 'Remote', title: 'Staff Engineer', dates: 'Jan 2025 – Present', bullets: ['Fixture bullet one.', 'Fixture bullet two.'] },
    { company: 'Acme', location: 'Remote', title: 'Engineer', dates: 'Jan 2023 – Jan 2025', bullets: ['Fixture bullet three.'] },
    { company: 'Globex', location: 'Seattle, WA', title: 'Support Engineer', dates: 'Jan 2021 – Jan 2023', bullets: ['Fixture bullet four.'] },
  ],
  certifications: [{ name: 'Fixture Certification', date: 'Jan 2024' }],
  education: [{ school: 'Fixture University', location: 'WA', degree: 'BS Fixtures', dates: '2018 – 2020' }],
  skills: ['TypeScript', 'Apex'],
  projects: [{ name: 'Fixture Project', tech: 'Next.js', bullets: ['Fixture project bullet.'] }],
}
const LETTER = 'Dear Hiring Team,\n\nA fixture cover letter.\n\nSincerely,\nRoman Kucheryavyy'

interface Mocks {
  /** Delay before the tailor / cover-letter mocks answer, so the pending face can be measured. */
  delayMs?: number
}

/** Mocks the four résumé routes and unlocks the builder with a fixture. */
async function unlock(page: Page, { delayMs = 0 }: Mocks = {}) {
  const wait = () => new Promise((r) => setTimeout(r, delayMs))
  await page.route('**/api/resume/verify-pin', (route) => route.fulfill({ json: { ok: true } }))
  await page.route('**/api/resume/data', (route) => route.fulfill({ json: FIXTURE }))
  await page.route('**/api/resume/tailor', async (route) => {
    await wait()
    await route.fulfill({ json: { resume: { ...FIXTURE, summary: 'Tailored fixture summary.' } } })
  })
  await page.route('**/api/resume/cover-letter', async (route) => {
    await wait()
    await route.fulfill({ json: { coverLetter: LETTER } })
  })
  await page.goto('/resume')
  await page.getByLabel('PIN').fill('1234')
  await page.getByLabel('PIN').press('Enter')
  await expect(page.getByRole('tablist')).toBeVisible({ timeout: 15_000 })
}

test.describe('/resume head and bundle', () => {
  test('the server HTML is noindex, titled "Résumé builder", canonical /resume', async ({ request }) => {
    const html = await (await request.get('/resume')).text()
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>')
    expect(html).toContain('<title>Résumé builder — Roman Kucheryavyy</title>')
    expect(html).toMatch(/<link rel="canonical" href="[^"]*\/resume"\/>/)
  })

  test('no built client chunk carries the phone number or the case metrics', () => {
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(file)
        else if (/802-6464|1,214/.test(readFileSync(file, 'utf8'))) hits.push(path.relative(ROOT, file))
      }
    }
    walk(path.join(ROOT, '.next', 'static'))
    expect(hits).toEqual([])
  })
})

test.describe('PIN gate', () => {
  test('the field is labelled, and a wrong PIN reads as an error', async ({ page }) => {
    const log = collectConsole(page, [/status of 401/])
    await page.route('**/api/resume/verify-pin', (route) => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }))
    await page.goto('/resume')
    const pin = page.getByLabel('PIN')
    await expect(pin).toBeFocused()
    expect(await pin.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
    await expect(page.locator('main#main')).toHaveCount(1)
    await expect(page.getByRole('link', { name: '← Back to portfolio' })).toBeVisible()

    await pin.fill('0000')
    await pin.press('Enter')
    // (Next's route announcer is the page's other role=alert.)
    await expect(page.getByRole('alert').filter({ hasText: 'Incorrect PIN' })).toHaveCount(1)
    await expect(pin).toHaveAttribute('aria-invalid', 'true')
    log.expectClean()
  })
})

test.describe('builder', () => {
  test('three tools in a real tablist: arrow keys move the selection, each panel is labelled by its tab', async ({ page }) => {
    const log = collectConsole(page)
    await unlock(page)
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(3)
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')

    await tabs.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true')

    for (let i = 0; i < 3; i++) {
      await tabs.nth(i).click()
      const panel = page.getByRole('tabpanel')
      await expect(panel).toHaveCount(1)
      expect(await panel.getAttribute('aria-labelledby')).toBe(await tabs.nth(i).getAttribute('id'))
    }
    log.expectClean()
  })

  test('the tab row scrolls sideways on a narrow phone and never vertically; the underline keeps 2px', async ({ page }) => {
    await unlock(page)
    const row = () =>
      page.getByRole('tablist').evaluate((list) => {
        const active = list.querySelector('[aria-selected="true"]')!
        const cs = getComputedStyle(list)
        return {
          overflowY: cs.overflowY,
          scrollHeight: list.scrollHeight,
          clientHeight: list.clientHeight,
          scrollWidth: list.scrollWidth,
          clientWidth: list.clientWidth,
          // The underline is drawn whole when the active tab ends where the list does.
          activeBottom: active.getBoundingClientRect().bottom,
          listBottom: list.getBoundingClientRect().bottom,
          underline: getComputedStyle(active).borderBottomWidth,
        }
      })
    const wide = await row()
    // A row that can scroll vertically, even by 1px, latches a swipe or a wheel
    // that starts on it, and the page does not move.
    expect(wide.overflowY).toBe('hidden')
    expect(wide.scrollHeight).toBe(wide.clientHeight)
    expect(wide.activeBottom).toBe(wide.listBottom)
    expect(wide.underline).toBe('2px')

    await page.setViewportSize({ width: 320, height: 640 })
    const narrow = await row()
    expect(narrow.scrollWidth).toBeGreaterThan(narrow.clientWidth)
    expect(narrow.scrollHeight).toBe(narrow.clientHeight)
  })

  test('every field has a name and is at least 16px on a phone (14px from md up)', async ({ page }) => {
    await unlock(page)
    const floor = (page.viewportSize()?.width ?? 1440) < 768 ? 16 : 14
    await expect(page.getByRole('link', { name: 'Back to portfolio' })).toBeVisible()
    await expect(page.locator('main#main')).toHaveCount(1)

    const tabs = page.getByRole('tab')
    let checked = 0
    for (let i = 0; i < 3; i++) {
      await tabs.nth(i).click()
      const fields = await page.getByRole('tabpanel').locator('input, textarea').evaluateAll((els) =>
        els.map((el) => {
          const control = el as HTMLInputElement | HTMLTextAreaElement
          const label = Array.from(control.labels ?? []).map((l) => l.textContent?.trim() ?? '').join(' ')
          return { name: label || control.getAttribute('aria-label') || '', size: parseFloat(getComputedStyle(control).fontSize) }
        }),
      )
      for (const field of fields) {
        expect(field.name, 'accessible name').not.toBe('')
        expect(field.size, `${field.name} font size`).toBeGreaterThanOrEqual(floor)
      }
      checked += fields.length
    }
    // Summary, 4 bullets, skills; job description; company and job description.
    expect(checked).toBe(9)
  })

  test('the paper preview prints in the PDF palette', async ({ page }) => {
    await unlock(page)
    const bullet = page.getByRole('tabpanel').locator('li', { hasText: 'Fixture bullet one.' })
    const [r, g, b] = parseColor(await bullet.evaluate((el) => getComputedStyle(el).color))
    expect([r, g, b]).toEqual(parseColor(PAPER.body).slice(0, 3))
    // The preview's tokens and the PDF's palette are the same four values.
    const css = readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8')
    for (const [role, hex] of Object.entries(PAPER)) expect(css).toContain(`--color-paper-${role}: ${hex};`)
    const pdf = readFileSync(path.join(ROOT, 'src/components/resume/ResumePdf.tsx'), 'utf8')
    expect(pdf).toMatch(/bulletText: \{[^}]*color: PAPER\.body/)
    expect(pdf).not.toMatch(/'#[0-9a-f]{3,6}'/i)
  })

  test('the controls on the paper draw their focus ring in paper ink, not the white that vanishes on it', async ({ page }) => {
    await unlock(page)
    const ring = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        return { focusVisible: el.matches(':focus-visible'), color: getComputedStyle(el).outlineColor }
      })
    const ink = parseColor(PAPER.ink).slice(0, 3)

    // Keyboard from the last field to Download PDF, the next stop.
    await page.getByLabel('Skills').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeFocused()
    expect((await ring()).focusVisible).toBe(true)
    // Polled: on a transition-colors control the outline colour eases in too.
    await expect.poll(async () => parseColor((await ring()).color).slice(0, 3)).toEqual(ink)

    await page.getByRole('tab', { name: 'Cover Letter' }).click()
    await page.getByLabel('Paste Job Description').fill('A fixture job description.')
    await page.getByRole('button', { name: 'Generate Cover Letter' }).click()
    // Download PDF, then the sheet, then the copy control inside it.
    await page.getByRole('button', { name: 'Download PDF' }).focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Copy to clipboard' })).toBeFocused()
    expect((await ring()).focusVisible).toBe(true)
    await expect.poll(async () => parseColor((await ring()).color).slice(0, 3)).toEqual(ink)
  })

  test('the résumé downloads as a PDF', async ({ page }) => {
    const log = collectConsole(page)
    await unlock(page)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('Roman_Kucheryavyy_Resume.pdf')
    const file = await download.path()
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-')
    log.expectClean()
  })

  test('tailor runs, its button keeps its width while pending, and the tailored PDF downloads', async ({ page }) => {
    const log = collectConsole(page)
    await unlock(page, { delayMs: 800 })
    await page.getByRole('tab', { name: 'Tailor' }).click()
    await page.getByLabel('Paste Job Description').fill('A fixture job description.')

    const button = page.getByRole('button', { name: 'Tailor Resume' })
    const handle = await button.elementHandle()
    const idle = (await handle!.boundingBox())!.width
    await button.click()
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(1)
    await expect(page.getByRole('status').filter({ hasText: 'Tailoring...' })).toHaveCount(1)
    const pending = (await handle!.boundingBox())!.width
    expect(Math.abs(pending - idle)).toBeLessThanOrEqual(0.5)

    await expect(page.getByText('Tailored fixture summary.')).toBeVisible()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('Roman_Kucheryavyy-Tailored_Resume.pdf')
    log.expectClean()
  })

  test('the cover letter generates, copies with a "Copied" announcement, and downloads', async ({ page, context }) => {
    const log = collectConsole(page)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await unlock(page)
    await page.getByRole('tab', { name: 'Cover Letter' }).click()
    await page.getByLabel('Company Name (optional)').fill('Fixture Co')
    await page.getByLabel('Paste Job Description').fill('A fixture job description.')
    await page.getByRole('button', { name: 'Generate Cover Letter' }).click()
    await expect(page.getByText('A fixture cover letter.')).toBeVisible()

    await page.getByRole('button', { name: 'Copy to clipboard' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LETTER)

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PDF' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('Roman_Kucheryavyy_Fixture_Co_CoverLetter.pdf')
    log.expectClean()
  })

  test('a refused clipboard announces "Copy failed", with no unhandled rejection', async ({ page }) => {
    const log = collectConsole(page)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError')) },
      })
      document.execCommand = () => false
    })
    await unlock(page)
    await page.getByRole('tab', { name: 'Cover Letter' }).click()
    await page.getByLabel('Paste Job Description').fill('A fixture job description.')
    await page.getByRole('button', { name: 'Generate Cover Letter' }).click()
    await page.getByRole('button', { name: 'Copy to clipboard' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Copy failed' })).toHaveCount(1)
    log.expectClean()
  })

  test('each tool has no serious or critical axe violation', async ({ page }) => {
    await unlock(page)
    const tabs = page.getByRole('tab')
    for (let i = 0; i < 3; i++) {
      await tabs.nth(i).click()
      const results = await new AxeBuilder({ page }).analyze()
      const bad = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
      expect(bad, `tab ${i}`).toEqual([])
    }
  })
})

test.describe('résumé routes', () => {
  test('without the right PIN every route answers 401', async ({ request }) => {
    const headers = { 'x-nf-client-connection-ip': ip() }
    for (const route of ['data', 'verify-pin']) {
      expect((await request.post(`/api/resume/${route}`, { headers, data: {} })).status(), route).toBe(401)
    }
    for (const route of ['tailor', 'cover-letter']) {
      const res = await request.post(`/api/resume/${route}`, { headers, data: { pin: '1234', resumeData: {}, jobDescription: 'x' } })
      expect(res.status(), route).toBe(401)
    }
  })

  test('the PIN routes share one budget: the ninth guess in ten minutes is refused', async ({ request }) => {
    const headers = { 'x-nf-client-connection-ip': ip() }
    const statuses: number[] = []
    for (let i = 0; i < 9; i++) {
      const route = i % 2 ? 'data' : 'verify-pin'
      statuses.push((await request.post(`/api/resume/${route}`, { headers, data: { pin: String(1000 + i) } })).status())
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 401, 401, 401, 429])
  })
})

test.describe('contact route', () => {
  test('uses the shared limiter: the sixth valid post in ten minutes is refused', async ({ request }) => {
    const source = readFileSync(path.join(ROOT, 'src/app/api/contact/route.ts'), 'utf8')
    expect(source).not.toMatch(/(function|const) (rateLimited|clientIp)\b/)
    expect(source).toContain('rateLimited(clientIp(req), LIMITS.contact)')

    const headers = { 'x-nf-client-connection-ip': ip() }
    const data = { name: 'Playwright', email: 'e2e@example.com', message: 'Rate-limit test, not a lead.', elapsedMs: 5000 }
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) statuses.push((await request.post('/api/contact', { headers, data })).status())
    // No delivery channel in the test server, so the five allowed posts fail honestly.
    expect(statuses).toEqual([502, 502, 502, 502, 502, 429])
  })
})
