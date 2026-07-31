/* ══════════════════ /api/gate ══════════════════
   Checks the entry code against Vercel's environment variables instead
   of a hardcoded string in index.html. This exists because of exactly
   one recurring problem: the code used to live as a plain JS constant
   in index.html, so changing it meant editing code, committing, and
   pushing — and it was easy to update one of the two places (this file
   used to just re-check against GATE_CODE for /api/reflect's benefit)
   and forget the other, so the "real" password and the one actually
   typed in stopped matching. Now there is exactly one password, in
   exactly one place: the GATE_CODE environment variable.

   To change the code, or lock the link entirely: change the env var(s)
   below in Vercel (Project → Settings → Environment Variables), then
   hit Redeploy (Deployments → latest → ⋯ → Redeploy). No code edits,
   no git push — env var changes only take effect on a new deployment,
   Redeploy is just that, with nothing to actually rebuild.

   Env vars:
     GATE_CODE   — required. The code she needs to type in.
     GATE_ACTIVE — optional, defaults to "true". Set to "false" to put
                   the link to sleep instantly (the kill switch) without
                   touching GATE_CODE at all.

   This is still a soft gate, not real security — the worst case is
   someone guesses or is told the code. What it buys you is the same as
   before: stops a casual "someone forwarded me the link" open, and
   gives you an instant, code-free kill switch.

   Zero npm dependencies, same as api/reflect.js. */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, reason: 'method_not_allowed' });
    return;
  }

  const GATE_CODE = process.env.GATE_CODE || '';
  const active = (process.env.GATE_ACTIVE || 'true').trim().toLowerCase() !== 'false';

  if (!GATE_CODE) {
    console.error('GATE_CODE is not set');
    res.status(200).json({ ok: false, reason: 'not_configured' });
    return;
  }

  if (!active) {
    res.status(200).json({ ok: false, reason: 'inactive' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const input = body && typeof body.code === 'string' ? body.code : '';

  const ok = input.trim().length > 0
    && input.trim().toLowerCase() === GATE_CODE.trim().toLowerCase();

  res.status(200).json({ ok });
};
