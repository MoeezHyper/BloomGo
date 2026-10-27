const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { publicUser, ROLES } = require('../utils');
const { FLOWERS, flowerBySlug } = require('../data/flowers');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/stats', (_req, res) => {
  const users = db.data.users;
  const byRole = Object.fromEntries(ROLES.map((r) => [r, users.filter((u) => u.role === r).length]));
  const weekAgo = Date.now() - 7 * 86400000;
  const favCounts = {};
  users.forEach((u) => u.favorites.forEach((s) => (favCounts[s] = (favCounts[s] || 0) + 1)));
  const topFavorites = Object.entries(favCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => ({ slug, count, name: flowerBySlug(slug)?.name, image: flowerBySlug(slug)?.image }));
  res.json({
    totalUsers: users.length,
    byRole,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    newThisWeek: users.filter((u) => new Date(u.createdAt).getTime() > weekAgo).length,
    gardenProfiles: users.filter((u) => u.garden).length,
    flowers: FLOWERS.length,
    topFavorites,
    recent: [...users]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map(publicUser),
  });
});

router.get('/users', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const role = req.query.role;
  let list = db.data.users;
  if (role && ROLES.includes(role)) list = list.filter((u) => u.role === role);
  if (q) list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.includes(q));
  res.json({ users: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicUser) });
});

router.get('/users/:id', (req, res) => {
  const u = db.data.users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(u) });
});

router.patch('/users/:id', (req, res) => {
  const u = db.data.users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'User not found.' });
  if (u.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own admin account here.' });
  const { status, role } = req.body;
  if (status !== undefined) {
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    u.status = status;
  }
  if (role !== undefined) {
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    u.role = role;
    if (role !== 'customer' && role !== 'admin' && !u.professional) {
      u.professional = { skills: [], experienceYears: 0, serviceAreas: [u.city], availableDays: [], hours: '', bio: '', rate: 0 };
    }
  }
  db.save();
  res.json({ user: publicUser(u) });
});

module.exports = router;
