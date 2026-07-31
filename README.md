# Proximity

A single-file attachment-style assessment. A candidate answers 18 items, gets
plotted on two axes (anxiety / avoidance), then walks a 7-chapter journey
that reveals the founder's coordinate and the predicted dynamic between the
two.

Everything — markup, styles, and logic — lives in `index.html`. No build
step, no dependencies, nothing stored. Two small exceptions, both tiny
serverless functions in `api/`:
  - `api/gate.js` — checks the entry code she types in against the
    `GATE_CODE` environment variable.
  - `api/reflect.js` — lets the optional "in your own words" box get a
    short Claude-generated reflection.

See "Setting the access code" and "The reflection feature" below.

## Run it locally

Serving `index.html` with a plain static server (e.g. `npx serve .`) gets
you the quiz itself, but **not** the gate — `api/gate.js` won't be running,
so the code check has nothing to talk to and will show "couldn't check
that just now." For the full thing locally, use `npx vercel dev`, which
runs the static file and both `api/*.js` functions together the same way
production does.

## Deploy

```
npx vercel --prod
```

That's it — Vercel auto-detects both `api/*.js` serverless functions
alongside the static `index.html`, no config file needed.

### Environment variables (set in Vercel → Project Settings → Environment Variables)

| Variable | What it's for |
|---|---|
| `GATE_CODE` | **The** entry code — the one and only place it lives. Checked by both `api/gate.js` (the actual gate) and `api/reflect.js` (a soft check, to stop a random bot from running up your Anthropic bill). Nothing in `index.html` needs to match it; there's nothing to keep in sync. |
| `GATE_ACTIVE` | Optional, defaults to `true`. Set to `false` to lock the link instantly — the kill switch, no code change needed. |
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Never exposed to the client — only `api/reflect.js` reads it, server-side. |

Changing any of these takes effect on your **next deployment** — Vercel
doesn't hot-reload env vars into an already-running deployment. After
changing one in the dashboard, go to Deployments → latest → ⋯ → Redeploy.
No code edit, no `git push` required — just the redeploy.

Without `GATE_CODE` set, the gate always says "this link isn't set up
yet." Without `ANTHROPIC_API_KEY` set, `/api/reflect` returns an error and
the app shows its normal "couldn't reach Claude" fallback — nothing
breaks, she just doesn't get a reflection.

## The reflection feature

If she writes something in the optional free-text box under a question,
that (and only that, only if she uses the box) triggers one request, when
she finishes the quiz, to `/api/reflect`. The payload isn't just the note
— it's her full set of picks across all 18 questions plus the result
calculated from them (name + the two numbers), so Claude Haiku can write
a reflection that actually engages with her real result instead of
commenting on an isolated note with no context. Nothing is stored
anywhere on either end — it's a single stateless request/response, not a
database. The on-screen copy (cover screen, closing page) says exactly
this; if you change the behavior, update that copy too so it stays
accurate. Full details in `CLAUDE.md`.

## The PDF export

The "download the pdf" button on the results page uses the browser's own
print-to-PDF (`window.print()`) against a purpose-built printable view —
no library, no server, no network. Works with zero setup, locally or
deployed.

## Editing the founder block

Your own coordinate and personal note live in the `FOUNDER` object near the
top of the `<script>` block in `index.html`. Edit `name`, `anx`, `avo`,
`key`, and `note` there.

## Setting the access code

Change the `GATE_CODE` environment variable in Vercel, then Redeploy. That's
the whole process — no code edit, no `git push`. Same for locking the link:
set `GATE_ACTIVE` to `false` and Redeploy; everyone (including anyone with
an old result link) gets "this link's been put to sleep." Flip it back to
`true` (or delete the variable) and Redeploy to reopen it.

The only thing still in `index.html` is the `GUEST` object, and it's purely
cosmetic now — just the name used in the gate's greeting ("Hi, Bree?"):

```js
const GUEST = {
  name: "Bree"
};
```
