const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { publicUser, pick, trimStr } = require('../utils');
const { cityById } = require('../data/cities');

const router = express.Router();
router.use(requireAuth);

const SPACE_TYPES = ['indoor', 'balcony', 'rooftop', 'lawn'];
const SIZES = ['small', 'medium', 'large'];
const SUN = ['full', 'partial', 'shade'];
const EXPERIENCE = ['beginner', 'intermediate', 'expert'];
const WATER = ['easy', 'limited'];

router.patch('/', (req, res) => {
  const u = req.user;
  if (req.body.name !== undefined) {
    const name = trimStr(req.body.name, 80);
    if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    u.name = name;
  }
  if (req.body.phone !== undefined) u.phone = trimStr(req.body.phone, 30);
  if (req.body.city !== undefined) {
    if (!cityById(req.body.city)) return res.status(400).json({ error: 'Unknown city.' });
    u.city = req.body.city;
  }
  if (req.body.avatarColor !== undefined) u.avatarColor = trimStr(req.body.avatarColor, 10);
  db.save();
  res.json({ user: publicUser(u) });
});

// ---- Addresses ----
function cleanAddress(body) {
  const a = {
    label: trimStr(body.label, 30) || 'Home',
    line1: trimStr(body.line1, 160),
    area: trimStr(body.area, 80),
    city: body.city,
    notes: trimStr(body.notes, 200),
  };
  if (a.line1.length < 3) return { error: 'Please enter the street address.' };
  if (!cityById(a.city)) return { error: 'Please choose a city.' };
  return { address: a };
}

router.get('/addresses', (req, res) => res.json({ addresses: req.user.addresses }));

router.post('/addresses', (req, res) => {
  const { error, address } = cleanAddress(req.body);
  if (error) return res.status(400).json({ error });
  const list = req.user.addresses;
  const makeDefault = !!req.body.isDefault || list.length === 0;
  if (makeDefault) list.forEach((a) => (a.isDefault = false));
  list.push({ id: db.newId(), ...address, isDefault: makeDefault });
  db.save();
  res.status(201).json({ addresses: list });
});

router.put('/addresses/:id', (req, res) => {
  const list = req.user.addresses;
  const existing = list.find((a) => a.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Address not found.' });
  const { error, address } = cleanAddress(req.body);
  if (error) return res.status(400).json({ error });
  Object.assign(existing, address);
  if (req.body.isDefault) list.forEach((a) => (a.isDefault = a.id === existing.id));
  db.save();
  res.json({ addresses: list });
});

router.delete('/addresses/:id', (req, res) => {
  const u = req.user;
  const removed = u.addresses.find((a) => a.id === req.params.id);
  u.addresses = u.addresses.filter((a) => a.id !== req.params.id);
  if (removed?.isDefault && u.addresses[0]) u.addresses[0].isDefault = true;
  db.save();
  res.json({ addresses: u.addresses });
});

// ---- Garden profile (customers) ----
router.put('/garden', requireRole('customer'), (req, res) => {
  const g = pick(req.body, ['spaceType', 'size', 'sunlight', 'waterAccess', 'experience', 'hasPets', 'preferredColors', 'goals', 'city']);
  if (!SPACE_TYPES.includes(g.spaceType)) return res.status(400).json({ error: 'Choose where you garden.' });
  if (!SIZES.includes(g.size)) return res.status(400).json({ error: 'Choose your space size.' });
  if (!SUN.includes(g.sunlight)) return res.status(400).json({ error: 'Choose how much sun your space gets.' });
  if (!EXPERIENCE.includes(g.experience)) return res.status(400).json({ error: 'Choose your experience level.' });
  if (g.waterAccess && !WATER.includes(g.waterAccess)) return res.status(400).json({ error: 'Invalid water access.' });
  if (!cityById(g.city)) return res.status(400).json({ error: 'Choose your city.' });
  req.user.garden = {
    ...g,
    hasPets: !!g.hasPets,
    preferredColors: Array.isArray(g.preferredColors) ? g.preferredColors.slice(0, 8) : [],
    goals: Array.isArray(g.goals) ? g.goals.slice(0, 6) : [],
    updatedAt: new Date().toISOString(),
  };
  db.save();
  res.json({ user: publicUser(req.user) });
});

// ---- Professional profile (gardeners & decorators) ----
router.put('/professional', requireRole('gardener', 'decorator'), (req, res) => {
  const p = pick(req.body, ['skills', 'experienceYears', 'serviceAreas', 'availableDays', 'hours', 'bio', 'rate']);
  req.user.professional = {
    skills: Array.isArray(p.skills) ? p.skills.map((s) => trimStr(s, 40)).filter(Boolean).slice(0, 12) : [],
    experienceYears: Math.max(0, Math.min(60, Number(p.experienceYears) || 0)),
    serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas.filter((c) => cityById(c)) : [],
    availableDays: Array.isArray(p.availableDays) ? p.availableDays.slice(0, 7) : [],
    hours: trimStr(p.hours, 40),
    bio: trimStr(p.bio, 400),
    rate: Math.max(0, Number(p.rate) || 0),
  };
  db.save();
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
