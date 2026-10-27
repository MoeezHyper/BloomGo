const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../config');

function userFromHeader(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, JWT_SECRET);
    return db.data.users.find((u) => u.id === sub) || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = userFromHeader(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  req.user = user;
  next();
}

function optionalAuth(req, _res, next) {
  req.user = userFromHeader(req);
  next();
}

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'You do not have access to this area.' });
    next();
  };

module.exports = { requireAuth, optionalAuth, requireRole };
