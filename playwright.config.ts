import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end suite against the production build (`npm run build` first).
 *
 * The browsers are the ones Playwright 1.56.1 expects (chromium-1194). On a
 * machine that already has them, point PLAYWRIGHT_BROWSERS_PATH at them instead
 * of running `playwright install`; CI installs them itself.
 *
 * E2E_PORT exists so parallel checkouts on one machine don't fight over 3100.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
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
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    // The contact spec posts a valid message and expects it to go nowhere.
    // An existing process.env value beats .env.local in Next's loader, so these
    // blanks keep a developer's real Resend key or Netlify URL out of the run.
    env: { RESEND_API_KEY: '', URL: '', DEPLOY_PRIME_URL: '' },
  },
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
