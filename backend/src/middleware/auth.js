const db = require('../db');
const { auth } = require('../firebase');

async function decodeToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

// Finds the app profile for a verified Firebase token.
function profileFor(decoded) {
  const users = db.data.users;
  let user = users.find((u) => u.uid === decoded.uid);
  // First sign-in of an account created outside the app (e.g. Firebase console): link by email.
  if (!user && decoded.email) {
    user = users.find((u) => !u.uid && u.email === decoded.email.toLowerCase());
    if (user) {
      user.uid = decoded.uid;
      db.save();
    }
  }
  return user || null;
}

async function userFromHeader(req) {
  const decoded = await decodeToken(req);
  return decoded ? profileFor(decoded) : null;
}

async function requireAuth(req, res, next) {
  const user = await userFromHeader(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  req.user = user;
  next();
}

// A valid Firebase sign-in that may not have an app profile yet (first Google sign-in).
async function requireFirebaseUser(req, res, next) {
  const decoded = await decodeToken(req);
  if (!decoded) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.firebase = decoded;
  req.user = profileFor(decoded);
  if (req.user?.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  next();
}

async function optionalAuth(req, _res, next) {
  req.user = await userFromHeader(req);
  next();
}

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'You do not have access to this area.' });
    next();
  };

module.exports = { requireAuth, requireFirebaseUser, optionalAuth, requireRole };
