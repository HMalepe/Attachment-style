/* ══════════════════ /api/reflect ══════════════════
   The ONE server-side thing in this whole project. Everything else in
   this repo is a static file with zero backend — this exists purely
   because an Anthropic API key can't safely sit in client-side JS.

   What it does, exactly:
     - Takes the "in your own words" notes she typed under the questions.
     - Sends them to Claude, once, to write a short reflection.
     - Returns that reflection. Stores nothing. Logs nothing beyond
       whatever Vercel's own request logs capture by default.
   That's the whole contract — see CLAUDE.md before changing it.

   Env vars required on Vercel (Project Settings → Environment Variables):
     ANTHROPIC_API_KEY  — your Anthropic key. Never exposed to the client.
     GATE_CODE          — must match GUEST.code in index.html exactly.
                           Not real security (nothing client-side is),
                           just enough to stop a random bot that finds
                           this URL from running up your Anthropic bill.
                           Update this every time you change GUEST.code.

   Zero npm dependencies on purpose — Vercel's Node runtime ships a
   global fetch, so a plain CommonJS function is enough. No package.json,
   no build step, nothing to install. */

const MODEL = 'claude-haiku-4-5';   // fast + cheap, all this needs
const MAX_NOTES = 18;               // can't exceed the question count anyway
const MAX_NOTE_LEN = 400;           // matches the textarea's maxlength
const MAX_Q_LEN = 200;
const MAX_TOKENS = 300;             // a few sentences, not an essay — keeps cost trivial

const SYSTEM_PROMPT = `You're a warm, direct friend reading what someone wrote in the margins of an attachment-style quiz she just took about her relationship. Write a short reflection: 3 to 5 sentences, plain conversational English. No therapy-speak, no bullet points, no "it sounds like" hedging, no clinical labels, no generic AI disclaimers. Reference something specific from what she actually wrote rather than staying generic. Talk to her directly as "you". Never diagnose her or invent anything she didn't tell you.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const gateCode = process.env.GATE_CODE || '';
  const apiKey = process.env.ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    res.status(500).json({ error: 'server not configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'malformed body' });
    return;
  }

  const { code, notes } = body;

  if (gateCode && (typeof code !== 'string' || code.trim().toLowerCase() !== gateCode.trim().toLowerCase())) {
    res.status(403).json({ error: 'not authorized' });
    return;
  }

  if (!Array.isArray(notes) || notes.length === 0) {
    res.status(400).json({ error: 'no notes' });
    return;
  }

  const clean = notes
    .filter(n => n && typeof n.q === 'string' && typeof n.a === 'string' && n.a.trim())
    .slice(0, MAX_NOTES)
    .map(n => ({ q: n.q.slice(0, MAX_Q_LEN), a: n.a.slice(0, MAX_NOTE_LEN) }));

  if (!clean.length) {
    res.status(400).json({ error: 'no notes' });
    return;
  }

  const transcript = clean.map(n => `Q: ${n.q}\nHer note: ${n.a}`).join('\n\n');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: 'text', text: SYSTEM_PROMPT }],
        messages: [{ role: 'user', content: transcript }]
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('Anthropic error', upstream.status, errText);
      res.status(502).json({ error: 'upstream failed' });
      return;
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter(b => b && b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    if (!text) {
      res.status(502).json({ error: 'empty response' });
      return;
    }

    res.status(200).json({ reflection: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server error' });
  }
};
