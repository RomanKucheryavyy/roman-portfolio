#!/usr/bin/env node
/**
 * Re-captures the live previews of Roman's public products, the screenshots
 * the Products act scrolls inside its browser and phone frames
 * (src/components/stage/products.tsx), from the real sites:
 *
 * - desktop: 1280px wide, saved at 1x;
 * - phone: 390px wide at a phone's deviceScaleFactor of 2, saved at 1.5x (the
 *   frame shows it under 300px wide, so 2x would only add weight);
 *
 * each cropped to the page's first few screens (`desktop` and `phone` below,
 * in CSS px: up to 4000 and 3000, less where a page turns into a long
 * scroll-pinned stretch that a still shot shows as blank).
 *
 * Each page is loaded, scrolled through once (so anything that appears on
 * scroll has appeared), returned to the top and left to settle before the
 * full-page shot. The shots are written as WebP to
 * public/images/products/<id>-desktop.webp and <id>-phone.webp, at the sizes
 * the page declares for them (`preview` on the product in
 * src/lib/constants.ts COMPOSITIONS; tests/data.spec.ts checks the files
 * match), so a re-capture never changes the layout. After one, set
 * `captured` there to the date this prints, and look at the files before
 * committing them.
 *
 *   node scripts/capture-products.mjs            # every product with a preview
 *   node scripts/capture-products.mjs sembly     # just one
 *
 * Needs Playwright's Chromium (set PLAYWRIGHT_BROWSERS_PATH where it is
 * installed, or run `npx playwright install chromium`) and sharp, which Next
 * installs as its own optional dependency.
 */
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from '@playwright/test'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = path.join(ROOT, 'public', 'images', 'products')

/**
 * The products with a public site (COMPOSITIONS in src/lib/constants.ts, the
 * ones with a `url`). The URLs are the records' own; this list only says
 * which ones have a preview.
 */
const PRODUCTS = [
  // From about 2900px down, the desktop page pins its "How the night runs"
  // phone for several screens, which a full-page shot draws as empty space.
  { id: 'alongside-events', url: 'https://alongsideevents.com', desktop: 2900, phone: 3000 },
  { id: 'sembly', url: 'https://sembly.app', desktop: 4000, phone: 3000 },
]

/** How each shot is taken, and the pixel scale it is saved at. */
const SHOTS = {
  desktop: {
    context: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
    save: 1,
    quality: 72,
  },
  phone: {
    context: {
      userAgent: devices['iPhone 13'].userAgent,
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    save: 1.5,
    quality: 74,
  },
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready)
  // Down the page a screen at a time, so whatever reveals on scroll (or
  // lazy-loads) does, then back to the top.
  const step = page.viewportSize().height * 0.7
  for (let y = 0; y < 9000; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await sleep(250)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(2500)
}

async function main() {
  const { default: sharp } = await import('sharp').catch(() => {
    throw new Error('sharp is missing: it comes with Next (npm install), or add it with npm i -D sharp')
  })
  const only = process.argv.slice(2)
  const products = only.length ? PRODUCTS.filter((p) => only.includes(p.id)) : PRODUCTS
  if (!products.length) throw new Error(`no product called ${only.join(', ')}; known: ${PRODUCTS.map((p) => p.id).join(', ')}`)

  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const product of products) {
      for (const [kind, shot] of Object.entries(SHOTS)) {
        const context = await browser.newContext({ ...shot.context, reducedMotion: 'no-preference' })
        const page = await context.newPage()
        await page.goto(product.url, { waitUntil: 'load', timeout: 60_000 })
        await settle(page)
        const height = product[kind]
        const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
        if (pageHeight < height) {
          throw new Error(`${product.url} is ${pageHeight}px tall at ${kind} width, shorter than the ${height}px the frame expects`)
        }
        const width = shot.context.viewport.width
        const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width, height } })
        await context.close()

        const file = path.join(OUT, `${product.id}-${kind}.webp`)
        const size = { width: Math.round(width * shot.save), height: Math.round(height * shot.save) }
        await sharp(png).resize(size).webp({ quality: shot.quality, effort: 6, smartSubsample: true }).toFile(file)
        console.log(`${path.relative(ROOT, file)}  ${size.width}x${size.height}  ${(statSync(file).size / 1024).toFixed(0)} KB  from ${product.url}`)
      }
    }
  } finally {
    await browser.close()
  }
  console.log(`captured: '${new Date().toISOString().slice(0, 10)}'`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
