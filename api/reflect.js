/* ══════════════════ /api/reflect ══════════════════
   The ONE server-side thing in this whole project. Everything else in
   this repo is a static file with zero backend — this exists purely
   because an Anthropic API key can't safely sit in client-side JS.

   What it does, exactly:
     - Takes her full 18-question answer set, the result that was
       calculated from it (name + the two numbers), and whatever she
       typed in the "in your own words" boxes.
     - Sends all of it to Claude, once, to write a short reflection that
       actually engages with her real result — not just the free-text
       notes in isolation.
     - Returns that reflection. Stores nothing. Logs nothing beyond
       whatever Vercel's own request logs capture by default.
   That's the whole contract — see CLAUDE.md before changing it.

   Note: this only fires when she's written at least one note (checked
   client-side in finish()) — sending her multiple-choice answers along
   for context doesn't change *when* the network call happens, only how
   much Claude has to work with once it does. No note, no call, same as
   before.

   Env vars required on Vercel (Project Settings → Environment Variables):
     ANTHROPIC_API_KEY  — your Anthropic key. Never exposed to the client.
     GATE_CODE          — the same entry code checked by api/gate.js.
                           Not real security on its own, just enough to
                           stop a random bot that finds this URL from
                           running up your Anthropic bill. Nothing to
                           keep in sync manually anymore — this is the
                           one and only place the code lives.

   Zero npm dependencies on purpose — Vercel's Node runtime ships a
   global fetch, so a plain CommonJS function is enough. No package.json,
   no build step, nothing to install. */

const MODEL = 'claude-haiku-4-5';   // fast + cheap, all this needs
const MAX_NOTES = 18;               // can't exceed the question count anyway
const MAX_NOTE_LEN = 400;           // matches the textarea's maxlength
const MAX_Q_LEN = 200;
const MAX_ANSWERS = 18;             // exactly the question count, but clamp anyway
const MAX_PICKS_PER_Q = 2;          // matches the "pick up to 2" rule
const MAX_LABEL_LEN = 160;
const MAX_RESULT_NAME_LEN = 40;
const MAX_RESULT_TAG_LEN = 300;
const MAX_TOKENS = 450;             // a bit more room now it has a real result to reason about

const SYSTEM_PROMPT = `You're a warm, direct friend who has just read someone's full results from an attachment-style quiz about her relationship — her calculated result (a name and two 0-100 numbers), everything she picked across all the questions, and whatever she typed herself in the "in your own words" boxes.

Your job: write a short reflection, 3 to 5 sentences, that connects her own words to her actual result — not a generic comment on the notes in isolation. Say something specific about how what she wrote either fits the result, adds a layer the multiple-choice couldn't capture, or complicates it in an interesting way. Reference her actual answers or numbers where it's genuinely useful, but don't just recite them back at her.

Plain conversational English. No therapy-speak, no bullet points, no "it sounds like" hedging, no clinical jargon, no generic AI disclaimers. Talk to her directly as "you". Never diagnose her or invent anything she didn't tell you — if her notes don't give you much to go on, keep it grounded in what's actually there rather than filling gaps with guesses.`;

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

  const { code, notes, result, answers } = body;

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

  // both optional, best-effort — an older client or a malformed request
  // just means Claude reasons from the notes alone, same as before
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const cleanResult = (result && typeof result === 'object'
    && typeof result.name === 'string' && Number.isFinite(result.anx) && Number.isFinite(result.avo))
    ? {
        name: result.name.slice(0, MAX_RESULT_NAME_LEN),
        tag: typeof result.tag === 'string' ? result.tag.slice(0, MAX_RESULT_TAG_LEN) : '',
        anx: clamp(Math.round(result.anx), 0, 100),
        avo: clamp(Math.round(result.avo), 0, 100)
      }
    : null;

  const cleanAnswers = Array.isArray(answers)
    ? answers
        .filter(a => a && typeof a.q === 'string' && Array.isArray(a.picked))
        .slice(0, MAX_ANSWERS)
        .map(a => ({
          q: a.q.slice(0, MAX_Q_LEN),
          picked: a.picked
            .filter(p => typeof p === 'string' && p.trim())
            .slice(0, MAX_PICKS_PER_Q)
            .map(p => p.slice(0, MAX_LABEL_LEN))
        }))
        .filter(a => a.picked.length)
    : [];

  const sections = [];
  if (cleanResult) {
    sections.push(
      `Her calculated result: ${cleanResult.name} — worry about being left ${cleanResult.anx}/100, keeping herself back ${cleanResult.avo}/100.`
      + (cleanResult.tag ? `\nWhat that result means: ${cleanResult.tag}` : '')
    );
  }
  if (cleanAnswers.length) {
    sections.push(
      'Her answers across the quiz:\n'
      + cleanAnswers.map((a, i) => `${i + 1}. ${a.q}\n   Picked: ${a.picked.join('; ')}`).join('\n')
    );
  }
  sections.push(
    'Where she wrote her own words instead of just picking an option:\n'
    + clean.map(n => `Q: ${n.q}\nHer note: ${n.a}`).join('\n\n')
  );

  const transcript = sections.join('\n\n---\n\n');

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
