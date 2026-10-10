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
`tests/a11y-baseline.json`; re-record it only as the spec's header says.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, check:protected, build,
budget and test:e2e on every PR and branch push. It never deploys and uses no
secrets.

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
  the `CARD_*` constants and the per-frame `draw` loop stay as they are.
- **Owner-fixed copy:** the FUBC Coffee iOS description keeps "Apple Pay", and
  the Nelectric description stays word for word.

`scripts/check-protected.mjs` enforces the protected files and lines in CI. The
only way past it is a commit whose message carries `[owner-approved:<item>]`,
and that tag needs Roman's written OK first. Merges count: a merge is checked
for whatever it adds beyond git's own re-merge of its parents, so a protected
line edited while resolving a conflict fails the same way, and only the
merge's own message can carry its approval.

## The Phase 0 system, and the rule for each piece

| Piece | Where | Rule |
|---|---|---|
| Work data | `src/lib/work.ts` | Every project and product is a `Work` from `CLIENT_WORK` / `PRODUCTS`. No surface reads the raw constants |
| `<WorkCard>` | `src/components/ui/WorkCard.tsx` | The only way a piece of work is drawn: sizes `sm`/`md`/`lg`, layouts `overlay`/`stacked`, a text-first card for products. Surfaces pick a size and layout, never the crop, radius, border, wash or counter |
| `<WorkLink>` | `src/components/ui/WorkLink.tsx` | The one link pill, and the one way an unlaunched piece is shown |
| `<TagPill>` / `<TagList>` | `src/components/ui/TagPill.tsx` | The one tag pill |
| `<SectionShell>` / `<SectionHeader>` | `src/components/ui/SectionShell.tsx` | Every section below the hero sits in it (the hero never does). Named SectionShell because `resume/page.tsx` has its own `Section` |
| `useRevealOnScroll` | `src/hooks/useRevealOnScroll.ts` | The one scroll reveal (`[data-reveal]` inside the section) |
| Type scale | `@theme` in `src/app/globals.css` | `text-label` / `text-small` / `text-body` / `text-lead`, not new `text-[Npx]` (the exemptions are non-negotiable 7) |
| Radius | `@theme` in `src/app/globals.css` | `rounded-xl` is the card radius; the scale is monotonic |
| Counter | `counterOf()` in `src/lib/work.ts` | `NN / 09` everywhere |

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
- A keyboard-only pass on anything interactive.
- No new console errors.
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
