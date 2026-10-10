# Portfolio v2 — build brief

For a fresh Claude Code session. Everything it needs is here or in
`docs/AUDIT-2026-10.md`. Read both before writing code.

---

## 1. Who this is for

**Roman Kucheryavyy** — Sr. Technical Support Engineer, Salesforce Gov Cloud.
8 Salesforce certifications. Full-stack builder. Conducts the FUBC band
(trumpet). Auburn, WA.

Live site: <https://romankucheryavyy.com> · Repo: `RomanKucheryavyy/roman-portfolio`

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
GSAP + framer-motion + Lenis · three.js · Netlify.

### His own words on what's wrong

> "my portfolio is glitchy, random not nicely developed and lacks consistency
> and too much randomness like some my projects shown one way some show other"

He wants to **stand out among vibe coders**.

---

## 2. The strategy — read this before the task list

The instinct is to add more beautiful components. **That instinct is the trap.**

Every vibe-coded portfolio in 2026 is assembled from the same parts: gradient
hero, animated headline, bento grid, glassmorphism, logo marquee, a contact
form that silently fails. Adding a fifth gorgeous component makes this site
*more* like them, not less — and "too much randomness" is literally the symptom
of having done that six times already.

What almost none of them have, and Roman actually does:

| His real advantage | What most portfolios have instead |
| --- | --- |
| Sr. TSE on Salesforce **Gov Cloud**, 8 certs | "Passionate about clean code" |
| An iOS app **shipped to the App Store** | A screenshot of a side project |
| Software running a **real coffee cart at real weddings** | A to-do app |
| A worship-scheduling product (Sembly) **with live users** | A landing page |
| An AI trading desk + an Obsidian second brain **running unattended** | An OpenAI wrapper |
| **Conducts a band** — a genuinely rare narrative | A hobbies section |

**So the differentiator is proof, not polish.** The site should demonstrate
rather than assert. Concretely, that means:

- A case study with a real number in it beats ten animated cards.
- Something *live* on the page (real data from his real systems) beats any
  static claim, because a vibe coder cannot fake it.
- Performance and accessibility that actually pass are differentiators now,
  precisely because AI-assembled sites usually fail both.
- Depth on three projects beats breadth on nine.

Use beautiful components **to carry that proof**, not instead of it.

---

## 3. Hard constraints — violating these makes it worse

Taken from the audit's `doNotDo` list. The full reasoning is in
`docs/AUDIT-2026-10.md`.

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

---

## 4. Phase 0 — foundation (do this first, nothing else works without it)

The audit's finding, verbatim: *"Fix the card first. Almost everything a visitor
calls 'random' is downstream of that one missing component."*

1. **`<WorkCard>`** — one card, used by every surface. Fixed contract:
   `aspect-[16/10]` (every source PNG is 1280×800), one radius, one border, the
   `project.color` multiply wash, title bottom-left, `NN / 09` counter.
   Size tiers (`sm` / `md` / `lg`) because the wheel's card is only ~261×180px.
2. **`<WorkLink>`** — owns all five current link treatments *and* all four
   unlaunched-work treatments.
3. **`<TagPill>`** — one pill. There are five variants today.
4. **`<SectionShell>`** — one padding/container/inset rhythm.
   ⚠️ Name it `SectionShell`, **not** `Section` — `resume/page.tsx:85` already
   declares a local `Section`.
5. **Type scale** — 4 named steps in `@theme`. There are 24 sizes from five
   sizing systems today.
6. **One reveal hook** — `useRevealOnScroll`. Five mechanisms today.
7. **Delete the dead token block** and the components nothing imports.
8. **Fix the non-monotonic radius scale** — `--radius-2xl: 1rem` is currently
   *smaller* than `--radius-xl: 24px`.

Then the mobile crop bug: `Projects.tsx` mobile deck uses `aspect-[3/4]` against
a 1280×800 source, showing the middle **47%** of every screenshot, while
`/works` shows the same file uncropped. Same phone, same image, different crop.

---

## 5. The 100

Grouped. Numbered for reference, not priority — Phase 0 comes first regardless.

### A. Design system (1–12)

1. Single `<WorkCard>` with size tiers, replacing six hand-written layouts.
2. `<WorkLink>` and `<TagPill>` primitives.
3. `<SectionShell>` with one rhythm.
4. Four-step type scale in `@theme`, migrate off 6 arbitrary `text-[Npx]`.
5. Monotonic radius scale.
6. One border token (`border-white/10`) replacing `/5`, `/10`, `/15`.
7. Collapse the 7 near-duplicate text opacities to 3 semantic roles.
8. One numbering format — `NN / 09` everywhere (today: `01 / 09`, `op. 01`, none).
9. One terminal-dot implementation (today: four, three mechanisms).
10. Settle `SectionTransition`'s sixth palette against the brand gradient.
11. One definition of "mobile" (today: five disagreeing ones).
12. Document the system in a `/styleguide` route, dev-only.

### B. Proof over decoration (13–26)

13. **Three real case studies** at `/work/[slug]` — problem, constraint,
    decision, outcome, with a number in the outcome.
14. Lead with **Alongside Events**: software that runs a real coffee cart at
    real weddings. Thermal printing, QR ordering, offline tolerance.
15. **FUBC Coffee iOS** — it is on the App Store. Say so with the badge.
16. **Sembly** — a product with live users and row-level-security as the actual
    boundary. That detail is senior-engineer signal.
17. Per-project **stack and role** as real fields in `constants.ts` — today the
    modal hardcodes `Role: Design & Development` for all nine, including the
    Swift app.
18. A **decision log** per case study: one hard call and why.
19. Salesforce **Gov Cloud** framed as what it is — compliance-constrained
    enterprise engineering. Almost no portfolio in this cohort has it.
20. Cert cards link to **verifiable Trailhead credentials**.
21. A one-line "what I'd do differently" per project. Signals seniority.
22. Retire `ProjectModal` or feed it properly — today it has no link, no status,
    no colour, a blurred screenshot and invented metadata.
23. Distinguish **client work** from **own products** by label, not by styling.
24. Show the unlaunched work honestly, one way, everywhere.
25. Replace "Projects & Work" / "Original Works" with nouns a recruiter parses.
26. A short, scannable **"what I'm good at"** that isn't a tech-logo marquee.

### C. Live and unfakeable (27–38)

27. **Live GitHub contributions** — already built as musical notation. Keep it;
    it is genuinely novel.
28. A **build-info footer**: commit SHA, build time, Lighthouse score. Quiet
    proof the site is engineered.
29. **Live uptime/status** for Sembly and the coffee-cart stack.
30. Real **App Store rating/downloads** for FUBC Coffee, if the API allows.
31. A **"currently"** block driven by data, not hand-edited prose.
32. `/now` page — what he is building this month.
33. Live **Praxis paper-trading P&L** (if he is willing to show it — ask).
34. Anonymised **Alongside Events** throughput: orders served, events run.
35. **RSS/JSON feed** for anything he publishes.
36. `/uses` page — real tools, real reasons.
37. A **changelog** for the site itself.
38. Make `/works` the canonical index and link it from the nav.

### D. Performance (39–50)

39. Set and enforce a **performance budget** in CI.
40. The nine project PNGs are ~6.3MB; `roman.jpg` alone is 587KB. Convert to
    AVIF/WebP with `next/image`.
41. Audit the **three.js + Spline + GSAP + framer-motion + Lenis** payload. Keep
    them, but load each only where used.
42. Route-level code splitting; the ocean should not ship to `/resume`.
43. Real **INP** measurement, not just Lighthouse.
44. Preload only the fonts actually used above the fold.
45. Self-host fonts — Google Fonts is a third-party round trip.
46. Lazy-load the Spline iPhone behind an intersection observer.
47. Cache `/api/contributions` properly at the edge.
48. Ship a real `manifest.json` and offline fallback.
49. Measure the ocean's frame cost on real hardware — **never verified**;
     the only measurement so far was 3.5fps under software rasterisation.
50. Set `fetchPriority` on the hero image path.

### E. Accessibility (51–62)

51. **The deck is not keyboard operable.** `motion.li` with `onClick`, no
    `role`, no `tabIndex`, no key handler — the modal cannot be opened at all.
52. Cards behind the front one keep **invisible tabbable links** — up to four
    hidden "Visit Site" anchors and twelve tag pills.
53. `ProjectModal` closes on any wheel event `> 50` deltaY — **on a trackpad it
    shuts the instant you try to read it**. No `role="dialog"`, no focus trap.
54. Audit every colour pair for **WCAG AA**; the site leans on `white/30`–`/45`.
55. Visible focus rings everywhere, on the dark ground.
56. Verify the whole page with a screen reader, not just an axe scan.
57. Respect `prefers-reduced-motion` in every animation (several ignore it).
58. Skip-to-content link.
59. `aria-live` on the contact form's status (partly done).
60. Alt text that says something, not just the project title.
61. Test at 200% browser zoom — pinch-zoom was blocked until recently.
62. Hit-target sizes on mobile ≥ 44px.

### F. Discoverability (63–72)

63. Per-case-study OG images, generated.
64. JSON-LD `Person` + `CreativeWork` structured data.
65. Fix remaining sitemap/robots gaps.
66. Real meta descriptions per route.
67. `llms.txt` — how AI agents should describe him. Genuinely forward-looking.
68. Canonical URLs everywhere.
69. Breadcrumbs on case studies.
70. A readable, link-friendly URL per project.
71. Open Graph video for the one project that deserves it.
72. Submit to the search consoles.

### G. Engineering quality (73–84)

73. **There are no tests and no CI.** Nothing runs lint on push.
74. GitHub Actions: typecheck, lint, build on every PR.
75. Playwright smoke test: every route 200s, no console errors.
76. Visual regression on the three key sections.
77. A test for the contact pipeline that does not post to production.
78. Lighthouse CI with a failing threshold.
79. `CLAUDE.md` so future sessions inherit the conventions.
80. Dependabot or Renovate.
81. Error boundaries around every WebGL surface.
82. Real error tracking (Sentry free tier).
83. Privacy-respecting analytics (Plausible/Umami) — know what people look at.
84. Env-var validation at boot, so a missing key fails loudly.

### H. Craft details (85–100)

85. View Transitions API between routes — modern, cheap, few sites have it.
86. Command palette (⌘K) to jump anywhere. Fits the terminal metaphor exactly.
87. Keyboard shortcuts, with a `?` overlay.
88. Real print stylesheet for the resume.
89. A proper 404 in the site's voice.
90. Loading skeletons matched to final layout — no shift.
91. Scroll-linked progress that matches the musical metaphor.
92. Respect `prefers-contrast`.
93. A light theme — the site is dark-only; some recruiters print.
94. Copy-email-to-clipboard with real feedback.
95. Resume download that tracks nothing but works offline.
96. A subtle "last deployed" timestamp.
97. Per-section deep links that actually scroll correctly.
98. Honest empty states everywhere.
99. One signature interaction per page, not five.
100. **Cut something.** The strongest edit available: nine projects shown
     shallowly is weaker than four shown deeply. Ask him which four.

---

## 6. Using 21st.dev

The MCP is connected (`mcp__21st__*`). Account is **paid**, AI generation
enabled, ~100 credits. `search` is free; `get_component` costs a retrieval.

**The rule: a component must retire something, not add to the pile.**
Before installing, name the existing thing it replaces. If it replaces nothing,
don't install it.

Starting points found while writing this brief:

| Need | Component | id | Retires |
| --- | --- | --- | --- |
| Work index | Portfolio Showcase Grid (`uiable`) | 29523 | nothing on its own — mine it for card structure |
| Asymmetric work grid | Condition Grid (`uilayout.contact`) | 25300 | the `/works` mobile list |
| Case-study layout | Bento Grid (`shadcnblockscom`) | 2201 | the invented-metadata modal |
| Proof numbers | Number Ticker Real-Time Metrics (`shadcnspace`) | 21515 | static claims in Measures |

Search more with `mcp__21st__search`. Prefer adapting source over installing
blind — the site is dark-only and uses its own tokens, and shadcn components
assume `bg-background`/`text-foreground` (now defined in `globals.css`, mapped
to this palette).

---

## 7. Definition of done

Every change must clear all of these before it is called finished:

- `npx tsc --noEmit` clean
- `npx eslint .` clean
- `npm run build` succeeds
- Screenshotted at **1440×900 and 390×844**, both compared against before
- Keyboard-only pass on anything interactive
- No new console errors
- Honest reporting: what was verified, what was assumed, what was skipped

**Work on a branch. Do not merge to `main` without being asked** — `main`
auto-deploys to production on push.

---

## 8. State as of this brief

Recently fixed and already on the branch:

- Contact form was silently discarding every message; now delivers (Netlify
  Forms confirmed, Resend optional via `RESEND_API_KEY`).
- Section captions were mis-ordered against their sections.
- `/works` and `/resume` had **no mouse pointer at all**.
- `verify-pin`, `tailor` and `cover-letter` had no rate limit while billing a
  real Anthropic account.
- Sitemap advertised the PIN-gated resume and hid `/works`.

Still open, needs Roman's decision:

- Delete `ProjectModal`, or feed it real data?
- Retire `CodePeek`? Five of its six filenames are fictional.
- Which four projects deserve depth?
