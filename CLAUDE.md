# Proximity

A single-file attachment-style assessment, written as something one person
sends to someone they're interested in. She answers 18 questions, gets
plotted on two axes (worry about being left / keeping yourself back), then
turns through a short book that reveals his coordinate and what the two of
them are likely to do to each other.

## Hard constraints — do not violate

- **Single file, plus exactly two narrow exceptions.** Everything
  user-facing ships in one `index.html`. No build step, no bundler, no npm
  dependencies, no framework. The two deliberate exceptions are tiny
  dependency-free Vercel serverless functions in `api/`:
    - `api/gate.js` — checks the code she types in against the `GATE_CODE`
      env var, so the password lives in exactly one place (Vercel), not
      hardcoded in this file. See the `GUEST` bullet further down for why.
    - `api/reflect.js` — holds the Anthropic API key server-side. See
      "The reflection feature" below for why it exists and exactly what
      it's allowed to do.
  Nothing else gets a backend. If some other change needs a build step,
  propose it and stop — don't implement it.
- **No network calls at runtime, except two, and only one is opt-in.** No
  analytics, no telemetry, no fonts beyond the existing Google Fonts
  `@import`, no CDN scripts. The privacy claim in the copy must stay
  literally true — which is why it was rewritten to describe the two real
  exceptions instead of pretending they don't exist:
  **getting past the gate sends the code she types to `/api/gate` to check
  it — no personal data, just the code, every time the page loads. Beyond
  that: if she uses the optional "in your own words" box, that text is sent
  once, at the end, to `/api/reflect` to generate a short Claude reflection,
  then discarded — nothing is stored on either end.** If she never touches
  that box, nothing else ever leaves her phone. This was a deliberate
  call after real back-and-forth about it (see git history around the
  reflection feature and the gate) — don't quietly expand what either
  endpoint does (e.g. logging notes, persisting results, adding other AI
  calls) without
  the same level of scrutiny; the whole point was informed consent, not
  "well, the door's already open." The per-question photos are real images
  but ship as base64 inside `index.html`, not fetched — that one stays a
  hard no, no exception.
- **No storage.** No localStorage, sessionStorage, cookies, or IndexedDB.
  State lives in JS variables and dies with the tab — including the gate:
  passing it isn't remembered, so the code is asked for again on every
  fresh page load. That's the trade-off for the privacy claim staying
  literally true; don't "fix" it with a cookie or storage write.
- **Vanilla JS only.** No React, no jQuery, no TypeScript.
- **Design tokens are fixed.** Use the CSS custom properties in `:root`.
  Never hardcode a hex value that isn't already a token.
- **Accessibility floor:** keyboard-operable, visible focus rings,
  `prefers-reduced-motion` respected. Never regress these.

## Type system

- Display: Bricolage Grotesque. Body: DM Sans. Editorial: Instrument Serif.
- **No monospace.** It was the single strongest "tech questionnaire" signal.
  Chrome labels (counters, eyebrows, axis names, chip text) use `--label`
  (DM Sans, 500, uppercase, ~.22em tracking). The `.eyebrow` class is that
  style — it used to be `.mono`, renamed so the name stops lying.
- Serif carries the romantic register: cover lede, result tag, pull quotes.
  Never for UI, never for long body copy.
- Bricolage is variable — set `font-variation-settings:'opsz'` to match the
  rendered size. It is much narrower than the system fallback, so display
  tracking stays near `-.02em`; tighter and words collide once the real
  webfont loads.

## Visual system

Warm, soft, romantic. This is a flirty personal thing someone sends to a
person they like — **not** a clinical instrument. If a change makes it feel
like a SaaS onboarding flow, it is wrong.

- **Cream and nude ground.** `--ink` is the cream page ground (light), not a
  dark colour — the name is historical. Five soft radial washes in blush,
  peach, sage and rose sit over it, plus a slow aurora drift and a very low
  opacity paper grain (`.05` — any higher reads as dirt on a light ground).
- **Roses.** One inline `<g id="rose">` symbol, reused via `<use>`. The two
  drifting blooms in `.field` are the signature: distance = avoidance,
  thread tension = anxiety. Decorative blooms live in `.petal-field`
  (fixed, `overflow:hidden`, `pointer-events:none`).
  **Colour them with custom properties** (`--petal-1/2/3`) — ordinary CSS
  selectors cannot reach inside a `<use>` shadow tree, but inherited custom
  properties can. Selector-based fills silently render black.
- **Soft glass on cream.** Translucent white fills, warm hairline borders,
  generous radii, and shadows tinted warm brown — never black.
- **Per-question photos (`.qimg`).** A real photo sits in a rounded card
  above every question, cross-fading via a slow Ken Burns drift. It scrims
  to cream at the bottom edge so `.qtext` below it never loses contrast —
  don't remove that gradient, and don't let the card grow tall enough to
  crowd the options off a small phone screen (`clamp()` keeps it responsive
  to viewport height already; adjust the clamp, not a fixed height).
- **Word-pop text.** `.qtext`, `.verdict` and `.chtitle` reveal word-by-word
  on a spring ease — the "in your face" gimmick. It's decorative flair, not
  a substitute for the type system above; don't reach for a different font
  or a louder colour to chase the same effect.
- **Colour has two jobs, and they need different values.** The four pastel
  accents (`--warm` rose, `--cool` sage, `--gold` honey, `--violet` plum) are
  for **fills, dots, bars and tints only**. As small text on cream they fail
  WCAG badly (2.1–3.4:1). For coloured **text** use the `-ink` variants
  (`--warm-ink`, `--cool-ink`, `--gold-ink`, `--violet-ink`), which all clear
  4.5:1. Same rule for the primary button: its rose gradient is deepened so
  the cream label clears 4.5:1 at the lightest stop.

## Shape of the thing

It reads like a book, not a page. Four screens: the gate, cover, questions,
and the deck. The gate reuses the cover's visual language (`.eyebrow`, `h1`,
`.lede`, `.note`, `.cta`) rather than inventing a "login form" look — it's
the front door of the same book, not a separate product. It's also the one
static headline that deliberately skips the word-pop treatment (see
`animateWords()`) — that gimmick is reserved for text that changes on every
render; a one-time gate you see exactly once doesn't need it.

- **The frame is pinned.** On `#quiz` and `#deck` the wrap is exactly one
  viewport tall (`body[data-screen=...]`), the nav sits at the bottom, and
  `#pageBody` / `#qcard` flex to fill and scroll *internally* if a page runs
  long. It gets a "there's a bit more" hint that appears only when a page
  actually overflows.
  **Gotcha:** any direct child of `#pageBody`/`#qcard` that has its own
  `overflow:hidden` (every "card" class — `.grid-card`, `.pairbox`,
  `.invite`, `.share`) loses the flexbox auto-min-size protection that
  normally stops a flex item shrinking below its content. Without a fix,
  a tall card gets silently crushed and its bottom half clipped on a short
  viewport instead of the page scrolling — this actually happened to the
  "your two numbers" page's meters on phone-height screens. The fix is the
  blanket `#pageBody > *,#qcard > * {flex-shrink:0}` rule — keep it, and
  don't give a new top-level page element `flex-shrink` some other value.
- **Every screen that scrolls internally resets its own scroll position on
  render, always.** `renderPage()` (the deck) does `body.scrollTop = 0`;
  `render()` (the questions) does `el('qcard').scrollTop = 0` for the same
  reason. This one was missing on the questions screen for a while, and
  the bug it caused was nasty precisely because it was invisible in the
  obvious place to look: scroll down on any question (which she has to,
  to reach "next"), hit next, and the *next* question inherits that same
  scroll offset — pushing its image and question number off the top of
  the screen, silently, for the rest of the quiz. It looked like "the
  picture stopped showing after question 1," not "scroll state leaked
  between renders," because nothing else about the layout was visibly
  broken. Any future page/screen that scrolls internally needs this same
  reset the moment its content changes — don't assume the browser clamps
  it back to something sane on its own.
- **One idea per page.** `resultPages()` and `journeyPages()` each return
  `{eyebrow, html, onShow?}`. Keep pages short enough to fit; if one starts
  overflowing on a small phone, split it rather than shrinking the type.
- **Turning a page** is `turn()` — it restarts the CSS animation by hand
  (`animation:none` → reflow → `''`), sliding in from the direction of
  travel. Advance with the buttons, arrow keys, space, or a swipe.
  `overflow-x:clip` on the paged screens stops the incoming transform from
  ever causing a horizontal pan.
- **Mobile is the primary target, so animations are compositor-only.**
  Every progress/meter bar (`.bar span`, `.track span`) animates
  `transform:scaleX()` off a fixed `width:100%`, not `width` itself —
  keep it that way, animating `width` forces a layout recalc every frame.
  Same reasoning for the "YOU" ping ring on the map: it scales via
  `transform` (`transform-box:fill-box` so it scales around the dot, not
  the SVG viewport) instead of animating the SVG `r` attribute. The
  handful of animations that run for the entire session — the aurora
  drift, the two field roses, the thread hum, the per-question Ken Burns
  image — carry `will-change:transform` so they're promoted to their own
  layer immediately instead of the browser discovering that mid-scroll.
  Don't add `will-change` to one-off hover/press effects; that just wastes
  memory for something that's idle 99% of the time.
- `background-attachment:fixed` was deliberately removed from `body`. It
  looks identical (the mesh is a full-bleed wash, not a parallax effect)
  but forces a full repaint of the background on every scroll frame —
  one of the most common mobile-Safari jank triggers. Don't put it back.
- `--blur` / `--blur-lg` (the backdrop-filter tokens behind every glass
  card) get a cheaper value under `@media (pointer:coarse), (max-width:640px)`.
  Backdrop-filter is the single most expensive thing on this page —
  trimming the radius on touch/small viewports keeps the "soft glass"
  look while meaningfully cutting the GPU cost on the phones this is
  actually read on. If you add a new glass surface, use `var(--blur)`/
  `var(--blur-lg)` like the rest, never a hardcoded blur value, so it
  inherits this discount automatically.
- Buttons get `:active` states mirroring their `:hover` ones (`.cta`,
  `.nx`, `.opt`, `.ghost`, the copy button). Touch devices don't reliably
  fire `:hover`, so without this every tap feels unresponsive until
  release. Add both together for any new interactive element.
- `.wrap` padding includes `env(safe-area-inset-*)` and the viewport tag
  has `viewport-fit=cover`, so content and the pinned bottom nav clear
  the notch/home-indicator on edge-to-edge phones.

## Architecture

- `Q[]` — the 18 items. Each option carries `ax` (anxiety load) and
  `av` (avoidance load), range -2..+2.
- `QIMG[]` — one base64 JPEG data URI per question, index-matched to `Q[]`.
  The compressed copies live in `assets/questions/*.jpg` for reference;
  the original AI-generated source PNGs are intentionally not kept in the
  repo. See `assets/process_images.py` for how to regenerate one —
  `index.html` is still the one file that matters at runtime; everything
  in `assets/` is tooling, not shipped.
  **`WIDTH=1200` / `QUALITY=78`** (bumped up from an original 640/50 that
  looked genuinely soft on a retina phone screen — a real bug report, not
  a nitpick). Total payload for all 18 is ~1.9MB before base64, ~2.5MB
  after — that's most of `index.html`'s size, and a deliberate trade-off:
  don't "optimize" it back down without checking on an actual phone
  first, softness here reads as "cheap," which undercuts the whole point
  of a nicely-designed personal thing. If you ever need to claw the
  payload back down, drop `WIDTH` before you drop `QUALITY` — resolution
  is what reads as sharp on a retina screen, quality mostly just adds
  JPEG artifacting in flat areas.
- `P{}` — the four style profiles. Copy lives here.
- `PAIRS{}` — 10 pairwise dynamics, keyed by `pairKey()` (sorted, pipe-joined).
- `GUT[]` — the rotating gut-check line shown under every question.
- `resultPages(p, anx, avo, extras)` / `journeyPages()` — the book. Each
  returns an array of `{eyebrow, html, onShow?}`; `finish()` concatenates
  them into `DECK` and `renderPage()` shows one at a time. `onShow` exists
  for the couple of pages that have to touch their own DOM after render
  (the share page). `extras` is the "in your own words" list (see below) —
  `resultPages` splices in an extra page for it, right before the share
  page, only when it's non-empty.
- `FOUNDER{}` — the founder's fixed coordinate and personal note. Lives in the
  CONFIG section at the very top of `<script>`, ahead of everything else —
  that's the first thing anyone editing this file should see. Guarded by a
  `validateFounder()` check right below it that `console.warn`s if
  `FOUNDER.key` doesn't match the quadrant `FOUNDER.anx`/`FOUNDER.avo` imply.
- `GUEST{name}` — just the gate's greeting ("Hi, Bree?"). The actual code
  and the kill switch both live server-side now, in `api/gate.js`, driven
  entirely by the `GATE_CODE` / `GATE_ACTIVE` environment variables. This
  used to be `GUEST{name, code, active}` with the code hardcoded here and
  a separate `codeMatches()` doing the comparison client-side — that setup
  had a real, recurring problem: `GATE_CODE` (used by `api/reflect.js` for
  its own soft check) had to be kept in sync with `GUEST.code` by hand,
  and it was easy to update one and forget the other, or to just assume
  changing the Vercel env var alone would change the actual password (it
  didn't — the gate never looked at it). Now there's exactly one password,
  in exactly one place, and changing it never touches this file: update
  `GATE_CODE` in Vercel, hit Redeploy, done. **Still a soft lock, not real
  security** — the check now happens server-side, which is a genuine
  improvement (the code isn't sitting in plaintext in the shipped JS
  anymore), but this is still a personal quiz gate, not an auth system.
  `checkGateCode(input)` (async, calls `/api/gate`) is the one place the
  client asks the question — reuse it rather than adding another fetch
  inline. To hand this to the next person: change `GUEST.name` here,
  change `GATE_CODE` in Vercel, redeploy. That's the whole migration.
  **If you ever touch the gate's `.shake` CSS again**: it and `.rise` both
  set the `animation` shorthand, which doesn't merge — whichever wins the
  cascade wipes out the other's animation entirely, including `.rise`'s
  "hold at opacity:1" forwards fill. `.shake` has explicit `opacity:1`/
  `transform:none` specifically to survive that; removing them silently
  makes the whole gate form permanently invisible (but still fully
  functional underneath) the instant someone types a wrong code. This was
  a real, shipped bug — caught late because the elements still had valid
  layout/bounding boxes, so anything short of an actual screenshot missed
  it.
- `quadrantKey(anx, avo)` — the anx/avo → style-key quadrant logic, shared by
  `finish()` and the CONFIG validation guard. A `function` declaration (not
  `const`), so it's safe to call from CONFIG at the top of the file even
  though it's defined further down — function declarations are hoisted,
  unlike `let`/`const`.
- `answers[]` — one entry per question, each an array of 1–2 selected option
  indices (empty until answered). `toggleOpt()` adds/removes a pick, keeping
  at most the two most recent. **Advancing is manual, never automatic** —
  `#qNext` (`updateNextBtn()` enables it once `answers[i].length`) is the
  only trigger besides Enter. There used to be a timer that auto-advanced
  after a pick; it got removed because it fired mid-decision, before a
  second pick could land, and on a touch device (no Enter key, and `.hint`
  is hidden under `pointer:coarse`) it was the *only* way to move forward —
  meaning there was no way to slow it down. Don't reintroduce any
  auto-advance on the question screen for any reason.
- `tally()` — normalises raw loads to 0–100 per axis. When a question has two
  picks, it **averages** their ax/av rather than summing, so an "in between"
  answer lands between the two options instead of double-weighting that
  question relative to single-pick ones.
- `OTHER[]` — optional free-text "in your own words" per question, from the
  box under the options. Local-only: folded into `SUMMARY` and into the
  results deck's "in your own words" page, but deliberately **not** part of
  the share-link payload (see `encodeAnswers`). Always pass it through
  `escapeHtml()` before dropping it into `innerHTML` — it's user input.
- `paintField()` — drives the signature two-rose visual.
- `soloMap()` / `dualMap()` / `gridBase()` — the quadrant grid. Worry grows
  *downward* (`py`), because ANXIOUS and BOTH are the lower two corners.
  `soloMap()` (the "your two numbers" page) labels the coordinate `YOU`
  directly on the dot — don't rely on colour/position alone to convey
  "this is you," people skim. It nudges the label's y (flips below the dot
  near the top edge) and x/anchor (shifts inward near the left/right edges)
  so it never clips the canvas or sits on top of a corner's quadrant name.
- `animateWords(node, text?)` — splits text into `.word-pop` spans with a
  staggered spring-eased entrance, used for `.qtext`, `.verdict` and
  `.chtitle` (anything that shows fresh text on every render). Reads
  `node.textContent` when `text` is omitted, so it can restyle markup
  that's already in the DOM. Needs no explicit `prefers-reduced-motion`
  override — it only sets opacity/transform via the keyframe, never as a
  base style, so disabling the animation naturally leaves it fully visible.
- **The reflection feature** — one of two network calls in the whole app
  (the other is the gate check above). `finish()` calls
  `requestReflection(extras)` (fire-and-forget, right when the deck
  starts, not when she reaches the page — by the time she's clicked
  through a few results pages the response is usually already back). It
  POSTs `buildReflectionPayload(extras)` — `{code, notes}`, where `code`
  is `ENTERED_CODE` (whatever she actually typed and had accepted at the
  gate, kept in a plain in-memory variable, never stored) and `notes` is
  her question/answer pairs — to `/api/reflect`. `reflectionState`
  (`idle`/`pending`/`done`/`failed`) and `reflectionText` are the only
  state; `showReflection()` is the `onShow` for the "in your own words"
  page and just paints whatever the current state is, so it's safe to
  call every time that page is (re)shown, including before the fetch has
  settled. On failure (bad key, offline, rate-limited, anything) it shows
  a plain "couldn't reach Claude" message with a WhatsApp link to
  `HOLIDAY_WHATSAPP` — never a broken page, never a silent retry loop.
  `buildReflectionPayload` is deliberately a pure function separate from
  the `fetch()` call so the self-test can check its shape without
  touching the network. See `api/reflect.js` for the server side: it
  re-checks `code` against the same `GATE_CODE` env var `api/gate.js`
  uses (nothing to keep in sync anymore — same variable, same source of
  truth), caps note count/length, and never persists anything — that
  function is stateless by design, don't add a database behind it.
- **The PDF export** — `downloadPdf()` (wired to the "download the pdf"
  button on the "yours to keep" page, inside `fillShare()`) builds one
  plain HTML document out of the current `DECK` via `buildPrintHtml()` /
  `buildPrintPageHtml()`, drops it into the hidden `#printView`, and calls
  `window.print()` — the browser's own print-to-PDF, no library, no
  network, no server. Two things get special-cased rather than reused
  as-is: the "yours to keep" page (its live textareas/buttons mean nothing
  on paper, so it's swapped for the plain-text `SUMMARY`) and the
  reflection box (frozen at whatever `reflectionState` has settled to by
  click time — never ships the "still thinking" placeholder). Every other
  page's `id="..."` attributes get stripped before insertion so they can't
  collide with the live, on-screen copies of the same ids. If you add a
  page type to the deck, no special handling is needed unless it has its
  own interactive-only markup like the share page does.
- `encodeAnswers()` / `decodeAnswers()` — pack/unpack the answer array into
  a version-tagged (`HASH_VERSION`), URL-safe base64 string for the
  shareable-link feature. Each question packs as a 4-bit option bitmask
  (1 or 2 bits set) rather than a single 2-bit index, to carry the "up to
  2 picks" feature — bump `HASH_VERSION` again if the packing changes.
  A version mismatch, malformed string, or a mask with 0 or 3+ bits set
  never renders a result — it always falls back to the questions with a
  visible message. The decode check runs at the very end of the script,
  after `RESULT` is declared — calling it earlier hits the `let RESULT`
  temporal dead zone.

## Voice

Direct, analytical, warm underneath. Short sentences. No therapy-speak, no
"journey of self-discovery," no em-dash-heavy hedging. Cite real researchers
by name where a claim comes from their work. Never overstate the science —
this is an informal adaptation of the ECR-R, not a clinical instrument, and
the copy says so.

**Who is speaking.** The narrator is a woman talking to the person he's
interested in. She refers to him in the third person ("he", and by
`FOUNDER.name`) and to the reader as "you". Warm, funny, a bit direct — like
a friend who happens to know the research. Light on jargon: an occasional
"FYI" aside is right, a lecture is not. Nobody should have to go and look
something up to follow a page.

The one exception is `FOUNDER.note`, which stays in **his** first person. The
narrator hands over to it explicitly ("I'll get out of the way for this bit")
and takes the thread back afterwards. Don't rewrite that note — it's his.

**Every question carries a gut-check line** (`GUT[]`, rotating). The test is
only worth anything if she answers on instinct; the clever-sounding answer
quietly ruins her own result. Never drop that nudge.

## Before you finish any task

1. Confirm no *new* network calls or storage beyond the one documented
   exception (`/api/reflect`, stateless, opt-in), and no new npm
   dependencies anywhere, including in `api/reflect.js`.
2. Confirm keyboard nav and focus rings still work.
3. If you touched anything that sends data anywhere, confirm the on-screen
   privacy copy (cover screen, closing "the ask" page) still describes
   reality exactly — not "close enough."
4. Report what you changed and what you deliberately didn't.
