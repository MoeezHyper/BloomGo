const { FLOWERS } = require('../data/flowers');
const { ZONES } = require('../data/cities');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const wrap = (m) => ((m - 1 + 12) % 12) + 1;

// Season names as people in Pakistan use them, shifted for the hills.
function seasonFor(month, zone) {
  if (zone === 'highland') {
    if ([3, 4, 5].includes(month)) return { id: 'spring', label: 'Spring' };
    if ([6, 7, 8].includes(month)) return { id: 'summer', label: 'Summer' };
    if ([9, 10].includes(month)) return { id: 'autumn', label: 'Autumn' };
    return { id: 'winter', label: 'Winter' };
  }
  if ([12, 1, 2].includes(month)) return { id: 'winter', label: 'Winter' };
  if ([3, 4].includes(month)) return { id: 'spring', label: 'Spring' };
  if ([5, 6].includes(month)) return { id: 'summer', label: 'Summer' };
  if (ZONES[zone]?.monsoon.includes(month)) return { id: 'monsoon', label: 'Monsoon' };
  if (month === 9) return { id: 'summer', label: 'Late summer' };
  return { id: 'autumn', label: 'Autumn' };
}

function effectiveTemps(city, indoor) {
  // Rooms stay within a liveable band regardless of the weather outside.
  return indoor ? city.temps.map((t) => Math.min(30, Math.max(18, t))) : city.temps;
}

function bloomMonths(flower, city, { indoor = false } = {}) {
  const temps = effectiveTemps(city, indoor || flower.indoor);
  const [min, max] = flower.temp;
  return MONTHS.map((_, i) => i + 1).filter((m) => temps[m - 1] >= min && temps[m - 1] <= max);
}

// Sowing/planting window: `lead` months before each bloom window opens.
function sowMonths(flower, bloom) {
  if (bloom.length === 0) return [];
  if (bloom.length === 12) return [2, 3, 9, 10];
  const set = new Set(bloom);
  const starts = bloom.filter((m) => !set.has(wrap(m - 1)));
  const sow = new Set();
  for (const s of starts) {
    sow.add(wrap(s - flower.lead));
    sow.add(wrap(s - flower.lead + 1));
  }
  return [...sow].filter((m) => !set.has(m) || bloom.length > 9).sort((a, b) => a - b);
}

function climateNotes(flower, city) {
  const notes = [];
  if (flower.needsChill && Math.min(...city.temps) > 9) {
    notes.push(`${city.name} winters are too mild for ${flower.name} to re-flower — use pre-chilled bulbs as a one-season display.`);
  }
  if (flower.humiditySensitive && city.zone === 'coastal') {
    notes.push(`Sea humidity in ${city.name} can rot ${flower.name}; grow in gritty soil in a terracotta pot.`);
  }
  if (!flower.indoor && Math.max(...city.temps) >= 34 && flower.temp[1] < 28) {
    notes.push(`Treat as a cool-season plant in ${city.name} — it will fade in the summer heat.`);
  }
  return notes;
}

function flowerCalendar(flower, city, opts) {
  const bloom = bloomMonths(flower, city, opts);
  return { bloom, sow: sowMonths(flower, bloom), notes: climateNotes(flower, city) };
}

function formatMonths(months) {
  if (!months.length) return 'not suited to this climate';
  if (months.length === 12) return 'all year round';
  // Collapse into circular ranges like "Oct – Mar".
  const set = new Set(months);
  const starts = months.filter((m) => !set.has(wrap(m - 1)));
  return starts
    .map((s) => {
      let e = s;
      while (set.has(wrap(e + 1)) && wrap(e + 1) !== s) e = wrap(e + 1);
      return s === e ? MONTHS[s - 1] : `${MONTHS[s - 1]} – ${MONTHS[e - 1]}`;
    })
    .join(', ');
}

function cityCalendar(city) {
  return FLOWERS.map((f) => ({
    slug: f.slug,
    name: f.name,
    localName: f.localName,
    image: f.image,
    category: f.category,
    ...flowerCalendar(f, city),
  }));
}

module.exports = { MONTHS, MONTH_NAMES, seasonFor, bloomMonths, sowMonths, flowerCalendar, formatMonths, cityCalendar };
