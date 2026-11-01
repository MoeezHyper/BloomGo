// "Continue with Google" via the browser, so it works in Expo Go (no native build):
//   app → /start → Google sign-in → /callback (code exchanged here, the client secret
//   never leaves the server) → back to the app with a Google ID token, which the app
//   hands to Firebase (signInWithCredential).
// With the Firebase Auth Emulator, /start shows a local test account picker instead,
// because the emulator accepts unsigned test identities.
const crypto = require('crypto');
const express = require('express');
const { usingEmulator } = require('../firebase');
const { APP_NAME, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config');

const router = express.Router();
const configured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
// Signs the state we round-trip through Google so the return address can't be swapped.
const STATE_KEY = GOOGLE_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');
const STATE_TTL_MS = 10 * 60 * 1000;
const RESULT_TTL_MS = 5 * 60 * 1000;
// Finished sign-ins waiting for the app to collect them, keyed by the app's random state.
// Some Android browsers won't hand the result back through the app link, so the app
// also fetches it here once the browser closes. Single use.
const results = new Map();

// Only send tokens back into the app itself (Expo Go or the installed app's scheme).
const allowedReturn = (url) => /^(exp|exps|smarthomegardening):\/\//.test(String(url || ''));

const sign = (data) => crypto.createHmac('sha256', STATE_KEY).update(data).digest('base64url');
function packState(redirect, appState) {
  const data = Buffer.from(JSON.stringify({ r: redirect, s: appState, t: Date.now() })).toString('base64url');
  return `${data}.${sign(data)}`;
}
function unpackState(state) {
  const [data, mac] = String(state || '').split('.');
  if (!data || !mac || mac.length !== 43 || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sign(data)))) return null;
  const parsed = JSON.parse(Buffer.from(data, 'base64url').toString());
  if (Date.now() - parsed.t > STATE_TTL_MS || !allowedReturn(parsed.r)) return null;
  return parsed;
}

// Chrome won't always follow a server redirect into an app scheme, so hand back with a
// page that switches automatically and offers a button if it doesn't.
// Android Chrome hands app links over most reliably in its intent:// form.
function androidIntent(url) {
  const scheme = url.protocol.replace(':', '');
  const pkg = scheme === 'exp' || scheme === 'exps' ? ';package=host.exp.exponent' : '';
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme}${pkg};end`;
}

function backToApp(req, res, redirect, params) {
  if (params.state && params.state.length >= 16) results.set(params.state, { params, at: Date.now() });
  const url = new URL(redirect);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const href = esc(/Android/i.test(req.get('user-agent') || '') ? androidIntent(url) : url.toString());
  res.send(
    page(
      'Return to the app',
      `<span class="tag">${params.error ? 'Sign-in not completed' : 'Signed in'}</span><h1>Return to ${esc(APP_NAME)}</h1>
<p>${params.error ? 'Google sign-in didn’t finish.' : 'You’re signed in with Google.'} If the app doesn’t open by itself, tap the button or close this tab (✕).</p>
<a href="${href}" id="go" class="btn">Return to the app</a>
<script>setTimeout(function(){location.replace(document.getElementById('go').href)},150)</script>`
    )
  );
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>
body{margin:0;font-family:system-ui,-apple-system,Roboto,sans-serif;background:#FAF7F2;color:#15241C;display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{background:#fff;border:1px solid #E7E0D3;border-radius:24px;padding:28px 24px;width:min(420px,90vw);box-shadow:0 8px 30px rgba(24,59,39,.08)}
h1{font-size:22px;margin:0 0 6px}p{color:#76857C;font-size:14px;line-height:1.5;margin:0 0 18px}
label{display:block;font-size:13px;font-weight:600;margin:14px 0 6px}input{box-sizing:border-box;width:100%;height:48px;border:1.2px solid #E7E0D3;border-radius:14px;padding:0 14px;font-size:15px}
button,.acct{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;border-radius:14px;font-size:15px;cursor:pointer}
button{justify-content:center;height:50px;border:0;background:#183B27;color:#fff;font-weight:600;margin-top:18px}
.btn{display:flex;align-items:center;justify-content:center;height:50px;border-radius:14px;background:#183B27;color:#fff;font-weight:600;font-size:15px;margin-top:18px;text-decoration:none}
.acct{justify-content:flex-start;border:1px solid #E7E0D3;background:#fff;padding:12px 14px;margin-bottom:10px;color:#15241C;text-align:left;height:auto}
.av{width:36px;height:36px;border-radius:18px;background:#DFEADE;display:flex;align-items:center;justify-content:center;font-weight:700;color:#183B27}
.tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#28543B;text-transform:uppercase;margin-bottom:10px}
small{display:block;color:#76857C;font-size:12px}</style></head><body><div class="card">${body}</div></body></html>`;
}

// The app asks for a random state first (no native crypto needed in Expo Go).
router.post('/begin', (_req, res) => res.json({ state: crypto.randomBytes(24).toString('base64url') }));

router.get('/start', (req, res) => {
  const { redirect, state = '' } = req.query;
  if (!allowedReturn(redirect)) return res.status(400).send(page('Invalid request', '<h1>Invalid request</h1><p>Unknown return address.</p>'));
  const packed = packState(redirect, String(state).slice(0, 100));

  if (usingEmulator) {
    const sample = [
      { name: 'Test Gardener', email: 'google.tester@gmail.com' },
      { name: 'Sara Ahmed', email: 'sara@demo.com' },
    ];
    return res.send(
      page(
        'Choose an account',
        `<span class="tag">Local test mode</span><h1>Sign in with Google</h1>
<p>The Firebase emulator is running, so this test page stands in for Google. Pick an account or enter any email.</p>
${sample
  .map(
    (a) => `<form method="get" action="emulator"><input type="hidden" name="state" value="${esc(packed)}"><input type="hidden" name="name" value="${esc(a.name)}"><input type="hidden" name="email" value="${esc(a.email)}">
<button class="acct" type="submit"><span class="av">${esc(a.name[0])}</span><span>${esc(a.name)}<small>${esc(a.email)}</small></span></button></form>`
  )
  .join('')}
<form method="get" action="emulator"><input type="hidden" name="state" value="${esc(packed)}">
<label>Name</label><input name="name" placeholder="Your name" required>
<label>Email</label><input name="email" type="email" placeholder="you@gmail.com" required>
<button type="submit">Continue</button></form>`
      )
    );
  }

  if (!configured) {
    return res
      .status(503)
      .send(page('Google sign-in not set up', '<h1>Google sign-in isn’t set up yet</h1><p>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env (see README), then restart.</p>'));
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: packed,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/callback', async (req, res) => {
  const st = unpackState(req.query.state);
  if (!st) return res.status(400).send(page('Sign-in expired', '<h1>This sign-in link expired</h1><p>Go back to the app and try again.</p>'));
  if (req.query.error) return backToApp(req, res, st.r, { error: String(req.query.error), state: st.s });
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(req.query.code || ''),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const data = await r.json();
    if (!r.ok || !data.id_token) throw new Error(data.error_description || data.error || 'token exchange failed');
    backToApp(req, res, st.r, { id_token: data.id_token, state: st.s });
  } catch (e) {
    console.error('[google] sign-in failed:', e.message);
    backToApp(req, res, st.r, { error: 'google_failed', state: st.s });
  }
});

// Emulator only: issues an unsigned test identity the Firebase Auth Emulator accepts.
// GET like Google's own redirect: Chrome won't hand a POST redirect over to the app.
router.get('/emulator', (req, res) => {
  if (!usingEmulator) return res.status(404).end();
  const st = unpackState(req.query.state);
  if (!st) return res.status(400).send(page('Sign-in expired', '<h1>This sign-in link expired</h1><p>Go back to the app and try again.</p>'));
  const email = String(req.query.email || '').trim().toLowerCase();
  const name = String(req.query.name || '').trim().slice(0, 80) || email.split('@')[0];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).send(page('Invalid email', '<h1>Please enter a valid email</h1>'));
  const idToken = JSON.stringify({ sub: `test-${crypto.createHash('sha256').update(email).digest('hex').slice(0, 20)}`, email, email_verified: true, name });
  backToApp(req, res, st.r, { id_token: idToken, state: st.s });
});

router.get('/result', (req, res) => {
  const now = Date.now();
  for (const [k, v] of results) if (now - v.at > RESULT_TTL_MS) results.delete(k);
  const entry = results.get(String(req.query.state || ''));
  if (!entry) return res.status(404).json({ error: 'No sign-in result.' });
  results.delete(String(req.query.state));
  res.json(entry.params);
});

router.get('/status', (_req, res) => res.json({ available: usingEmulator || configured, mode: usingEmulator ? 'emulator' : configured ? 'google' : 'off', app: APP_NAME }));

module.exports = router;
