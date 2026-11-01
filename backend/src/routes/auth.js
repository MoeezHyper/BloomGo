// Accounts live in Firebase Auth. The app signs in, resets and changes passwords
// with the Firebase SDK directly; these routes manage the matching app profile.
const express = require('express');
const db = require('../db');
const { auth } = require('../firebase');
const { requireAuth, requireFirebaseUser } = require('../middleware/auth');
const { PUBLIC_ROLES, EMAIL_RE, publicUser, passwordProblem, trimStr } = require('../utils');
const { AVATAR_COLORS } = require('../data/seedUsers');
const { cityById } = require('../data/cities');

const router = express.Router();

function newProfile({ uid, name, email, phone, role, city }) {
  return {
    id: db.newId(),
    uid,
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
  };
}

const findByEmail = (email) => db.data.users.find((u) => u.email === String(email || '').trim().toLowerCase());

// Creates the Firebase account and the profile together, so roles and the
// password rule are enforced here rather than trusted from the client.
router.post('/register', async (req, res) => {
  const name = trimStr(req.body.name, 80);
  const email = trimStr(req.body.email, 120).toLowerCase();
  const phone = trimStr(req.body.phone, 30);
  const { password, role = 'customer', city = 'islamabad' } = req.body;

  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const pwErr = passwordProblem(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  if (!PUBLIC_ROLES.includes(role)) return res.status(400).json({ error: 'Please choose a valid account type.' });
  if (!cityById(city)) return res.status(400).json({ error: 'Please choose your city.' });
  if (findByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' });

  let account;
  try {
    account = await auth.createUser({ email, password, displayName: name });
  } catch (e) {
    if (e.code === 'auth/email-already-exists') return res.status(409).json({ error: 'An account with this email already exists.' });
    if (e.code === 'auth/invalid-password') return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    throw e;
  }

  const user = newProfile({ uid: account.uid, name, email, phone, role, city });
  db.data.users.push(user);
  db.save();
  res.status(201).json({ user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// Called right after a Firebase sign-in. A first-time Google user has a Firebase
// account but no profile yet: 404 tells the app to ask for their role and city.
router.post('/session', requireFirebaseUser, (req, res) => {
  if (!req.user) {
    return res.status(404).json({ error: 'Finish setting up your account.', needsProfile: true, email: req.firebase.email, name: req.firebase.name || '' });
  }
  req.user.lastLoginAt = new Date().toISOString();
  db.save();
  res.json({ user: publicUser(req.user) });
});

// Creates the profile for a Google account signing in for the first time.
router.post('/complete-profile', requireFirebaseUser, (req, res) => {
  if (req.user) return res.json({ user: publicUser(req.user) });
  const email = String(req.firebase.email || '').toLowerCase();
  const name = trimStr(req.body.name, 80) || trimStr(req.firebase.name, 80);
  const phone = trimStr(req.body.phone, 30);
  const { role = 'customer', city = 'islamabad' } = req.body;
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'This Google account has no email address.' });
  if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
  if (!PUBLIC_ROLES.includes(role)) return res.status(400).json({ error: 'Please choose a valid account type.' });
  if (!cityById(city)) return res.status(400).json({ error: 'Please choose your city.' });
  if (findByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = newProfile({ uid: req.firebase.uid, name, email, phone, role, city });
  user.lastLoginAt = user.createdAt;
  db.data.users.push(user);
  db.save();
  res.status(201).json({ user: publicUser(user) });
});

module.exports = router;
