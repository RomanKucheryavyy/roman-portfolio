# CLAUDE.md

Roman Kucheryavyy's portfolio: <https://romankucheryavyy.com>, repo
`RomanKucheryavyy/roman-portfolio`. Next.js 16 (App Router) · React 19 ·
TypeScript · Tailwind v4 with shadcn's new-york-v4 theme · 21st.dev
components · motion / framer-motion · Netlify.

## The site, and why it looks like this

One public page, `/`, in the **Stage** design: dark, cinematic, built from
complete 21st.dev components. Roman asked for it in his own words: "i want a
whole new redesign completely, no longer this vibe thats glitchy", "must use
complete cmoponents from 21st.dev like newest one", and, shown three
directions, "the stage portfolio nice but the new messaging from tactile is
nice too where it auto filsl as you type sorta thing". So it is the design
lab's direction C with direction A's message box. He kept none of the old
site's hero, FFT ocean, drag deck, `/works` wheel or musical framing; those
are gone (925af16). `design-lab/` is the record of the three directions: read
it, never change it.

## Rules

- **Never push, merge or force-push `main`.** It auto-deploys production on
  every push. Work on a branch and open a PR; merging is Roman's job.
- **Never invent facts.** Every name, date, number, status, claim and link
  comes from the records below, or from live data. Anything else becomes a
  `// needs Roman:` comment and is not rendered.
- **The résumé stays private.** `/resume` is Roman's PIN-gated builder,
  `noindex`; its data loads only after the PIN, from `/api/resume/data`. No
  phone number, support metric or résumé bullet may reach public JS, HTML or
  `public/` (`tests/data.spec.ts` checks the build).
- **Owner-fixed copy.** The FUBC Coffee iOS description keeps "Apple Pay";
  the Nelectric description stays word for word. `npm run check:protected`
  fails on any change to either (in `src/lib/constants.ts`, in any commit
  since abb0023) unless the commit message carries `[owner-approved:copy]`,
  and that tag needs Roman's written OK first.
- **Components as published.** Every visible feature is a 21st.dev component
  in `src/components/ui/`, configured by props and by descendant classes from
  outside. Edit inside one only where it cannot work otherwise, keep the
  edit minimal, mark it `// [lab edit]` (from the lab) or `// [site edit]`,
  and keep the published default when the new prop is not passed. The page's
  own code (the glue) is `src/components/stage/`.
- **No two names that differ only by case in one directory** (`Button.tsx`
  and `button.tsx`): Roman works on macOS, whose filesystem ignores case.
- **Dark only.** `<html class="dark">`, and next-themes holds it with
  `forcedTheme="dark"` for the components that ask.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config; `next build` does not lint) |
| `npm run build` | Production build (also writes `.next/diagnostics/route-bundle-stats.json`) |
| `npm run start -- -p <port>` | Serve the build |
| `npm run budget` | First-load JS per route against `scripts/budget.json` (after a build) |
| `npm run check:protected` | Fails on an unapproved change to the owner-fixed copy |
| `npm run test:e2e` | Playwright against the production build: desktop 1440x900, mobile 390x844, no-WebGL |

e2e: build first; the suite starts `npm run start` on 3100 itself
(`E2E_PORT=<port>` for another), with no Resend key and the Netlify Forms
channel pointed at a stand-in for Netlify's form handler
(`tests/stubs/netlify-forms.mjs`, on the next port, or `E2E_FORMS_PORT`), so
no test message reaches anyone. Outside CI it reuses whatever already
listens there, so stop a stale `next start` after rebuilding. The run's
tsconfig is `tests/tsconfig.json`: the root one plus a stub for
`import 'server-only'` and a path for `next/server`, so specs can unit-test
server-only modules and call a route handler in Node.
`@playwright/test` is pinned to 1.56.1 (chromium-1194); where those browsers
are installed, set `PLAYWRIGHT_BROWSERS_PATH` (e.g. `/opt/pw-browsers`)
instead of running `playwright install`. Wait on elements, never
`networkidle` (the curtain, the marquee and the globe never stop). The axe
baseline `tests/a11y-baseline.json` is empty and stays empty: fix the page.
The smoke suite fails on any Content-Security-Policy report (the header is
report-only; `next.config.ts` says what each source is for).

| Spec | Covers |
|---|---|
| `smoke` | Every route and head file, the redirects, a clean console, no request off-origin, the CSP, the server HTML, the page without WebGL |
| `a11y` | axe, any impact, on `/`, `/resume`, the 404 and the message box's sent and failure panels |
| `keyboard-walk` | Every Tab stop visible, named, ringed, on screen, not under the top bar, the message box's panels included |
| `contact-ui` | The suggestion, the undo window, the POST (intercepted), the sent panel (with and without a receipt), Send another, the failure panel, Try again, Edit message, Copy email, the 429 panel, the quote, 16px text on phones (landscape too) |
| `contact-api` | The `/api/contact` contract with no Resend key: 400s, the honeypot, 502 when nothing delivered, 200 `delivered: ['forms']` with `receipt: false`, 429 |
| `contact-email` | The email to Roman and the visitor's receipt (content, escaping, plain text, layout at 600 and 375 with long names and addresses), the first-name rule, `oneLine`, when receipts are on, and the route in Node with `fetch` faked: what it hands Resend, the receipt's headers, its per-address limit, no receipt without the email |
| `touch` | Phone swipes that start on the badges, the cards or the timeline scroll the page |
| `resume` | The PIN gate, the builder (mocked data) and its routes |
| `data` | The records, the owner-fixed copy, nothing private in the build |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, check:protected,
build, budget and test:e2e on every PR and branch push. It never deploys and
uses no secrets.

Budgets (`scripts/budget.json`) are each route as measured plus 2%. A change
that goes over says so in its PR instead of raising its own line; budgets
move only in a commit that says why.

## Routes

| Route | What it is |
|---|---|
| `/` | The Stage: `page.tsx` (server: metadata, JSON-LD, a `<noscript>` summary of the whole page) renders `<Stage>` (client) |
| `/resume`, `/api/resume/*` | Roman's PIN-gated builder; its UI lives in `src/app/resume/_ui/` |
| `/api/contact` | The message box's POST: Resend (an HTML and text email to `CONTACT_TO`, reply-to the visitor) and Netlify Forms together; then, when receipts are on and Resend took the email, a receipt to the visitor (marked automatic, one an hour per address) that repeats nothing they typed but a first name passing `src/lib/first-name.ts`. 200 `{ok, delivered, receipt}`, 502 when neither channel delivered (contract at the top of `route.ts`) |
| `/api/csp-report` | Where CSP reports go (logged, 204) |
| 404, `error.tsx`, `global-error.tsx` | The Stage's black, violet and type, each with a way home |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/llms.txt`, `/icon.svg`, `/apple-icon`, `/opengraph-image`, `/twitter-image`, `/humans.txt` | Generated from the same records |
| `/credentials`, `/work`, `/products`, `/about`, `/contact`, `/works`, `/works/:slug`, `/colophon` | 307s to the Stage's sections, or `/` |

## Where things live

| What | Where |
|---|---|
| The work, products, certifications, skills, his own words (`HIS_WORDS`: tagline, manifesto, about, music line) | `src/lib/constants.ts` |
| Roles, schools, dates | `src/lib/site-facts.ts` |
| Email, LinkedIn, GitHub | `src/lib/links.ts` |
| The Stage's shape of all of it (`PERSON`, `PROJECTS`, `PRODUCTS`, `ROLES`, ...), built from the three above, typed nowhere else | `src/lib/content.ts` |
| The résumé's private data (server only) | `src/lib/resume-data.ts` |
| Head and JSON-LD | `src/lib/seo.ts` (`pageMetadata`), `src/lib/structured-data.ts` |
| API settings (server only) | `src/lib/env.ts`; routes never read `process.env` directly |
| The page: sections, top bar, message box | `src/components/stage/` (`look.ts` holds the black, the violet and the header type the 404 and error pages share) |
| The contact emails (to Roman, and the visitor's receipt), server only | `src/lib/contact-email.ts`; the first-name rule they share with the message box is `src/lib/first-name.ts` |
| The 21st.dev components and their `-utils` folders | `src/components/ui/` |
| Theme | `src/app/globals.css`: shadcn's theme unmodified, then the résumé's own tokens |
| Share-card fonts | `src/app/_og/fonts/` (Geist, OFL) |

The About template, the contact card, the footer and the Experience
timeline load after the page (`next/dynamic`, `ssr: false`) behind blocks of
their own height, so the first screen is light and nothing moves when they
land; the `<noscript>` summary covers visitors without scripts.

## Definition of done

- `npm run typecheck`, `npm run lint`, `npm run check:protected`,
  `npm run build`, `npm run budget` and `npm run test:e2e` pass.
- Screenshots at 1440x900 and 390x844 of anything visual, compared with
  before (and, for the home page, with the lab's `/c`).
- A keyboard-only pass on anything interactive (`keyboard-walk.spec.ts`;
  extend it when a page gains controls).
- No new console errors, and no Content-Security-Policy report.
- Honest reporting: what was verified, what was assumed, what was skipped.
- Every visible string change listed old → new in the PR.

## Environment

See `.env.local.example`. `RESEND_API_KEY` / `CONTACT_TO` / `CONTACT_FROM`
(the message box), `RESUME_PIN` (the builder), `ANTHROPIC_API_KEY` (its AI
tools). Netlify provides `URL` and `DEPLOY_PRIME_URL`. A build with no env at
all succeeds; `src/instrumentation.ts` logs which features are off.

The message box today (October 2026): no `RESEND_API_KEY` on Netlify, so
messages are archived in Netlify Forms only (`delivered: ['forms']`) and
nobody is emailed unless Netlify's form notifications are on; the domain has
no records for Resend yet. With `RESEND_API_KEY` set, Roman gets each
message as an email. Receipts (`receiptsEnabled()` in `src/lib/env.ts`)
need that key and a `CONTACT_FROM` on a domain other than resend.dev, whose
shared sender only delivers to the Resend account's own address, and go
only when Resend took the email to Roman; until then the route answers
`receipt: false` and the box doesn't promise one. Roman's setup steps
(Resend key, verifying romankucheryavyy.com with DNS records in Netlify,
the three variables) are in `.env.local.example`.

`docs/` holds the old design's briefs and audit, as history.
