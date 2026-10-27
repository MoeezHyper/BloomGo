const express = require('express');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { FLOWERS, flowerBySlug } = require('../data/flowers');
const { cityById } = require('../data/cities');
const { flowerCalendar, formatMonths, MONTHS } = require('../services/seasons');

const router = express.Router();

const summary = (f) => ({
  slug: f.slug,
  name: f.name,
  localName: f.localName,
  scientificName: f.scientificName,
  category: f.category,
  colors: f.colors,
  image: f.image,
  tagline: f.tagline,
  difficulty: f.difficulty,
  sunlight: f.sunlight,
  water: f.water,
  fragrant: f.fragrant,
  toxicToPets: f.toxicToPets,
  spaces: f.spaces,
});

const userCity = (req) => cityById(req.query.city) || cityById(req.user?.garden?.city) || cityById(req.user?.city) || cityById('lahore');

router.get('/meta/filters', (_req, res) => {
  const uniq = (arr) => [...new Set(arr)];
  res.json({
    categories: uniq(FLOWERS.map((f) => f.category)),
    colors: uniq(FLOWERS.flatMap((f) => f.colors)),
    sunlight: ['full', 'partial', 'shade'],
    difficulty: ['easy', 'moderate', 'expert'],
    spaces: ['indoor', 'balcony', 'rooftop', 'lawn'],
  });
});

// Search + filters: q, category, color, sunlight, difficulty, space, petSafe, fragrant, inSeason
router.get('/', optionalAuth, (req, res) => {
  const { q, category, color, sunlight, difficulty, space, petSafe, fragrant, inSeason } = req.query;
  const term = String(q || '').trim().toLowerCase();
  const city = userCity(req);
  const month = new Date().getMonth() + 1;
  let list = FLOWERS;
  if (term) {
    list = list.filter((f) =>
      [f.name, f.localName, f.scientificName, f.tagline, f.category, ...f.colors].some((s) => s && s.toLowerCase().includes(term))
    );
  }
  if (category) list = list.filter((f) => f.category === category);
  if (color) list = list.filter((f) => f.colors.includes(color));
  if (sunlight) list = list.filter((f) => f.sunlight === sunlight);
  if (difficulty) list = list.filter((f) => f.difficulty === difficulty);
  if (space) list = list.filter((f) => f.spaces.includes(space));
  if (petSafe === 'true') list = list.filter((f) => !f.toxicToPets);
  if (fragrant === 'true') list = list.filter((f) => f.fragrant);

  const favs = new Set(req.user?.favorites || []);
  let flowers = list.map((f) => ({
    ...summary(f),
    inSeason: flowerCalendar(f, city).bloom.includes(month),
    isFavorite: favs.has(f.slug),
  }));
  if (inSeason === 'true') flowers = flowers.filter((f) => f.inSeason);
  res.json({ city: { id: city.id, name: city.name }, total: flowers.length, flowers });
});

router.get('/favorites/list', requireAuth, (req, res) => {
  const flowers = req.user.favorites.map(flowerBySlug).filter(Boolean).map((f) => ({ ...summary(f), isFavorite: true }));
  res.json({ flowers });
});

router.post('/:slug/favorite', requireAuth, (req, res) => {
  const f = flowerBySlug(req.params.slug);
  if (!f) return res.status(404).json({ error: 'Flower not found.' });
  const u = req.user;
  const isFavorite = !u.favorites.includes(f.slug);
  u.favorites = isFavorite ? [...u.favorites, f.slug] : u.favorites.filter((s) => s !== f.slug);
  db.save();
  res.json({ isFavorite, favorites: u.favorites });
});

router.get('/:slug', optionalAuth, (req, res) => {
  const f = flowerBySlug(req.params.slug);
  if (!f) return res.status(404).json({ error: 'Flower not found.' });
  const city = userCity(req);
  const cal = flowerCalendar(f, city);
  const month = new Date().getMonth() + 1;
  const related = FLOWERS.filter((o) => o.slug !== f.slug && (o.category === f.category || o.colors.some((c) => f.colors.includes(c))))
    .slice(0, 6)
    .map(summary);
  res.json({
    flower: {
      ...f,
      isFavorite: !!req.user?.favorites.includes(f.slug),
      local: {
        city: { id: city.id, name: city.name },
        bloomMonths: cal.bloom,
        sowMonths: cal.sow,
        bloomWindow: formatMonths(cal.bloom),
        sowWindow: formatMonths(cal.sow),
        inSeason: cal.bloom.includes(month),
        notes: cal.notes,
      },
    },
    months: MONTHS,
    related,
  });
});

module.exports = router;
