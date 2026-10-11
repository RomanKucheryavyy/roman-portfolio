import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { CLIENT_WORK } from '@/lib/work'
import { LINKS, SITE } from '@/lib/constants'
import { NUMBERED, type MovementId, type NumberedMovement } from '@/lib/score'
import { RESUME_HREF } from '@/lib/routes'
import { sha7 } from '@/lib/build-info'
import { capture, collectConsole, gotoHome, wheelThrough } from './helpers'

/**
 * The chrome (W4): the nav on every route, its links and scroll spy, the
 * phone menu sheet, the skip link, the boot's focus rules, the footer's build
 * stamp, the server HTML of the head, and the data-drawn scroll staff.
 *
 * Each test names the project it belongs to and skips the others. Never waits
 * for `networkidle`: the ocean, Lenis and the deck keep the page busy forever.
 */

const ROOT = process.cwd()
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')
const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function only(project: 'desktop' | 'mobile') {
  const name = test.info().project.name
  test.skip(name !== '' && name !== project, `runs in the ${project} project`)
}

/**
 * What a nav item's front face says (the back face always shows the
 * musical name): the one line to change when that wording changes.
 */
const front = (m: NumberedMovement) => m.score
const frontOf = (id: MovementId) => front(NUMBERED.find((m) => m.id === id)!)
const FRONTS = NUMBERED.map(front)

/**
 * Opens / in a fresh session with the page's clock paused, so the boot (a
 * chain of timers) stays on screen for as long as the test needs it: under a
 * loaded machine the real boot can finish before the first assertion runs.
 * (Advancing the held clock is no way to finish it: every frame of the
 * ocean would run on the way.)
 */
async function gotoMidBoot(page: Page) {
  await page.clock.install()
  await page.clock.pauseAt(new Date(Date.now() + 1000))
  await page.goto('/')
  await page.locator('#hero h1').waitFor({ state: 'attached', timeout: 30_000 })
}

/** The section's top at `at` of the viewport (above the spy's 35% reading line), walked there in steps. */
async function placeSection(page: Page, id: string, at = 0.2) {
  for (let pass = 0; pass < 2; pass++) {
    await page.evaluate(
      async ({ id, at }) => {
        const el = document.getElementById(id)
        if (!el) throw new Error(`#${id} is not on the page`)
        const max = document.documentElement.scrollHeight - window.innerHeight
        const goal = Math.min(max, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * at)
        let y = window.scrollY
        while (Math.abs(goal - y) > 10) {
          y += Math.sign(goal - y) * Math.min(600, Math.abs(goal - y))
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, goal)
      },
      { id, at },
    )
    await settle(500)
  }
}

/** Exactly one nav item is current, and its accessible name is `label`. */
async function expectCurrent(page: Page, label: string) {
  const current = page.locator('nav a[aria-current="location"]')
  await expect(current).toHaveCount(1)
  await expect(current).toHaveAccessibleName(label)
}

test.describe('nav on every route', () => {
  for (const route of ['/works', '/resume', '/does-not-exist']) {
    test(`${route} shows a clickable nav without the boot`, async ({ page }) => {
      only('desktop')
      await page.goto(route)
      const nav = page.getByRole('navigation')
      await expect(nav).toBeVisible()
      const allWork = nav.getByRole('link', { name: 'All work' })
      await allWork.click({ trial: true })
      expect(await nav.evaluate((el: Element) => el.closest('[inert]') === null)).toBe(true)
    })
  }

  test('on / the nav waits for the boot', async ({ page, browser }) => {
    only('desktop')
    // Mid-boot, with the clock held: the bar is inert and the Loader is up.
    await gotoMidBoot(page)
    expect(await page.locator('nav').first().evaluate((el: Element) => el.closest('[inert]') !== null)).toBe(true)
    await expect(page.locator('[data-loader]')).toBeVisible()

    // A real-time boot in a fresh session: once it hands over, the bar is live.
    // (Its own context: the paused clock above belongs to the first one.)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const fresh = await context.newPage()
    await fresh.goto('/')
    await expect(fresh.locator('[data-loader]')).toBeHidden({ timeout: 20_000 })
    await expect(fresh.getByRole('navigation')).toBeVisible()
    await expect.poll(() => fresh.locator('nav').first().evaluate((el: Element) => el.closest('[inert]') === null)).toBe(true)
    await context.close()
  })
})

test.describe('nav links', () => {
  test('names in order, real hrefs, and musical back faces', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    const nav = page.getByRole('navigation')
    // The logo, then the items. Names come from the accessibility tree, so
    // the aria-hidden back faces and the invisible width reservations drop out.
    const expected = ['RK.', ...FRONTS, 'All work', ...(RESUME_HREF ? ['Résumé'] : [])]
    await expect(nav.getByRole('link')).toHaveCount(expected.length)
    for (const [i, name] of expected.entries()) {
      await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(name)
    }

    for (const { id } of NUMBERED) {
      await expect(nav.locator(`a[href="#${id}"]`)).toHaveCount(1)
    }
    const backs = await page.locator('nav [data-face="back"]').evaluateAll((els: Element[]) =>
      els.map((el) => ({
        hidden: el.getAttribute('aria-hidden'),
        pointer: getComputedStyle(el).pointerEvents,
        text: el.textContent?.trim(),
      })),
    )
    expect(backs.map((b) => b.text)).toEqual(NUMBERED.map((m) => m.score))
    for (const b of backs) {
      expect(b.hidden).toBe('true')
      expect(b.pointer).toBe('none')
    }
  })

  test('off the home page the section links go to /#id', async ({ page }) => {
    only('desktop')
    await page.goto('/works')
    const nav = page.getByRole('navigation')
    for (const { id } of NUMBERED) await expect(nav.locator(`a[href="/#${id}"]`)).toHaveCount(1)
    await expect(nav.getByRole('link', { name: 'All work' })).toHaveAttribute('aria-current', 'page')
  })

  test('the nav source has no hand-rolled scrolling or locks left', async () => {
    only('desktop')
    expect(read('src/components/ui/Nav.tsx')).not.toMatch(/window\.location|scrollIntoView|window\.scrollTo|body\.style\.overflow/)
    expect(read('src/app/HomeClient.tsx')).not.toMatch(/new IntersectionObserver/)
  })
})

test.describe('scroll spy', () => {
  test('exactly one item is current, and it names the section being read', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    for (const m of NUMBERED) {
      await placeSection(page, m.id)
      await expectCurrent(page, front(m))
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await settle(600)
    await expectCurrent(page, frontOf('compose'))
  })

  test('Enter on the Contact item lands on its heading, focused, with the hash', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    await page.getByRole('navigation').getByRole('link', { name: frontOf('compose'), exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const h2 = document.querySelector('#compose h2')
            if (!h2) return 'no h2'
            const top = h2.getBoundingClientRect().top
            return top >= 60 && top <= 160 && document.activeElement === h2 && location.hash === '#compose' ? 'ok' : `top ${top}`
          }),
        { timeout: 2000 },
      )
      .toBe('ok')
  })

  test('under reduced motion the jump is instant', async ({ page }) => {
    only('desktop')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoHome(page)
    await page.getByRole('navigation').getByRole('link', { name: frontOf('compose'), exact: true }).focus()
    await page.keyboard.press('Enter')
    await settle(150)
    const top = await page.evaluate(() => document.querySelector('#compose h2')!.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(60)
    expect(top).toBeLessThanOrEqual(160)
  })

  test('a cold /#conductor lands on the section after the boot', async ({ page }) => {
    only('desktop')
    await page.goto('/#conductor')
    await page.locator('#hero h1').waitFor({ state: 'attached', timeout: 30_000 })
    await expect(page.locator('[data-loader]')).toBeHidden({ timeout: 15_000 })
    await settle(1200)
    const top = await page.evaluate(() => document.getElementById('conductor')!.getBoundingClientRect().top)
    expect(Math.abs(top)).toBeLessThanOrEqual(120)
  })
})

test.describe('phone menu', () => {
  test('a modal sheet: expanded state, focus trap, scroll lock, close at the burger, copy', async ({ page, context }) => {
    only('mobile')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const log = collectConsole(page)
    await gotoHome(page)

    // While the menu is open Radix hides the burger from the accessibility
    // tree, so it is found by its popup attribute rather than by role.
    const burger = page.locator('button[aria-haspopup="dialog"]')
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    const burgerBox = (await burger.boundingBox())!
    await burger.click()

    const dialog = page.getByRole('dialog', { name: 'Site menu' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(burger).toHaveAttribute('aria-controls', (await dialog.getAttribute('id'))!)

    const x = dialog.getByRole('button', { name: 'Close menu' }).first()
    const xBox = (await x.boundingBox())!
    for (const k of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(xBox[k] - burgerBox[k]), k).toBeLessThanOrEqual(1)

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `Tab ${i + 1}`).toBe(true)
    }

    const y0 = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 600)
    await settle(500)
    expect(await page.evaluate(() => window.scrollY)).toBe(y0)

    for (const name of ['github', 'linkedin', 'email']) {
      const box = (await dialog.getByRole('link', { name, exact: true }).boundingBox())!
      expect(box.height, name).toBeGreaterThanOrEqual(44)
    }

    await dialog.getByRole('button', { name: 'Copy email' }).click()
    await expect(dialog.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LINKS.email)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(burger).toBeFocused()
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    log.expectClean()
  })

  test('a section row closes the menu and lands on the section', async ({ page }) => {
    only('mobile')
    await gotoHome(page)
    await page.locator('button[aria-haspopup="dialog"]').click()
    const dialog = page.getByRole('dialog', { name: 'Site menu' })
    await dialog.getByRole('link', { name: new RegExp(`/${frontOf('conductor').toLowerCase()}`) }).click()
    await expect(dialog).toBeHidden()
    await expect
      .poll(() =>
        page.evaluate(() => {
          const h2 = document.querySelector('#conductor h2')!
          const top = h2.getBoundingClientRect().top
          return top >= 60 && top <= 200 && document.activeElement === h2 && location.hash === '#conductor'
        }),
      )
      .toBe(true)
  })
})

test.describe('skip link', () => {
  for (const route of ['/', '/works', '/resume', '/does-not-exist']) {
    test(`${route}: the first Tab is "Skip to content", and it moves focus to main`, async ({ page }) => {
      test.skip(test.info().project.name === 'no-webgl', 'desktop and mobile cover it')
      if (route === '/') await gotoHome(page)
      else await page.goto(route)
      await settle(800)
      // The contract is that every page renders <main id="main" tabIndex={-1}>.
      // /works, /resume and the 404 are other streams' pages (W6, W9, W8);
      // until they land, there is nothing here to check.
      test.skip((await page.locator('main#main').count()) === 0, `${route} has no main#main yet (its own stream adds it)`)
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('main#main')).toBeFocused()
    })
  }
})

test.describe('the boot', () => {
  test('ten Tabs during the boot never reach the nav or main', async ({ page }) => {
    only('desktop')
    await gotoMidBoot(page)
    await expect(page.locator('[data-loader]')).toHaveAttribute('aria-hidden', 'true')
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => !!document.activeElement?.closest('nav, main, footer'))
      expect(inside, `Tab ${i + 1}`).toBe(false)
    }
    await expect(page.locator('[data-loader]')).toBeVisible() // still booting: the walk was during the boot
  })

  test('reduced motion: no Lenis, and no boot', async ({ page }) => {
    only('desktop')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('#hero h1').waitFor({ state: 'attached', timeout: 30_000 })
    await expect(page.locator('[data-loader]')).toBeHidden({ timeout: 300 })
    await settle(800)
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(false)
  })

  test('without reduced motion Lenis runs', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    expect(await page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(true)
  })
})

test.describe('server HTML', () => {
  const canonicalOf = (html: string) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null

  test('every route has its own canonical or none, never the home page', async ({ request }) => {
    only('desktop')
    expect(canonicalOf(await (await request.get('/')).text())).toBe(SITE.url)
    expect(canonicalOf(await (await request.get('/works')).text())).toBe(`${SITE.url}/works`)
    for (const route of ['/resume', '/does-not-exist']) {
      expect(canonicalOf(await (await request.get(route)).text()), route).not.toBe(SITE.url)
    }
  })

  test('/ carries a <noscript> summary', async ({ request }) => {
    only('desktop')
    const html = await (await request.get('/')).text()
    const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? ''
    expect(noscript).toContain(SITE.name)
    expect(noscript).toContain('href="/works"')
    expect(noscript).toContain('mailto:')
    for (const work of CLIENT_WORK) expect(noscript, work.title).toContain(work.title)
  })

  test('/ has exactly one JSON-LD graph: a Person, no job title, no ratings', async ({ request }) => {
    only('desktop')
    const html = await (await request.get('/')).text()
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
    expect(blocks).toHaveLength(1)
    const data = JSON.parse(blocks[0])
    const person = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'Person')
    expect(person['@id']).toMatch(/#person$/)
    expect(person).not.toHaveProperty('jobTitle')
    expect(blocks[0]).not.toContain('aggregateRating')
  })
})

test.describe('footer', () => {
  for (const route of ['/', '/works', '/resume', '/does-not-exist']) {
    test(`${route} renders the footer`, async ({ page }) => {
      test.skip(test.info().project.name === 'no-webgl', 'desktop and mobile cover it')
      if (route === '/') await gotoHome(page)
      else await page.goto(route)
      const footer = page.locator('footer')
      await expect(footer).toHaveCount(1)
      if (route === '/works' && test.info().project.name === 'mobile') await expect(footer).toBeVisible()
    })
  }

  test('the stamp names this build', async ({ page }) => {
    only('desktop')
    // A build with COMMIT_REF set reads "build <sha7>" and links the commit;
    // run the spec with the same COMMIT_REF the build had.
    await page.goto('/works')
    const footer = page.locator('footer')
    const sha = process.env.COMMIT_REF ?? ''
    if (sha) {
      await expect(footer).toContainText(`build ${sha7(sha)}`)
      await expect(footer.getByRole('link', { name: 'source' })).toHaveAttribute('href', new RegExp(`/commit/${sha}$`))
    } else {
      await expect(footer).toContainText('local build')
    }
  })
})

test.describe('scroll staff', () => {
  test('five notes, and a barline at each section start', async ({ page }) => {
    test.skip(test.info().project.name === 'no-webgl', 'desktop and mobile cover it')
    await gotoHome(page)
    await wheelThrough(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await settle(800)
    await expect(page.locator('[data-note]')).toHaveCount(NUMBERED.length)
    const bars = await page.locator('[data-barline]').evaluateAll((els: Element[]) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      return els.map((el) => {
        const id = el.getAttribute('data-barline')!
        const section = document.getElementById(id)!
        return {
          id,
          x: el.getBoundingClientRect().left / window.innerWidth,
          ratio: (section.getBoundingClientRect().top + window.scrollY) / max,
        }
      })
    })
    expect(bars.map((b) => b.id)).toEqual(['measures', 'symphony', 'compositions', 'interlude', 'conductor', 'compose'])
    for (const b of bars) expect(Math.abs(b.x - b.ratio), b.id).toBeLessThanOrEqual(0.01)
    expect(read('src/components/effects/ScrollProgress.tsx')).not.toMatch(/\bNOTES\b|\[\s*25\s*,\s*50\s*,\s*75\s*\]/)
  })
})

test.describe('transitions and leftovers', () => {
  test('every caption reads the same at 390 and 1440, and the sixth palette is gone', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    const style = () =>
      page.locator('[data-transition] span').evaluateAll((els: Element[]) =>
        els.map((el) => {
          const cs = getComputedStyle(el)
          return `${cs.color} ${cs.opacity} ${cs.fontSize}`
        }),
      )
    const wide = await style()
    expect(wide).toHaveLength(6)
    await page.setViewportSize({ width: 390, height: 844 })
    await settle(500)
    expect(await style()).toEqual(wide)

    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else files.push(full)
      }
    }
    walk(path.join(ROOT, 'src'))
    for (const file of files) expect(readFileSync(file, 'utf8'), file).not.toContain('#ff0040')
  })

  test('the store and the tree are rid of what was retired', async () => {
    only('desktop')
    expect(read('src/stores/useStore.ts')).not.toMatch(/scrollVelocity|scrollProgress|activeProject/)
    expect(existsSync(path.join(ROOT, 'src/components/effects/CodePeek.tsx'))).toBe(false)
    expect(read('src/lib/constants.ts')).not.toMatch(/NAV_ITEMS/)
  })

  test('the favicon still changes at the contact section', async ({ page }) => {
    only('desktop')
    await gotoHome(page)
    const icon = () => page.evaluate(() => document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '')
    const before = await icon()
    await placeSection(page, 'compose')
    await expect.poll(icon).not.toBe(before)
  })
})

test.describe('nav fit', () => {
  for (const width of [768, 1024, 1440]) {
    test(`one row, no overflow at ${width}px`, async ({ page }) => {
      only('desktop')
      await page.setViewportSize({ width, height: 900 })
      await gotoHome(page)
      const fit = await page.locator('nav').first().evaluate((nav: Element) => {
        const box = nav.getBoundingClientRect()
        const links = [...nav.querySelectorAll('a')].map((a) => a.getBoundingClientRect())
        return {
          overflow: nav.scrollWidth - nav.clientWidth,
          rows: new Set(links.map((r) => Math.round(r.top + r.height / 2))).size,
          rightmost: Math.max(...links.map((r) => r.right)),
          right: box.right,
        }
      })
      expect(fit.overflow).toBeLessThanOrEqual(0)
      expect(fit.rows).toBe(1)
      expect(fit.rightmost).toBeLessThanOrEqual(fit.right)
      await capture(page, `nav-${width}`)
    })
  }
})
