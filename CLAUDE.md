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

- Display: Bricolage Grotesque. Body: DM Sans. Utility/data: JetBrains Mono.
  Editorial: Instrument Serif.
- Mono is for instrument chrome only — counters, labels, axis names, citations.
  Never mono for prose.
- Serif is for editorial accents only — the cover lede, the result tag, and
  pull quotes. Never for UI, never for body copy. It carries the "this was
  written by a person" register; the grotesque carries the instrument register.
- Bricolage is a variable face: set `font-variation-settings:'opsz'` to match
  the rendered size. It is narrower than the system fallback, so display
  tracking stays near `-.02em` — tighter than that and words collide once the
  real webfont loads.

## Visual system

Dark, glass, mesh. Every surface follows one material language:

- **Mesh gradient ground.** `body` layers five wide radial gradients in the
  four accent hues over `--ink`, `background-attachment:fixed`. `body::after`
  is a slow aurora drift; `body::before` is an inline SVG grain at low opacity.
  The grain is the "expensive" tell — do not remove it.
- **Glass surfaces.** Cards (`.axis`, `.opt`, `.grid-card`, `.share`,
  `.invite`, `.quad .cell`, `.pairbox`) all use `--glass` +
  `backdrop-filter:var(--blur)` + a hairline `--glass-brd` + `--elev-*`, plus a
  `::before` top-edge `--sheen`. Any sheen pseudo-element needs `> *
  {position:relative}` on the parent or it paints over the content.
- **Elevation, not outlines.** Dark UI reads as premium only when elements
  separate by shadow and hairline highlight. Use `--elev-1/2/3`, never a flat
  border alone.
- **Tokens cover the new material too** — `--glass*`, `--blur*`, `--sheen`,
  `--elev-*`, `--ring`, `--btn-top/bot`, `--ease`, `--spring`, `--grain`. The
  no-hardcoded-hex rule still holds: add a token instead.

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

## Before you finish any task

1. Confirm no new network calls, no storage, no dependencies.
2. Confirm keyboard nav and focus rings still work.
3. Report what you changed and what you deliberately didn't.
