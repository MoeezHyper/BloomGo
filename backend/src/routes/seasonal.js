const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { CITIES, ZONES, cityById, nearestCity } = require('../data/cities');
const { recommend } = require('../services/recommender');
const { cityCalendar, seasonFor, MONTHS } = require('../services/seasons');
const { getWeather } = require('../services/weather');

const router = express.Router();
router.use(optionalAuth);

const resolveCity = (req) =>
  cityById(req.query.city) || cityById(req.user?.garden?.city) || cityById(req.user?.city) || cityById('lahore');

router.get('/cities', (_req, res) => {
  res.json({
    cities: CITIES.map(({ id, name, province, zone, lat, lon }) => ({ id, name, province, zone, zoneLabel: ZONES[zone].label, lat, lon })),
  });
});

router.get('/nearest', (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ error: 'lat and lon are required.' });
  const { city, km } = nearestCity(lat, lon);
  res.json({ city: { id: city.id, name: city.name, province: city.province }, distanceKm: Math.round(km), supported: km < 400 });
});

router.get('/recommendations', (req, res) => {
  const city = resolveCity(req);
  const month = Number(req.query.month) >= 1 && Number(req.query.month) <= 12 ? Number(req.query.month) : new Date().getMonth() + 1;
  // Garden profile drives personalisation; query params let anyone try a space type.
  let garden = req.user?.garden || null;
  if (req.query.space || req.query.sunlight) {
    garden = { ...(garden || {}), ...(req.query.space && { spaceType: req.query.space }), ...(req.query.sunlight && { sunlight: req.query.sunlight }) };
  }
  res.json(recommend({ city, month, garden }));
});

router.get('/calendar', (req, res) => {
  const city = resolveCity(req);
  res.json({
    city: { id: city.id, name: city.name, zoneLabel: ZONES[city.zone].label },
    months: MONTHS,
    temps: city.temps,
    seasons: MONTHS.map((_, i) => seasonFor(i + 1, city.zone)),
    flowers: cityCalendar(city).filter((f) => f.bloom.length > 0),
  });
});

router.get('/weather', async (req, res) => {
  res.json(await getWeather(resolveCity(req)));
});

module.exports = router;
