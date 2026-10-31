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

On 2026-10-30 he added the Roman intro, from kedhareswer's Old Masters
Preloader on 21st.dev: "this for my porfolio woudl be sick, redesign it to
like roman theme since my name is roman", and then, of his products: "this
also cool for my featured projects like alongside events". So the page opens
on a prologue, and each product in Act II on a title card (below).

On 2026-10-31, shown the hero on his phone: "i like it but it's now kinda
clashing between two style we need one, like this hero needs to be the roman
style instead and other projects lists and components feel like there's no
unity there two completely different styles we need coherent", and "but also
make it not feel repetitive". So the whole page took the intro's look, the
**Imperial Stage** (below): one palette, one type system, one button, one
section header from the intro to the footer, and a different Roman idea in
each section, so it reads as one book with different chapters.

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
- **One look, never the same idea twice.** Everything on the Stage takes the
  Imperial Stage's palette, type, button and header (below); each section
  keeps its own Roman idea. The statues stand only in the intro and the
  four title cards; the meander ring draws only in the intro.

## The look: the Imperial Stage

- **Palette** (`imperial.ts` `PALETTE`, the one source; `look.ts`
  `STAGE_STYLE` sets it as CSS variables on the Stage's wrapper): ground
  `#07050f` (the page), imperial violet `#24115e` (washes, the curtain,
  fills at low alpha), gold `#d6b25e` (the one accent: numerals, rules,
  links' hover, the focus ring; never a large fill), glow `#ffdf9e` (rare),
  marble `#f2ece2` (headings, primary text), lavender `#b6acd6` (secondary
  text), rule `#4b3a8a` (borders, at 40-70%). In classes they are Tailwind
  colours (`globals.css`): `text-gold`, `border-gold/40`, `bg-imperial/45`,
  `hover:text-glow`, `border-rule/60`, with shadcn's `foreground` (marble),
  `muted-foreground` (lavender) and `background` (ground). Every text colour
  clears AA on what is behind it: check it, axe has no baseline.
- **Type** (`roman-type.ts`, the one place the faces are declared; on
  `<html>` from `layout.tsx`): Cinzel, `font-roman`, preloaded, for the
  hero's name, every h2, the top bar's brand, product and project titles and
  numerals (its lowercase draws as small capitals: that is the look);
  Cormorant Garamond italic, `font-serif`, preloaded, for his voice:
  taglines, section intros, quotes, his words (18px and up on phones); Geist
  for everything read or used: nav, buttons, labels, descriptions, fields,
  dates (years stay Arabic). The faces are font bytes, not JS: Cinzel 25.9
  kB, Cormorant italic 39.3 kB.
- **Shapes** (`look.ts`): `stageButton('primary' | 'secondary', 'md' |
  'sm')`, the intro's ENTER (rectangular, a 2px radius, Geist capitals;
  marble fill, or a gold edge), for every action, the message box's Send
  included (kokonut-undo-button's `radius`, a `[site edit]`); pills are for
  statuses only. `SectionHeader` (`section-header.tsx`) is every act's
  header: the gold numeral and a hairline, the kicker in Geist capitals, the
  h2 in Cinzel, the intro in Cormorant. `STAGE_FOCUS` is the one focus ring:
  gold, 2px, offset 4.
- **Each section's own idea:** the hero, the kokonut curtain dyed imperial
  with the name in Cinzel; Act I, inscribed plaques (a gold edge, rivets,
  the number in a tabula ansata); Act II, the title cards, then rows with a
  gold-edged status and gold-on-violet diagrams; Act III, a road of gold
  milestones; Act IV, a frieze of laurel seals; About, the portrait in an
  arched niche and the skills as marble tiles; Contact, the world in gold on
  a violet globe; the footer, his name cut in outline Cinzel over the
  fluted violet glass.

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
| `node scripts/capture-products.mjs [id] [desktop\|phone]` | Re-captures the public products' previews from their live sites (below) |
| `npm run test:e2e` | Playwright against the production build: desktop 1440x900, mobile 390x844, no-WebGL |

Every spec starts as a browser that saw the intro a moment ago (a
`storageState` in `playwright.config.ts` holding `rk:intro`), so the page
opens straight on the Stage; `intro.spec` starts from nothing or loads
`/?intro`.

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
| `keyboard-walk` | Every Tab stop visible, named, ringed, on screen, not under the top bar, the message box's panels and every product's preview, link and Pause included |
| `intro` | The Roman intro: shows on a first visit, not again within 12 hours, again after them, with `?intro`, never with a hash, under reduced motion or without scripts; the page comes back at once if the stage's code fails, and at the 8 s fail-safe if it never arrives (and it never shows late); the count in Roman numerals; Skip (focus stays inside); the landing's words from the records; Enter (from the unveil on), Escape (straight to the exit), ArrowDown, PageDown, End, a wheel or swipe during the load and a nav link each lift it onto the page (focus on main, or the section; the page scrolls); Tab stays inside and every stop shows, ringed; axe during the load and at the landing; a clean console, no CSP report, nothing off-origin; nothing off screen and no overlapping pills from 320 to 1920 |
| `products` | Act II: each product's title card (its own words, aria-hidden, nothing to focus, images from this origin, mounting in view and unmounting after, nothing below moving, the still landing under reduced motion), Roman's order, each public product's real screenshots loading (`naturalWidth`) with alt text naming the site, the preview playing only while most of it is in view (also when it arrives in view as it mounts), back to the top after leaving, its two shots on one loop, holding still on hover, focus and Pause, the private products' diagrams (the product at the centre, its own parts, the links listed for screen readers, the beams running and pausing), nothing below moving when the previews land, no sideways scroll, no diagram overflowing and every beam long enough and out from under the cards from 320 to 1920 wide, and nothing moving under reduced motion |
| `contact-ui` | The suggestion, the undo window, the POST (intercepted), the sent panel (with and without a receipt), Send another, the failure panel, Try again, Edit message, Copy email, the 429 panel, the quote, 16px text on phones (landscape too) |
| `contact-api` | The `/api/contact` contract with no Resend key: 400s, the honeypot, 502 when nothing delivered, 200 `delivered: ['forms']` with `receipt: false`, 429 |
| `contact-email` | The email to Roman and the visitor's receipt (content, escaping, plain text, layout at 600 and 375 with long names and addresses), the first-name rule, `oneLine`, when receipts are on, and the route in Node with `fetch` faked: what it hands Resend, the receipt's headers, its per-address limit, no receipt without the email |
| `touch` | Phone swipes that start on the badges, the cards, a product's preview, diagram or title card, or the timeline scroll the page |
| `resume` | The PIN gate, the builder (mocked data) and its routes |
| `data` | `toRoman`; the intro's and cards' words read from the records; the cast's files (present, their declared sizes, small, credited in humans.txt); the records (the products' order, previews and flows included: a flow's words are its description's, its links only the stated ones), the preview files' sizes, the owner-fixed copy, nothing private in the build |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, check:protected,
build, budget and test:e2e on every PR and branch push. It never deploys and
uses no secrets.

Budgets (`scripts/budget.json`) are each route as measured plus 2%. A change
that goes over says so in its PR instead of raising its own line; budgets
move only in a commit that says why.

## Routes

| Route | What it is |
|---|---|
| `/` | The Stage: `page.tsx` (server: metadata, JSON-LD, a `<noscript>` summary of the whole page, the intro's inline gate) renders `<Intro>` and `<Stage>` (client) |
| `/resume`, `/api/resume/*` | Roman's PIN-gated builder; its UI lives in `src/app/resume/_ui/` |
| `/api/contact` | The message box's POST: Resend (an HTML and text email to `CONTACT_TO`, reply-to the visitor) and Netlify Forms together; then, when receipts are on and Resend took the email, a receipt to the visitor (marked automatic, one an hour per address) that repeats nothing they typed but a first name passing `src/lib/first-name.ts`. 200 `{ok, delivered, receipt}`, 502 when neither channel delivered (contract at the top of `route.ts`) |
| `/api/csp-report` | Where CSP reports go (logged, 204) |
| 404, `error.tsx`, `global-error.tsx` | The Stage's ground, violet wash, gold and Cinzel (`look.ts`), each with a way home |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/llms.txt`, `/icon.svg`, `/apple-icon`, `/opengraph-image`, `/twitter-image`, `/humans.txt` | Generated from the same records |
| `/credentials`, `/work`, `/products`, `/about`, `/contact`, `/works`, `/works/:slug`, `/colophon` | 307s to the Stage's sections, or `/` |

## Where things live

| What | Where |
|---|---|
| The work, products (with each public one's `preview` and each private one's `flow`), certifications, skills, his own words (`HIS_WORDS`: tagline, manifesto, about, music line) | `src/lib/constants.ts` |
| Roles, schools, dates | `src/lib/site-facts.ts` |
| Email, LinkedIn, GitHub | `src/lib/links.ts` |
| The Stage's shape of all of it (`PERSON`, `PROJECTS`, `PRODUCTS`, `ROLES`, ...), built from the three above, typed nowhere else | `src/lib/content.ts` |
| The résumé's private data (server only) | `src/lib/resume-data.ts` |
| Head and JSON-LD | `src/lib/seo.ts` (`pageMetadata`), `src/lib/structured-data.ts` |
| API settings (server only) | `src/lib/env.ts`; routes never read `process.env` directly |
| The page: sections, top bar, message box | `src/components/stage/` (`look.ts`: the palette's CSS variables, the button, the focus ring and the header type, which the 404 and error pages share; `section-header.tsx`: every act's header; `contact-card.tsx`: the contact card with the message box) |
| Act II, his products: the rows, then the previews that load after the page, and the sizes both share | `src/components/stage/products.tsx`, `product-previews.tsx`, `preview-box.ts` |
| The products' screenshots (WebP, desktop at 1280 wide, phone at 390 wide saved at 1.5x) and the script that takes them | `public/images/products/`, `scripts/capture-products.mjs` |
| The contact emails (to Roman, and the visitor's receipt), server only | `src/lib/contact-email.ts`; the first-name rule they share with the message box is `src/lib/first-name.ts` |
| The Roman intro: the gate (`intro.tsx`, `intro-gate.ts`), the stage (`intro-stage.tsx`), the cast (`cast.ts`); the palette (`imperial.ts`) and the faces (`roman-type.ts`), which the whole page uses | `src/components/stage/` |
| The products' title cards | `src/components/stage/product-stage.tsx` (the box, and when it plays), `product-stage-card.tsx` (the stage) |
| Roman numerals | `src/lib/roman.ts` (`toRoman`: 1 to 3999, "·" for 0) |
| The statues (WebP, the figures pre-keyed) and the script that makes them | `public/images/cast/`, `scripts/fetch-cast.mjs` |
| The 21st.dev components and their `-utils` folders | `src/components/ui/` |
| Theme | `src/app/globals.css`: shadcn's theme unmodified, the Roman faces' families, the Stage's inks as Tailwind colours, the intro's gate, then the résumé's own tokens |
| Share-card fonts | `src/app/_og/fonts/` (Geist, OFL) |

The products' previews, the About template, the contact card (with the
message box inside it: `contact-card.tsx`), the footer and the Experience
timeline load after the page (`next/dynamic`, `ssr: false`) behind blocks
of their own height, so the first screen is light and nothing moves when
they land; the `<noscript>` summary covers visitors without scripts.

### Act II, his products

Roman asked for it on 2026-10-27: "the way projects are presented like
alongside events which are like my biggest projects seems very boring
should be a preview of it and more cooler". Each product is a split row,
alternating sides from lg, in his order (Alongside Events, Sembly, Praxis,
Alongside Brain). A row reads: its number in Roman numerals ("II / IV";
screen readers get "02 / 04"), its status on a gold-edged pill, its title in
Cinzel and tagline in Cormorant, the preview, the description, the stack as
an inscribed line and the link. On phones the title card just above already
shows the number, status and tagline, so there the row keeps them for screen
readers only and opens on its title.

- The public ones show their live sites: a real full-page screenshot in a
  browser frame (dillionverma/safari) and on a phone (designali-in/
  iphone-16-pro), scrolling by itself (one Web Animations transform per
  shot, both on one loop so they reach each end of the page together). It
  plays only while most of the preview is in view, and starts again from
  the top of the page after it has left the screen; it holds still on
  hover, while its link has focus, after Pause, and always under reduced
  motion. Below md the phone shows alone.
- The private ones (no public screens) show their parts around them: the
  product at the centre (its title and the description's opening line),
  the parts the description names in its words, and only the links it
  states (`flow` in constants.ts; `data.spec` checks the words and pins the
  links), drawn with klyv-ui/klyv-animated-beam between dots on the cards'
  edges so each beam shows whole. Which part feeds which beyond that is a
  `// needs Roman:` there. No screenshots and no made-up screens.
- To refresh the screenshots: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
  node scripts/capture-products.mjs` (or an id, `desktop` or `phone`). It
  loads each site at 1280 and at 390 wide, scrolls it once so everything
  that reveals on scroll has, crops to the first screens (less where a
  page pins a stretch that a still shows blank), puts a status-bar band
  above each phone shot for the frame's Dynamic Island, and writes WebP at
  the sizes the page declares. Then set `captured` in constants.ts to the
  year and month it prints, look at the files, and commit them. A page that
  changes height enough to want a new crop changes the crop in the script
  and the sizes in constants.ts together.

### The Roman intro, and the title cards

kedhareswer/old-masters-preloader (`src/components/ui/old-masters-preloader.tsx`),
as published plus four `[site edit]`s, each keeping the published behaviour
when its prop is absent: `fonts` (the site's own faces, waited for, the word
re-fitted when they land; CSP allows no font from elsewhere), `wordAs` (the
word's element: the page has its h1, so both stages use a `p`), `formatCount`
(Roman numerals) and `lift` (lift the stage off from any phase, re-applied on
every phase change while asked for, so a timer can't set the landing back).

- When: on `/` only, at most once in 12 hours per browser (localStorage
  `rk:intro`), never with a hash in the address, under reduced motion or
  without scripts, nor for a browser that asks to save data or reports a 2G
  connection. `?intro` shows it regardless, for Roman to show people.
  An inline script (`INTRO_GATE`, first in `page.tsx`) decides before the
  first paint and sets `data-intro` on `<html>`; `globals.css` keeps the
  page hidden on the intro's ground until it lifts, and the script gives
  the page back after 8 s if the stage never mounts (a gold ring breathes on
  the dark until then). If the stage is taken down by an error, it gives the
  page back too.
- What: ROMAN in Cinzel inside the gold meander, the count in Roman
  numerals, then the imperial violet flood (`imperial.ts`) and the cast:
  Hercules and Apollo, David blurred behind. The
  words are the records': his tagline, "Prologue · " and the year in Roman
  numerals, his initials, his client projects and certifications counted in
  Roman numerals, and on wide screens his role ("By day") and his music
  ("By calling").
- Ways out, each lifting it straight onto the page: Enter, a wheel down or
  an upward swipe, Escape, ArrowDown, PageDown, End, and its nav links,
  which land on their section. While it is up it is a modal dialog in a
  portal on `<body>`, everything else inert; after, focus is on `<main>`.
- The gate is all that loads for a visitor who doesn't see it; the stage,
  the component and the statues load only when it shows. The faces are the
  whole page's now (Cinzel and Cormorant Garamond italic preloaded on every
  route from `layout.tsx`; Cormorant upright, the counter's, not preloaded),
  and the stages are handed them (`ROMAN_FONTS`) to wait for.
- The statues are Unsplash photographs, credited as the component credits
  them (`cast.ts`, `public/humans.txt`). `node scripts/fetch-cast.mjs [id]`
  rewrites them: the two figures pre-keyed (alpha from luminance through
  the component's own transfer, so Safari, which may ignore the component's
  CSS mask, still shows only the statue), the Hercules cut at the belly in
  the file itself, the David an opaque backdrop. Set the printed sizes in
  `cast.ts` and look at the files before committing. (The David photograph
  can't be keyed as a figure: his face is as dark as the wall behind him.)
  The component's fourth photograph, a marble figure holding flowers, is
  left out: Roman, 2026-10-31, "can we remove the girl tho cuz she looks
  naked".

Each product in Act II opens on a title card of the same staging
(`product-stage.tsx`): its title, tagline, domain or "Private", status and
number, one statue (Apollo for Alongside Events and Sembly, the Hercules for
Praxis and Alongside Brain, mirrored on the left-hand rows), and a public
product's own screenshot blurred behind, and no meander ring (the intro's
alone), so a card loads on its own word and count. It is aria-hidden with
nothing to focus (the row below keeps the heading and the link); its stage
mounts once 35% of it is in view and unmounts once it has left the screen;
its box has a fixed height, so nothing below moves.

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
