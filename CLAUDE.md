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
- Mono is for instrument chrome only — counters, labels, axis names, citations.
  Never mono for prose.

## Architecture

- `Q[]` — the 18 items. Each option carries `ax` (anxiety load) and
  `av` (avoidance load), range -2..+2.
- `P{}` — the four style profiles. Copy lives here.
- `PAIRS{}` — 10 pairwise dynamics, keyed by `pairKey()` (sorted, pipe-joined).
- `CH[]` — the 7 journey chapters. Each has a `build()` returning an HTML string.
- `FOUNDER{}` — the founder's fixed coordinate and personal note.
- `tally()` — normalises raw loads to 0–100 per axis.
- `paintField()` — drives the signature two-orb visual.

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
