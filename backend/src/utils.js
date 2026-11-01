const ROLES = ['customer', 'gardener', 'decorator', 'admin'];
const PUBLIC_ROLES = ['customer', 'gardener', 'decorator'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

// At least 6 characters (Firebase's minimum), mixing letters and numbers.
function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < 6) return 'Password must be at least 6 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must include letters and numbers.';
  return null;
}

// Copies only allowed keys from a request body.
function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

const trimStr = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = { ROLES, PUBLIC_ROLES, EMAIL_RE, publicUser, passwordProblem, pick, trimStr };
