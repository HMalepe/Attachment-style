# Proximity

A single-file attachment-style assessment. A candidate answers 18 items,
gets plotted on two axes (anxiety / avoidance), then walks a 7-chapter
journey that reveals the founder's coordinate and the predicted dynamic
between the two.

## Hard constraints — do not violate

- **Single file.** Everything ships in one `index.html`. No build step, no
  bundler, no npm dependencies, no framework. If a change needs a build
  step, propose it and stop — don't implement it.
- **No network calls at runtime.** No analytics, no telemetry, no fonts
  beyond the existing Google Fonts `@import`, no CDN scripts. The privacy
  claim in the copy is load-bearing and must stay literally true.
- **No storage.** No localStorage, sessionStorage, cookies, or IndexedDB.
  State lives in JS variables and dies with the tab.
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
- **Colour has two jobs, and they need different values.** The four pastel
  accents (`--warm` rose, `--cool` sage, `--gold` honey, `--violet` plum) are
  for **fills, dots, bars and tints only**. As small text on cream they fail
  WCAG badly (2.1–3.4:1). For coloured **text** use the `-ink` variants
  (`--warm-ink`, `--cool-ink`, `--gold-ink`, `--violet-ink`), which all clear
  4.5:1. Same rule for the primary button: its rose gradient is deepened so
  the cream label clears 4.5:1 at the lightest stop.

## Shape of the thing

It reads like a book, not a page. Three screens: cover, questions, and the
deck.

- **The frame is pinned.** On `#quiz` and `#deck` the wrap is exactly one
  viewport tall (`body[data-screen=...]`), the nav sits at the bottom, and
  `#pageBody` / `#qcard` flex to fill and scroll *internally* if a page runs
  long. Almost none do — only the four-corners grid needs a nudge, and it
  gets a "there's a bit more" hint that appears only when a page actually
  overflows.
- **One idea per page.** `resultPages()` and `journeyPages()` each return
  `{eyebrow, html, onShow?}`. Keep pages short enough to fit; if one starts
  overflowing on a small phone, split it rather than shrinking the type.
- **Turning a page** is `turn()` — it restarts the CSS animation by hand
  (`animation:none` → reflow → `''`), sliding in from the direction of
  travel. Advance with the buttons, arrow keys, space, or a swipe.
  `overflow-x:clip` on the paged screens stops the incoming transform from
  ever causing a horizontal pan.

## Architecture

- `Q[]` — the 18 items. Each option carries `ax` (anxiety load) and
  `av` (avoidance load), range -2..+2.
- `P{}` — the four style profiles. Copy lives here.
- `PAIRS{}` — 10 pairwise dynamics, keyed by `pairKey()` (sorted, pipe-joined).
- `CH[]` — the 7 journey chapters. Each has a `build()` returning an HTML string.
- `FOUNDER{}` — the founder's fixed coordinate and personal note. Lives in the
  CONFIG section at the very top of `<script>`, ahead of everything else —
  that's the first thing anyone editing this file should see. Guarded by a
  `validateFounder()` check right below it that `console.warn`s if
  `FOUNDER.key` doesn't match the quadrant `FOUNDER.anx`/`FOUNDER.avo` imply.
- `quadrantKey(anx, avo)` — the anx/avo → style-key quadrant logic, shared by
  `finish()` and the CONFIG validation guard. A `function` declaration (not
  `const`), so it's safe to call from CONFIG at the top of the file even
  though it's defined further down — function declarations are hoisted,
  unlike `let`/`const`.
- `tally()` — normalises raw loads to 0–100 per axis.
- `paintField()` — drives the signature two-orb visual.
- `encodeAnswers()` / `decodeAnswers()` — pack/unpack the 18-answer array into
  a version-tagged (`HASH_VERSION`), URL-safe base64 string for the
  shareable-link feature. A version mismatch or malformed string never
  renders a result — it always falls back to a fresh intake with a visible
  message. The decode check runs at the very end of the script, after
  `RESULT` is declared — calling it earlier hits the `let RESULT` temporal
  dead zone.

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

1. Confirm no new network calls, no storage, no dependencies.
2. Confirm keyboard nav and focus rings still work.
3. Report what you changed and what you deliberately didn't.
