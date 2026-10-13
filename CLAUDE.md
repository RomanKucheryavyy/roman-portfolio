# CLAUDE.md

Roman Kucheryavyy's portfolio: <https://romankucheryavyy.com>, repo
`RomanKucheryavyy/roman-portfolio`. Next.js 16 (App Router) · React 19 ·
TypeScript · Tailwind v4 · GSAP + framer-motion + Lenis · three.js · Netlify.

Read `docs/REDESIGN-BRIEF.md` and `docs/AUDIT-2026-10.md` before changing
anything that a visitor sees. They hold the reasoning this file only states.

## Never push or merge `main`

`main` auto-deploys to production on every push. Work on a branch and open a
PR; merging is Roman's job. Never push to `main`, never merge into it, never
force-push it, not even "just a hotfix". Redesign streams branch as
`redesign/wN-<slug>` off the integration branch and PR into that, not `main`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config; `next build` no longer lints) |
| `npm run build` | Production build (also writes `.next/diagnostics/route-bundle-stats.json`) |
| `npm run start -- -p <port>` | Serve the build |
| `npm run budget` | First-load JS per route against `scripts/budget.json` (after a build) |
| `npm run check:protected` | Fails on unapproved changes to the protected files and lines below |
| `npm run test:e2e` | Playwright against the production build: desktop 1440x900, mobile 390x844, no-webgl |

e2e notes: build first; the suite starts `npm run start` on 3100 itself
(`E2E_PORT=<port>` to use another). Outside CI it reuses whatever already
listens on that port, so stop a stale `next start` after rebuilding, or the
suite tests the old build. `@playwright/test` is pinned to 1.56.1 to
match chromium-1194; where those browsers are already installed, set
`PLAYWRIGHT_BROWSERS_PATH` (e.g. `/opt/pw-browsers`) instead of running
`playwright install`. Wait on elements, never `networkidle` (the ocean and
Lenis keep the page busy forever). The axe baseline is
`tests/a11y-baseline.json`: every route at 0 except the two hero icon links'
`link-name` (owner-gated, W10 item 4a). Nothing new goes into it; fix the page.
`tests/keyboard-walk.spec.ts` Tabs through every route at 1440 and 390 and
fails on a stop that is invisible, unnamed, unringed, off screen or under the
nav. The smoke suite fails on any Content-Security-Policy report (the header
is report-only; see `next.config.ts` for what each source is for).

CI (`.github/workflows/ci.yml`) runs typecheck, lint, check:protected, build,
budget and test:e2e on every PR and branch push. It never deploys and uses no
secrets.

The budgets in `scripts/budget.json` are W12's ratchet: each route as measured
at W12 plus 2%, every built route on its own line. A change that goes over
says so in its PR instead of raising its own line; budgets move only in a
commit that says why.

## The non-negotiables

1–8 are `docs/REDESIGN-BRIEF.md` §3, verbatim ("violating these makes it
worse"); 9 is the redesign plan's facts rule.

1. **Do not touch the hero's layout or the FFT ocean.** He reverted a hero
   redesign once already. The ocean is tiered, reduced-motion aware and has a
   WebGL2 fallback. Leave it.
2. **Do not replace the drag deck with a grid**, and do not move the `/works`
   wheel onto the home page. The deck and the wheel are the two interactions no
   template gives you. The problem was never the deck — it was that the deck's
   card disagreed with five other cards.
3. **Do not flatten the musical metaphor.** "The Measures", "The Symphony",
   "Let's Compose", the staff notation, the fermata in the sent-toast — that is
   the personality. Make it *consistent*, do not delete it.
4. **Do not unify the mobile deck's horizontal drag to match desktop's
   vertical.** A code comment records that a vertical axis with
   `touchAction: none` made the whole page unscrollable on phones.
5. **Do not consolidate gsap / framer-motion / lenis.** Their jobs don't
   overlap.
6. **Do not give the Compositions cards fake screenshots.** They're private
   products; there is nothing to shoot. The client-work vs own-products
   distinction is real — make the *label* carry it.
7. **Do not apply a 12px font floor blindly.** SVG axis ticks, DNA glyphs and
   the print-preview resume are legitimately smaller.
8. **Do not promote the dead token layer.** 39 tokens in `globals.css:45–85`
   with zero `.tsx` consumers. Delete it, don't revive it.
9. **Never invent facts.** Every number or claim is derived from repo data or
   fetched live. Anything else becomes a `// needs Roman:` comment and is not
   rendered.

Also standing:

- **W10 is cancelled: the hero is untouchable.** No edits to `Hero.tsx`,
  `fft-ocean.tsx`, `fft-ocean-utils/*`, `Starfield.tsx`, `useParallax.ts` or
  `useMouseVelocity.ts`, not even attributes.
- **Never push or merge `main`** (above).
- **Deck physics and wheel geometry are frozen.** In `Projects.tsx`, no line
  with `drag=`, `dragConstraints`, `dragElastic`, `SPRING`, `STACK_DEPTH` or
  `touchAction` changes. In `works-wheel.tsx`, `STEP`, `DRUM`, `LENS`, `BOW`,
  `RING_R`, `CULL`, `EASE`, the `CARD_*` constants, the transform math
  (`bowAt()`, `place()`) and the per-frame `draw` loop stay as they are.
- **Owner-fixed copy:** the FUBC Coffee iOS description keeps "Apple Pay", and
  the Nelectric description stays word for word.

`scripts/check-protected.mjs` enforces the protected files and lines in CI. The
only way past it is a commit whose message carries `[owner-approved:<item>]`,
and that tag needs Roman's written OK first. Merges count: a merge is checked
for whatever it adds beyond git's own re-merge of its parents, so a protected
line edited while resolving a conflict fails the same way, and only the
merge's own message can carry its approval.

## The system, and the rule for each piece

Use the piece; never copy its class strings into a new file.

| Piece | Where | Rule |
|---|---|---|
| Work data | `src/lib/work.ts` | Every project and product is a `Work` from `CLIENT_WORK` / `PRODUCTS`. No surface reads the raw constants |
| `<WorkCard>` | `src/components/ui/WorkCard.tsx` | The only way a piece of work is drawn: sizes `sm`/`md`/`lg`, layouts `overlay`/`stacked`, a text-first card for products. Surfaces pick a size and layout, never the crop, radius, border, wash or counter. "Program notes" shows only for a published study (`notesHref`) |
| `<WorkLink>` | `src/components/ui/WorkLink.tsx` | The one link pill, and the one way an unlaunched piece is shown |
| `<TagPill>` / `<TagList>` | `src/components/ui/TagPill.tsx` | The one tag pill |
| `<SectionShell>` | `src/components/ui/SectionShell.tsx` | The one column: every section below the hero (the hero never), and every other page. Server-safe (no `'use client'`, no tailwind-merge). Named SectionShell because the résumé builder has its own `Section` |
| `HeaderFrame`, `<SectionHeader>`, `<PageHeader>` | `SectionShell.tsx`; `SectionHeader.tsx` | One header contract: kicker, heading, intro, one set of type, ink and gaps. A home-page movement uses `<SectionHeader movement=…>` (an h2 that assembles, client); any other page uses `<PageHeader>` (a static h1, server). `introRole="alert"` for a page whose intro is its message |
| `useRevealOnScroll` | `src/hooks/useRevealOnScroll.ts` | The one scroll reveal (`[data-reveal]` inside the section). Keyboard focus reveals at once |
| `<Button>` | `src/components/ui/Button.tsx` | Every action button but the hero's: `solid` / `paper` / `outline`, `href` renders a link, `pending` + `pendingLabel` keep the width |
| `PILL_OUTLINE` | `src/components/ui/pill.ts` | The outline pill (Button's `outline`, CopyButton, the 404's links) |
| `<FactList>` | `src/components/ui/FactList.tsx` | Every term/value list: `rows` or `grid` (the record row, Conductor's facts, /colophon, a program note's header) |
| `<CopyButton>` / `useCopyToClipboard` | `src/components/ui/CopyButton.tsx`, `src/hooks/` | Every copy action, with an announced Copied / Copy failed |
| `<Panel>` / `PANEL`, `<TerminalBar>` | `src/components/ui/Panel.tsx`, `TerminalBar.tsx` | The card surface; the terminal title bar |
| `<ExpandableText>` | `src/components/ui/ExpandableText.tsx` | The one "more" toggle, rendered only on real overflow |
| `dialog.tsx` | `src/components/ui/dialog.tsx` | Every modal: `center` (the detail view), `sheet` (the phone menu) |
| `SiteChrome`, `SiteFooter`, skip link | `src/components/ui/`, `src/app/layout.tsx` | On every route. Every page renders `<main id="main" tabIndex={-1}>` and takes no focus on arrival, so the first Tab is "Skip to content" |
| `useScrollSpy`, `scrollToTarget()` | `src/hooks/useScrollSpy.ts`, `src/lib/lenis.ts` | The one spy, and the one way to jump to a section (through Lenis, instant under reduced motion, focus to its heading) |
| `useDeckKeys` | `src/hooks/useDeckKeys.ts` | Both decks' arrow keys |
| Type scale | `@theme` in `src/app/globals.css` | `text-label` / `text-small` / `text-body` / `text-lead`, not new `text-[Npx]` (the exemptions are non-negotiable 7). The lint guard is an error |
| Ink | `@theme` in `src/app/globals.css` | `text-ink-body` / `-meta` / `-faint`, never `text-white/NN` (lint error). Any text a visitor can see is `ink-meta` or stronger, aria-hidden or not; `ink-faint` is for marks not read as words (glyphs, separators, placeholders) |
| Radius | `@theme` in `src/app/globals.css` | `rounded-xl` is the card radius; the scale is monotonic |
| Counter | `counterOf()` in `src/lib/work.ts` | `NN / 09` everywhere |
| Facts | `src/lib/site-facts.ts`, `case-studies.ts`, `app-store.ts`, `build-info.ts` | Roles, education and the timeline come from site-facts; a study builds only through `assertPublishable`; live App Store data renders nothing when the lookup fails; the build stamp is `sha7(BUILD_SHA)` or "local build" |
| Head | `src/lib/seo.ts`, `src/lib/structured-data.ts` | Every page's metadata is `pageMetadata({ path, … })` (its own canonical); a segment with its own `opengraph-image` passes `images: false`. One JSON-LD graph, no ratings |
| Routes and flags | `src/lib/routes.ts` | Internal links read `ROUTES`; `RESUME_PUBLIC` (false) decides every résumé link; `sectionHref()` for a section from anywhere |
| Env | `src/lib/env.ts` (server-only) | API routes read env through its getters, never `process.env` |
| Decoration | `data-decorative` | Pure decoration (today only the DNA helix) is left out of the axe audit; it must be aria-hidden with nothing focusable inside (tested) |

## Routes

| Route | What it is | Its signature |
|---|---|---|
| `/` | The 30-second pitch: the hero (untouchable), then 01 Credentials, 02 Work, 03 Products, the interlude, 04 About, 05 Contact. `page.tsx` is the server shell with a `<noscript>` summary; `HomeClient.tsx` is the page | The drag deck |
| `/works` | The setlist: the 9 client pieces, the wheel from md up, a list on phones, ItemList JSON-LD, its own share card | The wheel |
| `/works/[slug]` | Program notes: blocks A–E, every claim footnoted to a source. All studies are `published:false`, so every slug is a 404 until Roman supplies content | Every claim cited |
| `/colophon` | Liner notes: typefaces, stack versions, the score, the build stamp and the budgets, all read from the repo at build. Engineering notes wait on `NOTES_PUBLISHED` | Derived facts only |
| `/resume` | Option B: Roman's PIN-gated builder, `noindex`; the data loads only after the PIN (`/api/resume/data`) | (a work surface: native pointer, no grain) |
| 404, `error.tsx`, `global-error.tsx` | `// 404. Not found`, **Tacet.**; a black error page with Try again | — |
| `/llms.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/icon.svg`, `/apple-icon`, OG images | Generated from the same data | — |
| `/api/app-store`, `/api/contributions`, `/api/contact`, `/api/resume/*` | Live App Store facts (nulls on failure); GitHub weeks (keeps the last good payload); the contact form; the PIN-guarded builder | — |
| `/credentials`, `/work`, `/products`, `/about`, `/contact` | 307s to `/#measures` … `/#compose` | — |

**One signature interaction per page.** It is a review principle, not a list
of cuts: a page keeps the one thing no template gives it, and anything new on
that page supports it rather than competes with it.

## The score manifest

`src/lib/score.ts` names every movement once. The nav (front face `label`,
flip face `score`, hover hue), the kickers (`kickerOf`), the transition
captions and hairlines, the scroll staff's notes, every heading's accent
(`.text-key`, a static gradient from the movement's key into the next one's)
and the /colophon table all read it. Renaming a movement is one line there.

| id | numeral | label | score | key | caption before it |
|---|---|---|---|---|---|
| hero | – | – | – | red (the overture keeps the animated spectrum) | – |
| measures | 01 | Credentials | Measures | orange | `// loading credentials...` |
| symphony | 02 | Work | Symphony | amber | `/* compiling the work */` |
| compositions | 03 | Products | Compositions | green | `// premiering the compositions...` |
| interlude | – | – | – | teal | `/* decoding signal */` |
| conductor | 04 | About | Conductor | blue | `// the conductor speaks...` |
| compose | 05 | Contact | Compose | purple, resolving to red | `/* opening a channel */` |

The H2s ("The Measures", "The Symphony", "The Compositions", "The Conductor",
"Let's Compose"), the fermata line and `tacet` are byte-identical by test.

**The notation rule.** Any staff drawn along a scroll, time or commit axis
draws only data. The scroll staff (`ScrollProgress.tsx`) puts a barline where
each movement really starts, one note per numbered movement and a playhead at
the scroll position; YearInMeasures draws one note per real contribution week
and stays hidden while the year's total is under 50; the Conductor timeline puts each dot
at its real year. The Conductor music card's staff is an illustration, not a
chart, so the rule does not apply to it. Never add decorative notes to a staff
that reads as a chart.

## 21st.dev

A component must **retire something named**, or it is not installed. Before
merge it is re-skinned to this site: no `dark:` variants (the site is dark-only
and Tailwind v4's `dark:` follows the OS), no `tailwindcss-animate` /
`animate-in` classes, no `cva`, no foreign palette, and `framer-motion`, not
`motion/react`. One author per commit, and the commit message names what it
retires.

## Definition of done

- `npm run typecheck`, `npm run lint`, `npm run build` pass; `npm run budget`
  and `npm run check:protected` pass; `npm run test:e2e` passes.
- Screenshots at 1440x900 and 390x844 of anything visual, compared with before.
- A keyboard-only pass on anything interactive (`tests/keyboard-walk.spec.ts`
  covers every route; extend it when a page gains controls).
- No new console errors, and no Content-Security-Policy report.
- Honest reporting: what was verified, what was assumed, what was skipped.
- Every visible string change listed old → new in the PR.

## Environment

See `.env.local.example`. `RESEND_API_KEY` / `CONTACT_TO` / `CONTACT_FROM`
(contact email), `RESUME_PIN` (the /resume builder), `ANTHROPIC_API_KEY` (its
AI tools). Netlify provides `URL`, `DEPLOY_PRIME_URL`, `COMMIT_REF` and
`CONTEXT`. A build with no env at all succeeds.

## More

- `docs/REDESIGN-BRIEF.md`: who this is for, the strategy, the 100 ideas.
- `docs/AUDIT-2026-10.md`: the consistency audit and its do-not-do list.
