const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { PUBLIC_ROLES, EMAIL_RE, publicUser, signToken, passwordProblem, trimStr } = require('../utils');
const { AVATAR_COLORS } = require('../data/seedUsers');
const { cityById } = require('../data/cities');
const { DEMO_MODE, RESET_CODE_TTL_MS } = require('../config');

const RESEND_COOLDOWN_MS = 60 * 1000;

const router = express.Router();
const findByEmail = (email) => db.data.users.find((u) => u.email === String(email || '').trim().toLowerCase());

router.post('/register', (req, res) => {
  const name = trimStr(req.body.name, 80);
  const email = trimStr(req.body.email, 120).toLowerCase();
  const phone = trimStr(req.body.phone, 30);
  const { password, role = 'customer', city = 'lahore' } = req.body;

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const pwErr = passwordProblem(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  if (!PUBLIC_ROLES.includes(role)) return res.status(400).json({ error: 'Please choose a valid account type.' });
  if (!cityById(city)) return res.status(400).json({ error: 'Please choose your city.' });
  if (findByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = {
    id: db.newId(),
    name,
    email,
    phone,
    role,
    city,
    status: 'active',
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    addresses: [],
    garden: null,
    professional:
      role === 'customer'
        ? null
        : { skills: [], experienceYears: 0, serviceAreas: [city], availableDays: [], hours: '', bio: '', rate: 0 },
    favorites: [],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: bcrypt.hashSync(password, 10),
  };
  db.data.users.push(user);
  db.save();
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const user = findByEmail(req.body.email);
  if (!user || !bcrypt.compareSync(String(req.body.password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  user.lastLoginAt = new Date().toISOString();
  db.save();
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// Account recovery: request a 6-digit code, then reset with it.
router.post('/forgot-password', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const user = findByEmail(email);
  const response = { message: 'If an account exists for this email, a 6-digit reset code has been sent.' };
  // Suspended accounts get the same generic reply but no code.
  if (user && user.status !== 'suspended') {
    const previous = db.data.resetCodes.find((c) => c.email === email);
    if (previous?.createdAt && Date.now() - previous.createdAt < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: 'A code was sent a moment ago. Please wait a minute before requesting another.' });
    }
    const code = String(crypto.randomInt(100000, 1000000));
    db.data.resetCodes = db.data.resetCodes.filter((c) => c.email !== email);
    db.data.resetCodes.push({ email, codeHash: bcrypt.hashSync(code, 8), createdAt: Date.now(), expiresAt: Date.now() + RESET_CODE_TTL_MS, attempts: 0 });
    db.save();
    console.log(`[auth] Password reset code for ${email}: ${code}`);
    if (DEMO_MODE) response.demoCode = code;
  }
  res.json(response);
});

router.post('/reset-password', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { code, password } = req.body;
  const entry = db.data.resetCodes.find((c) => c.email === email);
  if (!entry || entry.expiresAt < Date.now()) return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
  if (entry.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
  if (!bcrypt.compareSync(String(code || ''), entry.codeHash)) {
    entry.attempts += 1;
    db.save();
    return res.status(400).json({ error: 'That code is not correct.' });
  }
  const pwErr = passwordProblem(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const user = findByEmail(email);
  if (!user) return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
  if (user.status === 'suspended') return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
  user.passwordHash = bcrypt.hashSync(password, 10);
  db.data.resetCodes = db.data.resetCodes.filter((c) => c.email !== email);
  db.save();
  res.json({ message: 'Password updated. You can now sign in.', token: signToken(user), user: publicUser(user) });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!bcrypt.compareSync(String(currentPassword || ''), req.user.passwordHash)) {
    return res.status(400).json({ error: 'Your current password is incorrect.' });
  }
  const pwErr = passwordProblem(newPassword);
  if (pwErr) return res.status(400).json({ error: pwErr });
  req.user.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.save();
  res.json({ message: 'Password changed.' });
});

module.exports = router;
