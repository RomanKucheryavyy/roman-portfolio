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

The same day: "also we should add somewhere that im not all star ranger on
trailhead, the highest ranger status", and "And make it epic". Read as "I'm
now": he is an All Star Ranger on Trailhead, the highest Ranger status. So
Act IV opens on that rank as its crowning honour (below), from one record.

On 2026-11-01, after seeing the hero's painting and the All Star Ranger
laurel: "this looks well on desktop but not mobile", "alos idk if i like the
purplish color etc... and the ai lines and squares etc...", "and mobile
doesnt have any like motion or stacking animations etc...", "keep refining".
So the palette became an Old Masters dark, **Chiaroscuro** (no purple, violet
or lavender anywhere public); the lines, frames and boxes went (type is the
ornament, light and space separate things, the interpunct is the one
divider); and phones get the same craft as desktop, with motion of their
own: every act header cuts itself in on entry, Act I's folios stack as they
do on desktop, and each section moves in its own way.

The same day, sent the hero (the kokonut curtain with Hercules painted on
it) in five palettes: "i don’t like how your mixing our previous hero with
this one, i like the roman theme better and not this like stage light look
thingy", and "i actually hate it". So the curtain is deleted and the hero
is a page of the intro's print (below). Never bring the curtain or its
light back.

That round (#13) had also read "stage light" as the Old Masters
component's own light, and switched it off on the intro, the title cards
and the hero's painting. With it live, Roman: "but the animation from2 1st
dev for this roman theme is now gone". So the component's animation is
part of the Roman theme and plays on every Old Masters stage, as
published: the word filling in, the flood opening as its circle, the
flash and the sheen, the figures rising, breathing and leaning with the
pointer, the shafts of light and the dust in them, the spotlight on the
pointer, the moving grain, the stars twinkling. What he hated was the
curtain, never the component's light.

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
  keeps its own Roman idea. The statues stand only in the intro, the
  hero's print and the four title cards; the meander ring draws only in the
  intro.
- **No curtain; the component's light is its own** (Roman, 2026-11-01,
  above): the old hero's curtain (kokonut's lit drapery) is gone and never
  comes back, nor any lit drapery, nor a light of the page's own laid over
  the print (shafts, beams or a spotlight the page draws itself, a pool of
  light from above). The Old Masters component's own light is its
  animation and stays on wherever it plays (the intro, the title cards,
  the hero's painting): its shafts and the dust in them (`rays`, `dust`,
  its light canvas), its spotlight on the pointer, the flash and the sheen
  at the unveil, and its flood opening as its circle. Never switch them
  off or hide them from outside where a stage plays them (the hero's
  painting opens on its landing, so it has no unveil, and its flood,
  vignette and grain are the hero's own, there before it lands); where
  they pass under words, keep the words AA (a dark halo, the word in front
  of the sheen), never by taking the light away. The page's own wash is a print's flood welling up from
  the floor (the hero's ground, the 404's), a soft glow behind a thing, or
  a tone (Act I's leaves' heads, the footer's glass). Act IV's glory, fine
  gold rays round the laurel, still, is an emblem struck in gold, not a
  light.

## The look: the Imperial Stage

- **Palette**, Chiaroscuro (`imperial.ts` `PALETTE`, the one source, its
  keys named for what each colour does; `look.ts` `STAGE_STYLE` sets it as
  CSS variables on the Stage's wrapper, and `globals.css`'s `:root` repeats
  the four that load first): ground `#0b0806` (the page), wash `#352114`
  (light and glow: the flood of the intro's print, the hero's and the title
  cards', glows behind things; never a large flat panel), gold `#d6b25e` (the
  one accent: numerals, links' underline, the focus ring; never a large
  fill), glow `#ffdf9e` (rare), marble `#f2ece2` (headings, primary text),
  text `#f3eee6`, muted `#bfb19b` (secondary text), rule `#5e4630` (edges:
  a field's is the rule mixed half with the muted ink, 4.8:1 on the
  ground), highlight `#f0e2c8` (the print's lit marble), shadow
  `#040302` (the deepest cast shadow). The variables: `--background`,
  `--foreground`, `--muted-foreground`, `--stage-wash`, `--stage-gold`,
  `--stage-glow`, `--stage-rule`, `--stage-text`, `--stage-shadow`. In
  classes they are Tailwind colours (`globals.css`): `text-gold`,
  `border-gold/40`, `bg-wash/45`, `hover:text-glow`, `border-rule/60`, with
  shadcn's `foreground` (marble), `muted-foreground` (muted) and
  `background` (ground). A new palette is a change to `imperial.ts` and
  `globals.css`'s `:root` alone. Every text colour clears AA on what is
  behind it: check it on the real pixels, axe has no baseline. No purple,
  violet or lavender anywhere public (the page, the 404 and error pages, the
  share images, the manifest's colours, the contact emails); the products'
  own screenshots keep their own colours.
- **Type** (`roman-type.ts`, the one place the faces are declared; on
  `<html>` from `layout.tsx`): Cinzel, `font-roman`, preloaded, for the
  hero's name, every h2, the top bar's brand, product and project titles and
  numerals (its lowercase draws as small capitals: that is the look);
  Cormorant Garamond italic, `font-serif`, preloaded, for his voice:
  taglines, section intros, quotes, his words (18px and up on phones); Geist
  for everything read or used: nav, buttons, labels, descriptions, fields,
  dates (years stay Arabic, Act III's set large in gold). Nothing on the
  page is under 12px: the top bar's nav, the title cards' eyebrows, the
  captions, Pause, the kickers and the tags included, and the intro's
  eyebrow, counts, asides, ENTER, Skip, plate and scroll hint (set from
  outside: the component's own are 9.5 to 11.5px). The one exception to
  the faces is Act IV's frieze from md, where each certification and its
  date are one inscription, in Cinzel (on a phone the date stands apart, in
  Geist). The faces are font bytes, not JS: Cinzel 25.9
  kB, Cormorant italic 39.3 kB; `display: swap`, so no heading is blank
  while its face loads (the intro and title cards wait for theirs).
- **No lines and boxes.** Type is the ornament (Cinzel inscriptions, Roman
  numerals set large and alone, Cormorant for his voice); real imagery
  carries the colour; light, shadow and space separate things; the
  interpunct "·" is the one divider (between a project's tags, a product's
  stack, the top bar's three links on a phone, the footer's links): each
  word led by its point, and the point that would lead a line clipped away
  (`interpunct.ts`, and the footer's own), so none dangles at a line's end.
  The only edges are ones that do a job: form fields, the gold focus ring,
  the device frames (safari, iphone), and the one filled button a screen
  holds; the only line is the gold mark under the top bar's current
  section. Gone from the page, and not to come back: the section headers'
  hairlines and ✦ crest, ✦ stars, double frames, inner rules, rivets, the
  tabula ansata, dashed boxes, dotted grids, icon tiles, ringed discs,
  bands, the beam diagrams, Act III's rail and ticks, a folio's lit top
  edge, the top bar's scroll hairline, the footer's gilt edge and
  decorative pills. The Old Masters stages keep the component's own
  ornament, which is part of its animation: in the intro its stars
  twinkling, the rule drawing in beside its eyebrow, the scroll hint's
  falling line, its two counts in their outlined pills and ENTER outlined;
  on the title cards its stars (their pills and rules stay hidden).
- **Shapes** (`look.ts`): `stageButton('primary', 'md' | 'sm')`, the intro's
  ENTER filled (rectangular, a 2px radius, Geist capitals, marble fill; the
  intro's own ENTER stays outlined, as the component draws it), for a
  screen's one primary action ("See the work", "Send": kokonut-undo-button's
  `radius`, a `[site edit]`); every other action is `stageLink()` or
  `stageLink('away')` (Geist 13px in marble under a gold line that thickens
  and brightens on hover, a gold ↗ for a link that leaves the site, drawn
  by CSS and skipped by screen readers, 44px tall): the hero's "Get in
  touch", every row's domain, the App Store, About's links, the panels'
  second actions. `stageButton` has no other kind; until the message box
  can send, Send stands unlit (no fill, the fields' edge, the muted ink),
  never a grey slab. `SectionHeader`
  (`section-header.tsx`) is every act's
  header: the numeral alone as the chapter mark (gold Cinzel, 64px on
  phones, 112px from lg), then the kicker in Geist capitals, the h2 in
  Cinzel, the intro in Cormorant; it cuts itself in once as it rises into
  view (`reveal.ts`, loaded after the page; never for a header on screen as
  the page starts, under reduced motion or without scripts, nor the hero's
  h1). `STAGE_FOCUS` is the one focus ring: gold, 2px, offset 4.
- **Each section's own idea:** the hero, a page of the intro's print:
  Hercules standing in it, the David blurred behind, his words above him
  and his name across its foot (below); Act I, folios: each project a leaf
  of the book, its screenshot full-bleed at the head (beside the words from
  lg), the number as type ("II / IX" in Cinzel), the description whole, the
  tags between interpuncts and its link a text link, the leaf's body the
  ground itself with a tone of the wash at its head (no panel, no lit
  edge), the leaves stacking on a phone as on desktop; Act II, the title
  cards, then rows that show the product itself (nothing the card above
  already says): the public ones' live sites in a browser and a phone, the
  private ones as inscriptions of their parts (gold numerals, Cinzel,
  Cormorant); Act III, a road of gold milestones on wide screens (the
  years in a row, in gold, with space between them and no line or ticks),
  and on a phone a list that opens each entry on its year set large; Act IV, his
  Trailhead rank first, the rank's name inside a laurel crown struck in gold
  (designali-in/award) on a still glory of gold rays, then the
  certifications: from md a frieze of laurel seals in one slow row (all
  eight in one row on wide screens so none shows twice), on a phone a still
  inscription of all eight, each with its laurel; About, the portrait in an
  unframed arch above his name and the skills as marble tiles that drop;
  Contact, the channels as plain lines (each address alone, no label: it
  names its channel), the world in gold on a globe of the wash (a horizon
  on a phone) and the message box on the ground, no panel; the footer, a
  colophon with a soft tone of the wash in it, on the fluted glass,
  softened, from lg (below lg no glass: in a phone's column its flutes
  stood as upright folds lit from below, a curtain): his monogram, his
  manifesto, the links, and a line in Cinzel (no giant wordmark: his name
  stands full-width in the intro and the hero already).
- **Motion, on a phone as on desktop**, each section its own; every
  entrance plays once, only for what arrives from below the screen, and
  nothing moves under reduced motion or without scripts: the intro plays
  the component's animation whole (the load, the unveil, the living
  landing); the hero's words set in as the page opens (the
  name never moves), Hercules rises once the intro has gone, and then the
  painting lives as the intro's landing does while the hero is on screen
  (the shafts and the dust drifting, the spotlight on the pointer, his
  breathing and lean, the grain moving); every act
  header cuts itself in; Act I's folios stack (below); a title card mounts
  early, the component drawing its word in outline letter by letter, and
  once the word is on screen and drawn it opens as the component does: the
  word fills,
  surging and stalling, the flood opens as its
  circle under the flash and the sheen, the statue rises and the backdrop
  surfaces, and it lives on its landing (its light only while on screen);
  an inscription rises line by line (Praxis's XVIII struck in) and the Alongside
  Brain's chain pulses down its steps while on screen (with a Pause); Act
  III's years rise out of their baselines, their words after; Act IV's rank
  grows and is written in, then its sheen comes round, and on a phone the
  list's lines rise and each laurel is struck in; About's arch opens from
  the top and the tiles drop; Contact's globe rises once and turns. Desktop
  keeps its own composition and motion (the wide stack, the frieze's row,
  the previews' loop, the road). What the intro's nav lands on (the page
  scrolls there while the stage lifts, `data-intro` still on `<html>`) is
  let go whole, as what is on screen as the page starts; and a page
  printed or saved as a PDF is whole: `reveal.ts` finishes every entrance
  still waiting (`beforeprint`).
- **Act I's stack** (`work.tsx`, StackingCards configured from outside, the
  variants in `globals.css`): `stack-phone` and `stack` for a phone held
  upright and tall enough (375 to 767 wide from 34rem tall, narrower from
  38.5rem); everything else below lg lies flat: a short or landscape phone,
  a phone under reduced motion, a tablet in two columns (`flat`, 768 to
  1023). The wide stack from lg is as it was (464px folios pinned at
  104 + 12i, the plate beside the words; still pinned but not scaled under
  reduced motion). On a phone each folio is min(33rem, 100svh − 90px) tall
  and pins under the top bar at 64 + min(i, 3) × 6px, so three edges show
  (four leaves at most), read by tone (each leaf casts its shadow up onto
  the one it covers, and the plate's head sinks into the leaf's tone over
  the step a covered leaf shows, so no site's white header peeks out as a
  pale strip; the same at the wide stack's 12px steps);
  flat, each folio below the screen rises into view once. A link's focus
  brings its folio to the front.

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
`networkidle` (the marquee and the globe never stop). The axe
baseline `tests/a11y-baseline.json` is empty and stays empty: fix the page.
The smoke suite fails on any Content-Security-Policy report (the header is
report-only; `next.config.ts` says what each source is for).

| Spec | Covers |
|---|---|
| `smoke` | Every route and head file, the redirects, a clean console, no request off-origin, the CSP, the server HTML (the JSON-LD Person and its award, the `<noscript>` summary, the rank in llms.txt), the page without WebGL, the hero (the Roman print: no curtain, its only canvas the painting's 2D light canvas, none without WebGL; the name, his words and both ways in from the records; the first screen holding the name, his words, both ways in and his head at 390x844, 375x667 and 1440x900; the name AA where it meets the statue with the light at its brightest: the print behind its letters, without their halo, 3:1 or more), the hero's painting (aria-hidden, inert, nothing to focus, Hercules and the David, the name the largest paint; once landed the intro's living landing: its light and spotlight up, he breathes, the grain flickers, the light draws and moves, only while the hero is on screen; on the desktop the spotlight and the figure follow the pointer and come back to rest when it leaves the hero; still under reduced motion, its light drawn once; never without WebGL or for a browser that saves data; its chunk failing leaves the page as it is), the act headers (the numeral alone and large in Cinzel, no rule; the entrance held below the screen and let go whole, never below full when the page lands on one, nothing held under reduced motion; printed as a PDF, nothing held) |
| `work` | Act I: the phone stack at nine phone sizes from 340x640 to 430x932 (each folio min(528, height − 90) tall and whole, its link clear of the foot, its plate between 112px and 16:10, pinned at 64 + min(i, 3) × 6, the last on screen once stacked), flat at 320x568, in landscape, on a tablet and under reduced motion (each folio below the screen rising once, none on screen ever hidden, none rising in a stack), a link's focus bringing its folio to the front, the wide stack's offsets and no scale under reduced motion, no frames (no border, rule, rivet, tablet or dashed box), the number as type, the link a text link, the status in italic, 12px and up, nothing shifting |
| `a11y` | axe, any impact, on `/`, on `/` again after a reader's scroll once every entrance has played (nothing left below full), `/resume`, the 404 and the message box's sent and failure panels |
| `keyboard-walk` | Every Tab stop visible, named, ringed, on screen, not under the top bar: the top bar's sections, "See the work" then "Get in touch", every folio's link, every product's preview, link and Pause (the Alongside Brain's pulse's too), About's links, Contact's channels, the frieze's Pause on desktop (none on a phone) and the message box's panels |
| `intro` | The Roman intro: shows on a first visit, not again within 12 hours, again after them, with `?intro`, never with a hash, under reduced motion or without scripts; the page comes back at once if the stage's code fails, and at the 8 s fail-safe if it never arrives (and it never shows late); the count in Roman numerals; Skip (focus stays inside); the landing's words from the records; Enter (from the unveil on), Escape (straight to the exit), ArrowDown, PageDown, End, a wheel or swipe during the load and a nav link each lift it onto the page (focus on main, or the section; the page scrolls; the hero's words set in after the lift; the section a nav link lands on never drawn below full once the stage has gone); the component's animation, played: the load (the word filling as the count climbs, the rule drawing in, the stars out and twinkling, the counts in their outlined pills, ENTER outlined, the hint's line falling, nothing under 12px), the unveil (the flash and the sheen running, the flood opening as its circle, eased open, never closing, to the whole stage; the figures rising) and the living landing (the light canvas shown, drawn and moving, the spotlight up and following the pointer, the figures breathing, the grain moving); its words AA over the light at its brightest (every shaft at its peak, the spotlight under each label) and through the unveil (the sheen and the flash held at each 50 ms; the word 3:1 or more as the sheen crosses it); on a phone held sideways ENTER takes the tap; Tab stays inside and every stop shows, ringed; axe during the load and at the landing; a clean console, no CSP report, nothing off-origin; nothing off screen and no overlapping pills from 320 to 1920 |
| `products` | Act II: each product's title card (its own words, aria-hidden, nothing to focus, images from this origin, mounting in view and unmounting after, nothing below moving, none of the intro's ring, count, barcode or plate, no pills or rules, the component's light canvas, spotlight, flash, sheen and stars present, the flood opened as its circle, the veil at its top and foot, the eyebrow 12px and up, the four words on one scale within 1.4x; the longest title scrolled in at 700 px a second: mounted before it comes on screen, its word begun, its load held at nothing until it has arrived and every letter is in, then the load (the word seen filling for a second or more, never going back), the unveil (the circle seen widening, the flash and the sheen running) and the landing: on a phone within 3 s to the unveil and 6.5 s to the landing, on a wide screen, which the test browser paints at a few frames a second, only required to land; mounted again before it comes back on screen from above; a landed card's light running while on screen and holding still once it is off screen; its words AA through the light (the unveil stepped every 50 ms: the word 3:1 or more, halo kept, the eyebrow and the number 4.5:1; at the landing, every shaft at its peak and the spotlight on each, the eyebrow, the number and the tagline 4.5:1); under reduced motion the still landing at once, nothing looping, its light drawn once), the row not repeating it (its name, tagline, number and status for screen readers only), Roman's order, each public product's real screenshots loading (`naturalWidth`) with alt text naming the site, its browser and phone together at every width (the phone over the browser's lower corner on a phone), the preview playing only while most of it is in view (also when it arrives in view as it mounts), back to the top after leaving, its two shots on one loop, holding still on hover, focus and Pause, the private products' inscriptions (their descriptions' words only, a desk without its own line, a chain with the product's, the stated links listed for screen readers in reading order, no images, lines or edges; rising line by line as they arrive, the count struck in, whole when they arrive on screen; the chain's pulse running only on screen, passing down it and stopping on Pause), nothing below moving when the previews land, no sideways scroll and every inscription inside its block from 320 to 1920 wide, and nothing moving under reduced motion |
| `credentials` | Act IV's rank: its words from the record in reading order, none a heading (the act's one heading is its h2), no level pill and no rule, before and above the seals; the drawings silent, nothing to focus, no link, the laurel in its gold; the entrance held until it is in view, then letting go, the sheen running only on screen, the rays still; no entrance when the page lands on it (`/#credentials`: no word ever drawn below full); still and whole under reduced motion and without scripts; no sideways scroll, its words on screen, clear of the header and above the seals from 320 to 1920. The frieze: on a phone a still inscription of all eight in order (no marquee, no Pause, held until in view), from md one slow row with no rules, band or discs, the laurel alone in gold and an unboxed 44px Pause that says "Pause", two to a row and still under reduced motion; its placeholder the height it lands at from 320 to 1920 |
| `contact-ui` | The suggestion, the undo window, the POST (intercepted), the sent panel (with and without a receipt), Send another, the failure panel, Try again, Edit message, Copy email, the 429 panel, the quote (Cormorant between drawn marks, no frame), each panel's one filled button and text links, 16px text on phones (landscape too); the card: no panel round the box, field edges 3:1 and more, Send the one filled button, the channels as addresses alone (no label, no icon tile), 44px, one heading on a phone ("Get in touch" for screen readers only) |
| `contact-api` | The `/api/contact` contract with no Resend key: 400s, the honeypot, 502 when nothing delivered, 200 `delivered: ['forms']` with `receipt: false`, 429 |
| `contact-email` | The email to Roman and the visitor's receipt (content, escaping, plain text, layout at 600 and 375 with long names and addresses), the first-name rule, `oneLine`, when receipts are on, and the route in Node with `fetch` faked: what it hands Resend, the receipt's headers, its per-address limit, no receipt without the email |
| `touch` | Phone swipes that start on the badges, a folio (a pinned one too), a product's preview, inscription or title card (landed, and as it opens), the timeline, the certifications or the globe scroll the page |
| `resume` | The PIN gate, the builder (mocked data) and its routes |
| `data` | `toRoman`; the intro's and cards' words read from the records; the Trailhead rank (his words, nothing he didn't give, typed once, read by Act IV, the summary and llms.txt, the JSON-LD award); the cast's files (present, their declared sizes, small, credited in humans.txt); the records (the products' order, previews and flows included: a flow's words are its description's, a count's word and figure agree, its links only the stated ones, and they decide its inscription), the preview files' sizes, the owner-fixed copy, nothing private in the build |

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
| 404, `error.tsx`, `global-error.tsx` | The Stage's ground, the wash's flood from the floor (never a light from above), gold and Cinzel (`look.ts`), each with a way home: one button, then text links |
| `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/llms.txt`, `/icon.svg`, `/apple-icon`, `/opengraph-image`, `/twitter-image`, `/humans.txt` | Generated from the same records |
| `/credentials`, `/work`, `/products`, `/about`, `/contact`, `/works`, `/works/:slug`, `/colophon` | 307s to the Stage's sections, or `/` |

## Where things live

| What | Where |
|---|---|
| The work, products (with each public one's `preview` and each private one's `flow`), certifications, his Trailhead rank (`TRAILHEAD_RANK`), skills, his own words (`HIS_WORDS`: tagline, manifesto, about, music line) | `src/lib/constants.ts` |
| Roles, schools, dates | `src/lib/site-facts.ts` |
| Email, LinkedIn, GitHub | `src/lib/links.ts` |
| The Stage's shape of all of it (`PERSON`, `PROJECTS`, `PRODUCTS`, `ROLES`, `RANK`, ...), built from the three above, typed nowhere else | `src/lib/content.ts` |
| The résumé's private data (server only) | `src/lib/resume-data.ts` |
| Head and JSON-LD | `src/lib/seo.ts` (`pageMetadata`), `src/lib/structured-data.ts` |
| API settings (server only) | `src/lib/env.ts`; routes never read `process.env` directly |
| The page: sections, top bar, message box | `src/components/stage/` (`look.ts`: the palette's CSS variables, the button, the text link, the focus ring, the 404's flood and the header type, which the 404 and error pages share; `section-header.tsx`: every act's header, and `reveal.ts` its entrance; `stage.tsx`: the hero (its print's ground, the name, his words) and the sections' shells, with the lazy blocks' placeholders; `top-bar.tsx`; `work.tsx`: Act I's folios and their stack; `interpunct.ts`: the words-between-points line (Act I's tags, a product's stack); `experience.tsx`: Act III; the glue that loads after the page with what it configures: `about.tsx`, `contact.tsx` around `contact-card.tsx` (the contact card with the message box, `composer.tsx`), `footer.tsx`, `experience-road.tsx` (Act III's Lifeline: the road, and a phone's list of years), `frieze.tsx` (Act IV's seals: the row, and a phone's inscription)) |
| Act II, his products: the rows, then the previews that load after the page (a public product's browser and phone, a private one's inscription), and the sizes both share | `src/components/stage/products.tsx`, `product-previews.tsx`, `preview-box.ts` |
| The products' screenshots (WebP, desktop at 1280 wide, phone at 390 wide saved at 1.5x) and the script that takes them | `public/images/products/`, `scripts/capture-products.mjs` |
| The contact emails (to Roman, and the visitor's receipt), server only | `src/lib/contact-email.ts`; the first-name rule they share with the message box is `src/lib/first-name.ts` |
| The Roman intro: the gate (`intro.tsx`, `intro-gate.ts`), the stage (`intro-stage.tsx`), the cast (`cast.ts`); the palette (`imperial.ts`) and the faces (`roman-type.ts`), which the whole page uses | `src/components/stage/` |
| The products' title cards | `src/components/stage/product-stage.tsx` (the box, and when it plays), `product-stage-card.tsx` (the stage) |
| Act IV: the rank, then the seals | `src/components/stage/rank-honour.tsx` (designali-in/award configured, the platform's line, the glory and the entrance; the laurel's golds are `GILT` in `imperial.ts`), `src/components/ui/award.tsx` (the component), `credentials.tsx` (the act), `frieze.tsx` (the seals, loaded after the page) |
| The hero's painting | `src/components/stage/hero-painting.tsx` (the box, and when it plays), `hero-painting-stage.tsx` (the stage: Hercules placed from where the hero's words are); the print's ground, the name and his words are `stage.tsx`'s |
| Roman numerals | `src/lib/roman.ts` (`toRoman`: 1 to 3999, "·" for 0) |
| The statues (WebP, the figures pre-keyed) and the script that makes them | `public/images/cast/`, `scripts/fetch-cast.mjs` |
| The 21st.dev components and their `-utils` folders | `src/components/ui/` |
| Theme | `src/app/globals.css`: shadcn's theme unmodified, Act I's stack variants (`stack-phone`, `stack`, `flat`), the Roman faces' families, the palette's first four and the Stage's inks as Tailwind colours, the intro's gate, then the résumé's own tokens |
| Share-card fonts | `src/app/_og/fonts/` (Geist, and Cinzel Medium and Cormorant Garamond Italic as static TrueType cut to Latin, all OFL: the share cards set his name in Cinzel and his tagline in Cormorant, the apple icon the R·K monogram) |

The products' previews, the About template, the contact card (with the
message box inside it: `contact-card.tsx`), the footer, the Experience
timeline and Act IV's frieze load after the page (`next/dynamic`, `ssr:
false`), each with the glue that configures it (its class strings and
logic, in its own module), behind blocks of their own height, so the first
screen is light and nothing moves when they land; the sections, their ids
and headers are the page's own HTML, and the `<noscript>` summary covers
visitors without scripts.

### Act II, his products

Roman asked for it on 2026-10-27: "the way projects are presented like
alongside events which are like my biggest projects seems very boring
should be a preview of it and more cooler". Each product is a split row,
alternating sides from lg, in his order (Alongside Events, Sembly, Praxis,
Alongside Brain). The title card just above a row shows its name,
tagline, status and number, so the row doesn't say them again: it keeps
them for screen readers only (its h3, the tagline, "02 / 04" and the
status, ahead of the preview) and shows the product itself, the preview
beside the description, the stack as one line between interpuncts and the
link.

- The public ones show their live sites: a real full-page screenshot in a
  browser frame (dillionverma/safari) and on a phone (designali-in/
  iphone-16-pro), scrolling by itself (one Web Animations transform per
  shot, both on one loop so they reach each end of the page together). It
  plays only while most of the preview is in view, and starts again from
  the top of the page after it has left the screen; it holds still on
  hover, while its link has focus, after Pause, and always under reduced
  motion. At every width the browser runs across the column with the phone
  over its lower corner (a 10:8 stage below md, 3:2 from md). Under it, one
  quiet line (the domain · the month captured) and a Pause with no box.
- The private ones (no public screens) are set as inscriptions of their
  parts, in their descriptions' own words (`flow` in constants.ts, its
  nodes' `count` and `lead` the description's words too; `data.spec`
  checks the words and pins the links): Praxis, XVIII in gold Cinzel over
  "investor personas · debate every position" (screen readers hear
  "Eighteen"), its Discovery Engine and AI portfolio manager, then
  "Executing through" Alpaca "on paper" (its own line, the description's
  first sentence, is not set: the description beside it opens with it,
  and nothing is said twice on one screen);
  Alongside Brain, a chain numbered I to IV in gold Cinzel in the order its
  links run (Slack bot, Claude, Alongside Brain, Scheduled digests), each
  with its note in Cormorant. The stated links are listed for screen
  readers. Its lines rise in one after another as it arrives (XVIII struck
  in once); the Brain's chain pulses down its steps while it is on screen
  (dimmed steps at 0.55, still AA), with its own Pause. Which part feeds
  which beyond what is stated is a `// needs Roman:` there. No screenshots,
  no made-up screens, no boxes or lines.
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

### Act IV, his Trailhead rank

designali-in/award (`src/components/ui/award.tsx`), its `award` variant,
as published plus two `[site edit]`s that keep the published elements when
absent: `titleAs` and `subtitleAs` (published: h1 and h2; the page has its
h1, and the act's h2 is its eight certifications, so the rank is not filed
under it as a heading of its own: both are `p`). `rank-honour.tsx`
configures it from outside: the rank's name as its title in gold Cinzel
capitals (a sheen parked off them), its rule hidden (space and the change
of face part them), his standing as its subtitle in Cormorant italic, the
laurel filled with a gradient of the
palette's golds, and no level pill (its word, "GOLD", is the component's,
not the record's). "Trailhead" stands in the crown's opening, the page's
own line in marble at 85%, first in reading order; the page's own glory (a
halo of the wash and a still sunburst of fine gold rays, aria-hidden) is
behind. All the words are `RANK`'s. From
xl it stands beside the act's header, below xl between the header and the
frieze. It plays once, when a third of it is in view: the glory, the laurel
growing up from its stems to the crown, the words one after another, then
a sheen across the name (Web Animations, each letting go when done); after
that the sheen comes round every 7 s, only while it is on screen, and the
rays hold still. If any of it is on screen as the
page starts (`/#credentials`, the `/credentials` redirect, the intro's
nav, a restored scroll), there is no entrance. The server's HTML is the
finished honour, so without scripts and under reduced motion it stands
whole and still. No date, badge count or profile link was given:
`// needs Roman:` in constants.ts, and nothing links.

### The Roman intro, the hero's print, and the title cards

kedhareswer/old-masters-preloader (`src/components/ui/old-masters-preloader.tsx`),
as published plus four `[site edit]`s, each keeping the published behaviour
when its prop is absent: `fonts` (the site's own faces, waited for, the word
re-fitted when they land; CSP allows no font from elsewhere), `wordAs` (the
word's element: the page has its h1, so every stage uses a `p`), `formatCount`
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
- What: ROMAN in Cinzel inside the gold meander, filling in as the count
  climbs in Roman numerals, the stars twinkling, the rule drawing in
  beside the eyebrow, the two counts in their outlined pills; then the
  unveil: the flood of the wash (`imperial.ts`) opening as its circle
  under the flash and the sheen, and the cast rising (Hercules and Apollo,
  David blurred behind); then the living landing: the shafts of light and
  the dust in them, the spotlight on the pointer, the figures breathing
  (the 9 s bob) and leaning with the pointer, the moving grain, the scroll
  hint's falling line and ENTER outlined, all as published. From outside: nothing under 12px (on
  a phone the pills hug their words a little closer, so they stand apart
  from 360px wide); the labels the light passes under (the brand, the nav,
  the eyebrow, the counts) and the hint keep a dark halo, and the word
  stands in front of the sheen, so all of it stays AA at the light's
  brightest and through the unveil; the plate on an opaque label of the
  ground; the foot lets the pointer through to ENTER on a phone held
  sideways. Under reduced motion it never shows (the gate). The
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
  page route from `layout.tsx`, though Next gives the 404 no font preloads;
  Cormorant upright, the counter's, not preloaded), and the stages are
  handed them (`ROMAN_FONTS`) to wait for.
- The statues are Unsplash photographs, credited as the component credits
  them (`cast.ts`, `public/humans.txt`). `node scripts/fetch-cast.mjs [id]`
  rewrites them: the two figures pre-keyed (alpha from luminance through
  the component's own transfer, so Safari, which may ignore the component's
  CSS mask, still shows only the statue), the Hercules cut at the belly in
  the file itself and filled inside his outline (his face is in shadow as
  dark as the ground, so the key alone cut it out: the mask is closed and
  its holes filled, his shadows lifted to the print's darkest ink), the
  David an opaque backdrop. Set the printed sizes in
  `cast.ts` and look at the files before committing. (The David photograph
  can't be keyed as a figure: his face is as dark as the wall behind him.)
  The component's fourth photograph, a marble figure holding flowers, is
  left out: Roman, 2026-10-31, "can we remove the girl tho cuz she looks
  naked".

Each product in Act II opens on a title card of the same staging
(`product-stage.tsx`): its title, its tagline, an eyebrow of its domain or
"Private" then its status (12px, in the body ink), its number in gold
Cinzel, one statue (Apollo for Alongside Events and Sembly, the Hercules for
Praxis and Alongside Brain, mirrored on the left-hand rows), and a public
product's own screenshot blurred behind. The four words share one scale (a
long title on two lines, at most 56px on a phone; a short one at most 1.3
times that). No pills or rules; its stars twinkle. A veil of the ground
over its top tenth and its foot, and the statue fading over the same
stretches, so the card has no edges: light in the dark, never a panel.
None of the intro's loading (the meander ring, the count, "Loading", the
barcode, the plate): those are the intro's alone. It opens as the
component does, in the palette (`product-stage-card.tsx`): it mounts a
screen and a half early from below and three quarters of one from above,
and the component draws its word in outline letter by letter as it mounts
(about 2.3 s for the longest title), with its number, its eyebrow and its
stars, so it never scrolls in as an empty box; its load is held (the
component's `progress` at 0) until its word is on screen (three fifths of
the card in view, or the card filling the screen) and its last letter is
in, so the word never fills ahead of its outline; then the word fills
with marble from its foot over about a second and a half (the component's
own surge and stall, run on the card's clock) and the unveil follows: the
flood opens as its circle under the flash and the sheen, the statue rises
and the backdrop surfaces; and it lives on its landing about five seconds
after it arrived: the shafts and the dust (only while the card is on
screen), the spotlight on the pointer, the statue's bob and parallax, the
moving grain. The sheen fades out above the top third and passes behind
the word, and the eyebrow and the number keep a dark halo, so the words
stay AA through the light. Under reduced motion it opens on the
component's still landing, shown once its photographs are placed. It is
aria-hidden with nothing to focus (the row below keeps
the heading and the link); it unmounts once it is that far off the screen; its box
has a fixed height (30rem on a phone), so nothing below moves.

The hero is a page of the same print (Roman, 2026-10-31: "the hero can
still have the painting thingy"; and 2026-11-01, of the curtain it had
stood on: "i like the roman theme better"). The print's ground is the
page's own server HTML (`stage.tsx`): the intro's flood (the wash welling up
from the floor, the component's own gradient in the palette), its vignette
and its grain (an SVG noise, a `data:` image, a little larger than the
hero so it can move: still on its own, flickering as the component's does
while the painting is here), so without the
painting (no scripts, no WebGL, a browser that saves data, a failed chunk)
the hero is still a warm print. Over it, the name, one h1 in the server
HTML: ROMAN in Cinzel filling the measure (capped at 36svh), KUCHERYAVYY
beneath at 0.32 of its size, spaced to the same width, at the page's foot,
with a dark halo and the print darkening under it so it stays clear where
the marble stands behind; above, his tagline in Cormorant italic (a stanza
of its three sentences on a wide screen), "See the work" (the screen's one
button) and "Get in touch" (a text link), which set in once as the page
opens (held while the intro is up, let go as it lifts; never under reduced
motion). The name never moves: it is the first and largest paint (smoke
checks the LCP).

The painting is `hero-painting.tsx` (the box, and when it plays) and
`hero-painting-stage.tsx` (the component configured from outside, no
`[site edit]`): Hercules standing in the print, the David blurred behind,
the two-ink marble of the intro, and the intro's living landing (no load,
no unveil: the intro played them, or the page's first paint is the
opening): the component's light canvas, its shafts and the dust drifting
in them at the intro's strength, its spotlight following the pointer,
Hercules breathing (the 9 s bob) and leaning and parting with the pointer
(its parallax and tilt), and the grain moving. The box is inert and takes
no pointer, so the hero hands the pointer's moves on to the component and
takes them back when it leaves the hero or a finger lifts. Nothing of the
component's interface, loading or ornament, no meander, and no light of
the page's own; under reduced motion the component draws its light once
and holds everything still. The component keys nothing more (`threshold: 0`):
the file's filled outline stands, so his face prints as a face in shadow,
not a hole onto the blurred backdrop (the intro and the title cards keep
the component's key, as before). He is placed from where the hero's words are: on
a phone or a tall screen in the middle, his crown just under the two ways
in, his head at most 56% of the width, cut at the page's foot behind the
name; on a wide screen (lg and wider than 5:4) on the right, beside the
words, his chin at the name's top. Hercules, so the hero repeats neither
the intro's landing (Apollo on a phone; both statues wider) nor the first
title card (Apollo). It is aria-hidden and inert; it loads after the page
(once idle, next/dynamic); it waits while the intro is up and rises from
below once the intro has gone (only a fade under reduced motion, and on a
return to the hero); it unmounts when the hero leaves the screen. It never
comes for a browser that asks to save data or reports 2G (the intro's own
test, `savesData()` in `intro-gate.ts`), nor without WebGL, where a
full-screen blended print beneath the page, its light drawn anew every
frame, would take the frames it needs.
If its chunk fails to load, it is simply not there (as the intro's stage
does), never the error page. A phone held sideways (under 500px tall, 3:2
and wider: 667x375, 844x390) is laid out as a wide screen, his words at
the left with Hercules beside them, the name held to a fifth of the
height, so the words, both ways in and the whole name fit the screen.

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
