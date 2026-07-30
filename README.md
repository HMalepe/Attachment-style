# Proximity

A single-file attachment-style assessment. A candidate answers 18 items, gets
plotted on two axes (anxiety / avoidance), then walks a 7-chapter journey
that reveals the founder's coordinate and the predicted dynamic between the
two.

Everything — markup, styles, and logic — lives in `index.html`. No build
step, no dependencies, nothing stored. The one exception: `api/reflect.js`,
a tiny serverless function that lets the optional "in your own words" box
get a short Claude-generated reflection. See "The reflection feature"
below — if you never set it up, that box still works fine, it just won't
get a reflection back.

## Run it locally

Open `index.html` directly in a browser, or serve it with `npx serve .`

The gate + the whole quiz work with no setup at all. The reflection feature
needs a real deployment (see below) — running from a plain static server,
requesting a reflection will just fail gracefully and show the WhatsApp
fallback message, which is expected.

## Deploy

```
npx vercel --prod
```

That's it — Vercel auto-detects the `api/reflect.js` serverless function
alongside the static `index.html`, no config file needed.

### Environment variables (set in Vercel → Project Settings → Environment Variables)

| Variable | What it's for |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Never exposed to the client — only `api/reflect.js` reads it, server-side. |
| `GATE_CODE` | Must exactly match `GUEST.code` in `index.html`. Not real security (nothing client-side is), just enough to stop a random bot that finds the `/api/reflect` URL from running up your Anthropic bill. **Update this every time you change `GUEST.code`** — they're not linked automatically. |

Without `ANTHROPIC_API_KEY` set, `/api/reflect` returns an error and the
app shows its normal "couldn't reach Claude" fallback — nothing breaks,
she just doesn't get a reflection.

## The reflection feature

If she writes something in the optional free-text box under a question,
that text (and only that text, only if she uses the box) gets sent once,
when she finishes the quiz, to `/api/reflect`, which asks Claude Haiku for
a short reflection and returns it. Nothing is stored anywhere on either
end — it's a single stateless request/response, not a database. The
on-screen copy (cover screen, closing page) says exactly this; if you
change the behavior, update that copy too so it stays accurate. Full
details in `CLAUDE.md`.

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

The `GUEST` object (also near the top of `<script>`) controls who gets in:

```js
const GUEST = {
  name: "Bree",     // used in the gate's greeting
  code: "JUL26",    // what she types in to get past the gate
  active: true      // flip to false to lock everyone out, instantly,
                     // including anyone with an old result link
};
```

If you're also using the reflection feature, remember to update the
`GATE_CODE` environment variable in Vercel to match `code` whenever you
change it — see the table above.
