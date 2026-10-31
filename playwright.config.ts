import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end suite against the production build (`npm run build` first).
 *
 * The browsers are the ones Playwright 1.56.1 expects (chromium-1194). On a
 * machine that already has them, point PLAYWRIGHT_BROWSERS_PATH at them instead
 * of running `playwright install`; CI installs them itself.
 *
 * E2E_PORT exists so parallel checkouts on one machine don't fight over 3100.
 * The stand-in for Netlify's form handler (tests/stubs/netlify-forms.mjs)
 * listens on the port after it, or on E2E_FORMS_PORT.
 *
 * tests/tsconfig.json is the run's tsconfig: the root one, plus a stub for
 * `import 'server-only'`, which Next resolves in the app and Node can't, and
 * `next/server` pointed at its file (the package has no exports map, so
 * Node's ESM loader can't find it by name), so the specs can unit-test the
 * server-only modules and call a route handler directly.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)
const FORMS_PORT = Number(process.env.E2E_FORMS_PORT ?? PORT + 1)
const baseURL = `http://localhost:${PORT}`

/**
 * Every test starts as a browser that saw the Roman intro a moment ago
 * (localStorage `rk:intro`, src/components/stage/intro-gate.ts), so the home
 * page opens straight on the Stage, as it did before the intro. A spec about
 * the intro starts from an empty state instead (`test.use({ storageState:
 * { cookies: [], origins: [] } })`) or loads `/?intro`.
 */
const SEEN_INTRO = {
  cookies: [],
  origins: [{ origin: baseURL, localStorage: [{ name: 'rk:intro', value: String(Date.now()) }] }],
}

export default defineConfig({
  testDir: './tests',
  tsconfig: './tests/tsconfig.json',
  // The home page draws its curtain and its footer glass in WebGL, under
  // software rendering in CI, so give each test room; a hang still fails,
  // just not instantly.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    storageState: SEEN_INTRO,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: `node tests/stubs/netlify-forms.mjs ${FORMS_PORT}`,
      url: `http://127.0.0.1:${FORMS_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npm run start -- -p ${PORT}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'ignore',
      stderr: 'pipe',
      // The contact spec posts valid messages and must reach no one: no
      // Resend key, and the Netlify Forms channel posts to the stub above.
      // An existing process.env value beats .env.local in Next's loader, so
      // these keep a developer's real Resend key or Netlify URL out of the run.
      env: { RESEND_API_KEY: '', URL: `http://127.0.0.1:${FORMS_PORT}`, DEPLOY_PRIME_URL: '' },
    },
  ],
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        userAgent: devices['Pixel 7'].userAgent,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      // The curtain (kokonut's Drape Background) and the footer's fluted
      // glass are WebGL. This project is the machine that has none: an old
      // laptop, a locked-down browser. The page must still read in full.
      name: 'no-webgl',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: { args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] },
      },
    },
  ],
})
