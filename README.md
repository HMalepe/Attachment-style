# Proximity

A single-file attachment-style assessment. A candidate answers 18 items, gets
plotted on two axes (anxiety / avoidance), then walks a 7-chapter journey
that reveals the founder's coordinate and the predicted dynamic between the
two.

Everything — markup, styles, and logic — lives in `index.html`. No build
step, no dependencies, nothing sent over the network, nothing stored.

## Run it locally

Open `index.html` directly in a browser, or serve it with `npx serve .`

## Deploy

```
npx vercel --prod
```

That's it — Vercel serves a bare `index.html` at the project root with no
configuration needed.

## Editing the founder block

Your own coordinate and personal note live in the `FOUNDER` object near the
top of the `<script>` block in `index.html`. Edit `name`, `anx`, `avo`,
`key`, and `note` there.
