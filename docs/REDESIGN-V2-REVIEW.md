# Portfolio v2 — review before merge

For Roman. Everything here is on `claude/gifted-shannon-ahbed2`; nothing has
been merged or pushed to `main`, so production is unchanged. Read this, look
at the screenshots, decide the questions in §3, then merge (or ask for
changes). The reasoning behind every change is in `docs/REDESIGN-BRIEF.md`,
`docs/AUDIT-2026-10.md` and the commit messages.

## 1. What changed

The experience is the same: the hero and the FFT ocean are byte-identical
(`check:protected` enforces it in CI), the drag deck and the `/works` wheel
keep their physics, and every musical name is still the heading it was. What
changed is everything around them, rebuilt as one system.

**One way to draw work.** Nine client pieces and four products were drawn by
six hand-written layouts that disagreed on the crop, radius, border, colour,
counter, tag pill and link. Now one `<WorkCard>` draws every one of them on
every surface (desktop deck, phone deck, detail view, `/works` wheel and phone
list, products), with one link pill that also says plainly why a piece has no
link ("Launching soon", "Private build"). The phone deck no longer crops every
screenshot to its middle 47%.

**One system.** A score manifest (`src/lib/score.ts`) names each movement
once and gives it a key colour: the nav, the kickers, the captions between
sections and each heading's accent all read it, so the colours mean something
instead of cycling at random. One section shell (every heading on one left
edge; they sat on four), one header, one scroll reveal (five mechanisms
before, three of which fired on the same element on phones), a four-step type
scale, ink tokens for text opacity, a monotonic radius scale, self-hosted
fonts, and an ESLint guard that fails the build on a new `text-[11px]` or
`text-white/40`.

**Chrome on every route.** The nav, footer and pointer used to exist on the
home page only, so `/works` and `/resume` were a different website with no
pointer at all. The nav's front faces now say Credentials · Work · Products ·
About · Contact · All work, with the musical names on the flip side. The
phone menu is a real dialog. A footer on every page carries a build stamp
linked to its commit.

**Proof, not polish.** The stale "Sr. TSE, Salesforce Gov Cloud" is gone; the
role, timeline, record row and counts are derived from `resume-data.ts`, the
App Store rating is fetched live (5.0 from 11 ratings), and nothing on the
site is a number someone typed. Case-study pages (`/works/[slug]`) exist but
stay unpublished until you supply the facts (§3.4): the build refuses to
publish one with a gap. `/colophon` ("Liner notes") replaces CodePeek, whose
"this site's own source" showed five files that do not exist.

**Fixed along the way.** The résumé's phone number and metrics were shipped
in public JavaScript despite the PIN; they are now served only after it. A
Spline failure no longer white-screens the page, and Spline no longer leaks a
WebGL context per visit (the 16th would have killed the ocean). Next.js went
from 16.2.0 (a dozen critical advisories) to 16.4.0. The deck is keyboard
operable, the detail view is a real dialog that no longer closes the instant
you scroll a trackpad, and focus is visible everywhere.

**New pages.** A 404 in the site's voice ("Tacet."), `/colophon`, `llms.txt`,
real icons and a manifest, a corrected sitemap and robots, per-route share
cards, JSON-LD.

**Engineering.** There were no tests and no CI. Now: GitHub Actions
(typecheck, lint, protected-files check, build, bundle budget, end-to-end), a
Playwright suite that runs in three projects (desktop 1440×900, phone
390×844, no-WebGL) with axe, a keyboard-only walk and a report-only CSP, and a
`CLAUDE.md` so future sessions inherit the rules.

### 21st.dev components

Each one retires something named, is re-skinned to the site (no `dark:`, no
`cva`, no foreign palette) and is credited in its source file.

| Component | id | Retired |
|---|---|---|
| Dialog (shadcn) | 1248 | the detail view's hand-rolled overlay and its scroll-to-close |
| Sheet (kevingirelli) | 35214 | the phone menu's hand-rolled overlay and body-overflow lock |
| Scroll Spy hook (ddoemonn) | 23554 | seven IntersectionObservers and two scroll calls fighting Lenis |
| Copy Button hook (ddoemonn) | 23529 | the 9px, 10%-opacity email and a silent clipboard write |
| Button (jshguo) | 11855 | six button class strings and their width-jumping labels |
| Key Value List (corr) | 25162 | the Conductor's 11px fact rows and a hand-typed `certs: 8` |
| Stats Grid (shadcnui-blocks) | 29195 | the lone UW tile and the hand-counted "Eight" |
| Milestone Timeline (structure) | 28384 | two duplicate timeline rails |
| Not Found 404 (structure) | 21523 | Next's built-in white 404 |
| Expandable Text (balick) | 34925 | the always-on `$ cat --more` and its clamp |
| Tabs (shadcn) | 953 | the résumé builder's hand-rolled tab bar |
| Textarea (jshguo) | 11882 | five input/textarea class strings in the builder |
| Loading Button (pattern only) | 23536 | — (its stacked-faces idea, inside Button) |

Rejected, with reasons in the plan: command palette, number tickers, bento
case-study grids, carousels, toasts (the fermata is the success state), page
transitions, device frames and status bars.

## 2. How it was checked

- On the final tree (`319b541`): `npm run typecheck`, `npm run lint` (0
  problems, guard at error), `npm run check:protected`, `npm run build`,
  `npm run budget` (every route inside its budget; `/` ships 1,425,048 B of
  first-load JS, under the plan's 1,448,816 B ceiling) and the full end-to-end
  suite: 388 passed, 0 failed (the 209 skipped are per-project gates, such
  as phone-only tests in the desktop project).
- Screenshots at 1440×900 and 390×844 of every route, before and after.
- A six-lens review of the integrated site (visual, accessibility, honesty and
  voice, motion, performance and engineering, the non-negotiables) found 98
  issues; every blocking and major one was checked by two skeptics, and 31
  survived. 4 of the 5 blocking and 19 of the 26 major ones are fixed; the
  other 8 need your call (Eminence's status, your copy, the frozen hero) and
  are in §3. Most of the 60 minor ones are fixed too.
- **Not verified:** a real screen reader, Safari and Firefox, the ocean's
  frame cost on real phones, and Netlify applying the new headers on a deploy
  preview. Please do a VoiceOver pass on your phone before merging.

## 3. Your decisions

### 3.1 Before this reaches `main`

1. **Eminence Rentals is counted as live, but isn't.** eminencerentals.com
   shows "This site is currently under development and not yet live", and so
   does the repo's own screenshot. Because it has a URL it is counted in "8
   live sites & apps". Either give it a status ("Launching soon") and drop the
   URL, or confirm it is live.
2. **Nelectric's live quote form says "MOCKUP — NO DATA WAS SENT."** Your
   client may be losing leads. The portfolio description ("wired to a real
   lead pipeline") is unchanged, word for word, as you asked — but check the
   site.
3. **How to merge.** Production is weeks behind, and `/works` is a 404 there.
   One PR from this branch, or the résumé-leak and Spline hotfixes first on
   their own (the five W0 commits, `18e9b73..0a65c49`, ship cleanly alone)?

### 3.2 Your words (each is one revertable commit; defaults ship)

4. **Products intro.** It currently reads "Products I design, build and run
   myself — most are private builds…", which undoes your own reframe
   (`ef75bed`, "personal, after-hours projects"). Suggested, in your words:
   "Personal projects I design, build and run on my own time — most are
   private builds, so they're described rather than shown."
5. **Nav and kickers in plain words** (Credentials · Work · Products · About
   · Contact; `// 01. Credentials` etc.), musical names on the flip side and
   as every heading. Revert `8da72aa` and the W4 label commit to go back.
6. **The Work intro** is now "Sites and apps I've designed and built. Open any
   card to see it whole." — it replaced "Drag through the setlist. Click any
   piece to hear its story" (there was no story to hear).
7. **The tab title** is now "Roman Kucheryavyy — Salesforce engineer &
   full-stack builder" (from your hero line).
8. **Product cards** lost "op. 01", the HUD corner brackets and the hover
   lift so they match the other cards. `counterOf` can render "op. 01 / 04"
   if you want the opus mark back.
9. **CodePeek** is retired (five of its six filenames were fictional).
10. **Résumé:** hidden from the nav while it stays PIN-gated; the contact
    form's attach line is now a mailto "[ request: resume.pdf ]".
11. **FUBC Coffee iOS** still says "Apple Pay", as you asked; your App Store
    listing mentions Apple Wallet and a gift card, not Apple Pay.
12. **Alongside Events** is shown as "Private build", but alongsideevents.com
    is public and names you as founder. Link it?
13. **Alongside Coffee** is described and tagged as e-commerce; the live site
    is a booking and inquiry site.
14. **Apex or Java?** The Conductor says both, in different places.
15. **Intext or Int-Ext?** The client's own brand is "Int-Ext Construction".
16. **Statuses** ("On duty 24/7", "Paper trading daily", "Runs the family
    cart") carry no date — still true?
17. **Your current role** appears four times on the home page (record row,
    Conductor intro, code card, Conductor facts). Drop one?
18. **The fermata** over the current timeline entry renders as a speck (no
    site font has the glyph). SVG, or drop it?
19. **The Send button shows ⌘↩ (Ctrl↩ off Apple) even on phones**, where
    there is no keyboard shortcut to press. Hide the glyph on touch screens?

### 3.3 The hero (frozen — each needs your written OK)

20. At 1024–1063px wide the name breaks as "Kucheryavy / y" and the scroll cue
    overlaps View Work. This is already on production.
21. Keyboard users now see the site's 2px focus ring on View Work, GitHub and
    LinkedIn (an accessibility gain, but a visible change).
22. Under reduced motion the starfield and the phone gyro still animate.
23. The GitHub and LinkedIn icon links have no accessible names (two
    `aria-label`s).
24. The Spline iPhone stays (with a poster and an error boundary). Retiring
    it saves its payload.

### 3.4 Content that unlocks pages

25. Case studies for FUBC Coffee iOS (8 open questions), Sembly (5) and
    Alongside Events (8): the questions are in `src/lib/case-studies.ts`.
26. Trailhead verification links for the eight certs.
27. Recapture `alongside-coffee.png` (cookie dialog) and `mark-lutsyuk.png`
    ("BACK APRIL 1") at 1280×800.
28. Turn on GitHub's "Include private contributions" so the live contribution
    staff has enough notes to appear (production shows 16, under its gate).
29. May the Salesforce metrics (1,214 cases, 4.9/5 CSAT) appear publicly?

## 4. Every visible copy change

Generated from the workstream reports; each row names the stream that made
it. Revert any one by reverting its commit.

| Stream | Where | Was | Now |
|---|---|---|---|
| W0 | `src/app/resume/page.tsx` | (none: the editor rendered immediately from bundled data) | Loading your resume… (role=status, shown while /api/resume/data is in flight) |
| W0 | `src/app/resume/page.tsx` | (none) | Couldn't load your resume (<HTTP status>). / Couldn't load your resume. (role=alert, non-401 failure or network error) |
| W0 | `src/app/resume/page.tsx` | (none) | Try again (button that retries the data fetch) |
| W2 | `src/components/sections/Measures.tsx (kicker via src/lib/score.ts, commit 8da72aa)` | // 01. Certifications | // 01. Credentials |
| W2 | `src/components/sections/Projects.tsx (kicker via src/lib/score.ts, commit 8da72aa)` | // 02. Projects & Work | // 02. Work |
| W2 | `src/components/sections/Compositions.tsx (kicker via src/lib/score.ts, commit 8da72aa)` | // 03. Original Works | // 03. Products |
| W2 | `src/lib/score.ts (compositions caption; not rendered until W4 points SectionTransition at the manifest)` | // premiering original works... | // premiering the compositions... |
| W2 | `src/components/ui/CopyButton.tsx (new primitive, not mounted anywhere until W4/W7/W9)` | (none) | Copy email / Copied / Copy failed (now also the button's accessible name, following the face on show) |
| W3 | `src/lib/constants.ts` | title: 'Roman Kucheryavyy — Orchestrating Logic & Art' | title: 'Roman Kucheryavyy — Salesforce engineer & full-stack builder' |
| W3 | `src/lib/constants.ts` | Sembly status: 'Live at sembly.app' | Sembly status: 'Live' |
| W3 | `src/lib/resume-data.ts` | …and digital loyalty cards — 5.0-star App Store rating across 11 reviews. | …and digital loyalty cards — 5.0 stars from 11 App Store ratings (as of Oct 2026). |
| W3 | `docs/REDESIGN-BRIEF.md` | **Roman Kucheryavyy** — Sr. Technical Support Engineer, Salesforce Gov Cloud. | **Roman Kucheryavyy** — Sr. Technical Support Engineer, Salesforce Signature Success (since April 2026; Premier support for Government Cloud before that, per `src/lib/site-facts.ts`). |
| W3 | `docs/REDESIGN-BRIEF.md` | A worship-scheduling product (Sembly) **with live users** | A worship-scheduling product (Sembly) **with live users** *(unsourced: no user count exists anywhere in the repo; needs Roman)* |
| W3 | `docs/REDESIGN-BRIEF.md` | Thermal printing, QR ordering, offline tolerance. | Thermal printing, QR ordering, offline tolerance *(unsourced: nothing in the repo describes Alongside Events working offline; needs Roman)*. |
| W4 | `src/components/ui/Nav.tsx` | Measures · Symphony · Compositions · Conductor · Compose (front faces, repeated on the flip faces) | Credentials · Work · Products · About · Contact on the front faces; Measures · Symphony · Compositions · Conductor · Compose on the hover-flip back faces (commit 6ce2c6f, previously 8908bc8) |
| W4 | `src/components/ui/Nav.tsx` | Resume (nav item, always shown) | (removed while RESUME_PUBLIC is false; renders as 'Résumé' when public) |
| W4 | `src/components/ui/Nav.tsx` | (none) | All work → (nav item linking /works) |
| W4 | `src/components/ui/NavMenu.tsx` | cd /measures, cd /symphony, cd /compositions, cd /conductor, cd /compose | cd /credentials # measures, cd /work # symphony, cd /products # compositions, cd /about # conductor, cd /contact # compose |
| W4 | `src/components/ui/NavMenu.tsx` | su /resume (always shown) | (shown only when RESUME_PUBLIC) |
| W4 | `src/components/ui/NavMenu.tsx` | (none) | ls /works |
| W4 | `src/components/ui/NavMenu.tsx` | kucheryavyyroman@gmail.com (9px, white/10 line) | Copy email (CopyButton; Copied / Copy failed) |
| W4 | `src/components/ui/NavMenu.tsx` | (none; burger aria-label toggled 'Open menu'/'Close menu') | sr-only dialog title 'Site menu'; burger is always 'Open menu'; the in-sheet X is 'Close menu' |
| W4 | `src/components/effects/SectionTransition.tsx` | // premiering original works... | // premiering the compositions... (score.ts caption) |
| W4 | `src/app/layout.tsx` | (none) | Skip to content (skip link, visible on focus) |
| W4 | `src/components/ui/SiteFooter.tsx` | (none) | © 2026 Roman Kucheryavyy · local build (or 'build <sha7>') · <build date> · source ↗ \| All work \| Liner notes \| github \| linkedin \| Copy email. Same words after 14091ba: on a phone the name is on its own line with no dot before 'local build'. |
| W4 | `src/app/page.tsx` | (none) | <noscript> summary: Roman Kucheryavyy, SITE.description, headings Work / Products / Credentials, '<title> · <domain or status>' per piece, '<product> · <tagline>', 'Salesforce <cert> · <date>', links All work / kucheryavyyroman@gmail.com / LinkedIn / GitHub |
| W4 | `src/components/effects/ConsoleSignature.tsx` | The score is open: the </> tab on the right edge shows\nthis site's own source for whatever section you're in. | How this site is built: <origin>/colophon |
| W4 | `src/components/effects/CodePeek.tsx` | </> side tab with snippet titles (KineticText.tsx, DNAHelix.tsx, BootUpAnimation.css, InvestorCouncil.ts, SectionReveal.tsx, useSoundEffect.ts) and 'Current section: …' | (retired, file deleted, commit 050a3c1) |
| W4 | `src/app/HomeClient.tsx` | > initializing... (10px, white/20) | > initializing... (same text; text-label, ink-faint, aria-hidden) |
| W5 | `src/components/sections/Measures.tsx` | 8 live sites & apps · 1 on the App Store | 8 live sites & apps, 1 on the App Store (both counts derived; changed this round so no separator is left at the end of a wrapped line) |
| W5 | `src/components/sections/Measures.tsx` | intro: "Eight certifications, one CS degree, …" (typed by hand) | Same sentence, with the number word derived from CERTIFICATIONS.length (currently "Eight") |
| W5 | `src/components/sections/Measures.tsx` | UW tile: "UW" / "University of Washington" / "BS, Computer Science & Systems" | Record row (FactList grid): Now "Senior Technical Support Engineer, Signature Success" (note "Salesforce · since Apr 2026"); Before "Premier TSE, Government Cloud" ("2023–2026"); Certified "8 Salesforce certifications" ("Dec 2023 – Jul 2025"); Degree "BS Computer Science & Systems" ("UW Tacoma · 2018–2020"); Shipped "8 live sites & apps, 1 on the App Store" (note "5.0 · 11 ratings · checked <date>" only when Apple answers). All derived from site-facts, CERTIFICATIONS and the work list. |
| W5 | `src/components/sections/Measures.tsx` | Cert front: h3 "{short}" plus h3 "{name}"; back: "Salesforce Certified" | Front: label "{short} · {category}", one h3 "{name}", date, and on phones "tap ↻". Back: "Salesforce Certified", date, and "Verify" only when verifyUrl exists. Toggle aria-label: "Flip the {name} card". |
| W5 | `src/components/sections/Conductor.tsx` | (no intro) | "Senior Technical Support Engineer at Salesforce, on Signature Success; before that, Premier support for Government Cloud. I build in React, Next.js, Swift and Apex, and I conduct the FUBC Band." (plan copy, built from site-facts) |
| W5 | `src/components/sections/Conductor.tsx` | role: "Sr. TSE, Salesforce Gov Cloud", certs: 8 | role: "Sr. TSE, Salesforce Signature Success" (shortRole), certs: CERTIFICATIONS.length |
| W5 | `src/components/sections/Conductor.tsx` | "Salesforce Gov Cloud — Premier Support" | Now: "Senior Technical Support Engineer, Signature Success" with the note "Salesforce · since Apr 2026" (derived) |
| W5 | `src/components/sections/Conductor.tsx` | "Husband and father — the most important role" | Home: "Husband and father" (plan copy) |
| W5 | `src/components/sections/Conductor.tsx` | Timeline: 2016 CS @ Highline · 2018 UW Tacoma · 2021 Microsoft · 2023 Salesforce · Now 8 Certs | One <ol> from site-facts TIMELINE (labels are the site-facts short names, five entries; the current one has sr-only ", current"). The "Now · 8 Certs" entry is removed. |
| W6 | `src/components/sections/Projects.tsx` | intro: mobile 'Swipe through the setlist.' / desktop 'Drag through the setlist. Click any piece to hear its story.' | mobile "Sites and apps I've designed, built and shipped." / desktop "Sites and apps I've designed, built and shipped. Open any card to see it whole." |
| W6 | `src/components/sections/Projects.tsx` | open the whole setlist | see all 9 in the setlist → (`see all ${TOTAL} in the setlist`, lucide ArrowRight) |
| W6 | `src/components/sections/Projects.tsx` | Drag up/down or use arrows to navigate | Drag ↑ ↓ through the setlist, or use the arrow keys (arrows aria-hidden) |
| W6 | `src/components/sections/Projects.tsx` | Swipe ← → through the setlist | Swipe ← → through the setlist (same words, arrows now aria-hidden) |
| W6 | `src/components/sections/Projects.tsx` | aria-label="Client work" (both decks) | aria-label="Work" |
| W6 | `src/components/sections/Projects.tsx` | (no phone deck buttons) | aria-label "Previous piece" / "Next piece" |
| W6 | `src/components/sections/Compositions.tsx` | Personal projects, composed entirely on my own time. AI-heavy pieces I design, build, and run after hours — each one solving a problem I actually have. | Products I design, build and run myself — most are private builds, so they're described rather than shown. (The plan's text plus "most are", added this round: Sembly is live.) |
| W6 | `src/app/works/page.tsx` | title `The Setlist — ${SITE.name}`, description 'Every shipped piece, on a wheel you turn.' | pageMetadata title 'The setlist', description '9 sites and apps · 8 live, 1 launching soon. Designed and built by Roman Kucheryavyy.' (computed from data) |
| W6 | `src/app/works/page.tsx` | ← Back to portfolio | (removed; the W4 site nav replaces it) |
| W6 | `src/app/works/page.tsx` | 9 pieces | 9 pieces · 8 live, 1 launching soon (computed) |
| W6 | `src/app/works/page.tsx` | (none) | Products I build & run → (link to /#compositions) |
| W6 | `src/app/works/page.tsx` | scroll, drag or use ↑ ↓ to turn | scroll, drag or use ↑ ↓ to turn (same words, arrows aria-hidden) |
| W6 | `src/components/ui/WorkCard.tsx` | (none) | Program notes → (renders only for a published study, so nowhere yet) |
| W7 | `src/components/sections/Compose.tsx` | [ attach: resume.pdf ] (link to /resume, the PIN-gated builder) | [ request: resume.pdf ] (mailto:<LINKS.email>?subject=Résumé request, from RESUME_REQUEST). Under Option A it is '[ attach: resume.pdf ]', linking /resume.pdf with download |
| W7 | `src/components/sections/Compose.tsx` | ⌘↩ Send (always ⌘) | ⌘↩ Send on Apple platforms, Ctrl↩ Send elsewhere (the glyph is aria-hidden). Accessible name: 'Send message' |
| W7 | `src/components/sections/Compose.tsx` | Title bar while sending: 'New Message' | 'sending…' |
| W7 | `src/components/sections/Compose.tsx` | (no control) — signature strip had only the bare 'email' mailto | 'Copy email' pill after it, reading 'Copied' or 'Copy failed' for 2s (CopyButton defaults) |
| W7 | `src/components/sections/Compose.tsx` | © {year} Roman Kucheryavyy | (removed; SiteFooter from W4 carries the ©) |
| W7 | `src/components/sections/Compose.tsx` | Built with Next.js, Three.js, GSAP & Tailwind | (removed) |
| W8 | `src/app/colophon/page.tsx` | How this site is built. Every value below is read from the repository when the site is built, so none of it can drift from the code. | How this site is built. The versions, the score, the build stamp and the budgets below are read from the repository when the site is built, so none of them can drift from the code. |
| W8 | `src/app/colophon/page.tsx` | Every movement of the home page is named once, in src/lib/score.ts. The nav, the kickers, the captions between sections and each heading's accent all read this table. | Every movement of the home page is named once, in src/lib/score.ts. Each section's kicker and the accent on its heading read this table. |
| W8 | `src/app/not-found.tsx` | (inherited) meta description, og:description and twitter:description: 'Salesforce engineer, full-stack developer, and band conductor building at the intersection of precision and creativity.' | 'Nothing is written for this address. The page moved, or the link has a typo.' (the page's existing visible sentence, reused) |
| W8 | `src/app/not-found.tsx` | (inherited) og:title and twitter:title: 'Roman Kucheryavyy — Salesforce engineer & full-stack builder'; og:url: https://romankucheryavyy.com | og:title and twitter:title: 'Not found — Roman Kucheryavyy'; no og:url |
| W8 | `public/humans.txt` | Score: terrain waves in raw GLSL, spotlights in pure CSS, a starfield on a 2D canvas, and a scroll bar that reads like sheet music. | Score: a Tessendorf FFT ocean on the GPU (WebGL2, a Phillips spectrum through an inverse FFT every frame), spotlights in pure CSS, a starfield on a 2D canvas, and a scroll bar that reads like sheet music. |
| W8 | `src/app/not-found.tsx` | (Next's built-in 404) | Kicker '// 404. Not found', h1 'Tacet.', 'Nothing is written for this address. The page moved, or the link has a typo.', links '← Back to the top', 'The setlist', 'Let’s compose' (plan text) |
| W8 | `src/app/colophon/page.tsx` | (new page) | 'Liner notes' and the section copy shown in the colophon screenshots, plus four engineering notes held back by NOTES_PUBLISHED = false |
| W9 | `src/app/resume/layout.tsx` | <title> inherited from the home page (and its canonical, index/follow) | <title>Résumé builder — Roman Kucheryavyy</title>, robots noindex, nofollow, canonical /resume |
| W9 | `src/app/resume/Builder.tsx` | Back arrow link with no accessible name | aria-label="Back to portfolio" |
| W9 | `src/app/resume/Builder.tsx` | Copy to clipboard (static label; no feedback) | Copy to clipboard / Copied / Copy failed (same-width faces; a role=status line announces Copied or Copy failed) |
| W9 | `src/app/resume/Builder.tsx` | Résumé sheets: no accessible name, not focusable | Résumé sheet, and the Tailor / Cover Letter sheets once they have content: role=region, aria-label "Preview", tabIndex 0. Empty sheets have neither (changed in this fix round). |
| W9 | `src/app/resume/Builder.tsx` | Field captions "Summary", "Skills", "Paste Job Description", "Company Name (optional)" as a title= on a div | Same text rendered as real <label htmlFor> captions |
| W9 | `src/app/resume/Builder.tsx` | Bullet textareas with no name | Visually hidden label "{company} — {title}: bullet {n}" |
| W9 | `src/app/resume/page.tsx` | PIN input with no label | Visually hidden <label> "PIN"; "Incorrect PIN" is tied to the input with aria-describedby / aria-invalid |
| W12 | `src/app/works/page.tsx (head)` | og:image / twitter:image: /opengraph-image (the site card) | og:image /works/opengraph-image, twitter:image /works/twitter-image (the setlist card W8 built) |
| W12 | `src/components/effects/SectionTransition.tsx, Manifesto.tsx, Compose.tsx, Conductor.tsx, NavMenu.tsx (ink only, no string changed)` | captions, '> hover any word to decode', the dynamics mark, roman.ts line numbers and the phone menu's terminal words in ink-faint (35% white); the menu's green lines at green/60 and /50 | the same text in ink-meta (50% white); the green lines at green/70 |
| W12 | `src/components/sections/Projects.tsx` | Sites and apps I've designed, built and shipped. | Sites and apps I've designed and built. |
| W12 | `src/components/sections/Projects.tsx` | Sites and apps I've designed, built and shipped. Open any card to see it whole. | Sites and apps I've designed and built. Open any card to see it whole. |
| W12 | `src/components/sections/Measures.tsx` | 8 live sites & apps, 1 on the App Store | 8 live sites & apps, including 1 on the App Store |
| W12 | `src/components/sections/Measures.tsx` | (cert card back: 'Salesforce Certified' / <date> only) | <short> · <name> (e.g. 'PD1 · Platform Developer I'), then 'Salesforce Certified' / <date> (the new line is aria-hidden) |
| W12 | `src/components/sections/Conductor.tsx` | Husband and father | Husband and father — the most important role |
| W12 | `src/app/colophon/page.tsx` | Each section's kicker and the accent on its heading read this table. | The nav, the kickers, the captions between sections and each heading's accent all read this table. |
| W12 | `src/app/colophon/page.tsx` | /_not-found (budget term) | 404 page (note: '/_not-found · measured …') |
| W12 | `src/app/colophon/page.tsx` | hero / interlude in the Label column, styled as labels | hero / interlude set as ids (mono, ink-meta); below lg the score is rows labelled SCORE / KEY / CAPTION |
| W12 | `src/components/ui/SiteFooter.tsx` | 2026-10-11 (build day in the stamp) | Oct 11, 2026 |
| W12 | `src/components/ui/SiteFooter.tsx` | github · linkedin · Copy email (in the footer on every route) | not shown on / (the signature strip above carries them); unchanged on every other route |
| W12 | `src/app/works/page.tsx` | scroll, drag or use ↑ ↓ to turn (screen reader heard: 'scroll, drag or use to turn'); bottom-centre | same visible text, bottom-right; screen reader hears 'scroll, drag or use the arrow keys to turn' |
| W12 | `src/components/effects/ConsoleSignature.tsx` | $ git clone https://github.com/RomanKucheryavyy | $ git clone https://github.com/RomanKucheryavyy/roman-portfolio |
| W12 | `src/lib/seo.ts / src/app/opengraph-image.tsx` | og:image with no width/height/type/alt on /colophon and /resume | og:image + og:image:width 1200 / height 630 / type image/png / alt 'Roman Kucheryavyy — Orchestrating Logic & Art', and twitter:image /twitter-image (alt unchanged, now one constant) |
