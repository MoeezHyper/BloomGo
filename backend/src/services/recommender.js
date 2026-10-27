const { FLOWERS } = require('../data/flowers');
const { flowerCalendar, formatMonths, MONTH_NAMES, seasonFor } = require('./seasons');
const { ZONES } = require('../data/cities');

// Phrases that read naturally after "Grows well …" / "Not ideal …".
const SPACE_WHERE = { indoor: 'indoors', balcony: 'on a balcony', rooftop: 'on a rooftop', lawn: 'in lawn beds' };
const SUN_LABEL = { full: '6+ hours of sun', partial: '3–6 hours of sun', shade: 'bright shade' };
const DEFAULT_GARDEN = { spaceType: 'balcony', sunlight: 'full', experience: 'beginner', hasPets: false, preferredColors: [] };

const wrap = (m) => ((m - 1 + 12) % 12) + 1;

function sunScore(need, have) {
  if (need === have) return [25, `Loves ${SUN_LABEL[need]} — a perfect match for your space`];
  if (need === 'partial' && have === 'full') return [17, 'Give it some afternoon shade on hot days'];
  if (need === 'full' && have === 'partial') return [11, 'Will flower a little less with partial sun'];
  if (need === 'shade' && have === 'partial') return [18, 'Happy with gentle, filtered light'];
  if (need === 'shade' && have === 'full') return [5, null];
  if (need === 'partial' && have === 'shade') return [10, null];
  return [0, null];
}

function scoreFlower(flower, city, month, garden) {
  const g = { ...DEFAULT_GARDEN, ...(garden || {}) };
  const indoor = g.spaceType === 'indoor';
  const cal = flowerCalendar(flower, city, { indoor });
  const reasons = [];
  const warnings = [...cal.notes];
  let score = 0;
  let status = 'off';

  if (cal.bloom.includes(month)) {
    status = 'blooming';
    if (cal.bloom.includes(wrap(month + 1))) {
      score += 40;
      reasons.push(`In bloom in ${city.name} right now`);
    } else {
      score += 28;
      reasons.push(`Final weeks of its season in ${city.name}`);
    }
  } else if (cal.sow.includes(month)) {
    score += 32;
    status = 'sow';
    const firstBloom = cal.bloom.find((m) => m === wrap(month + flower.lead)) || cal.bloom[0];
    reasons.push(`Sow now for flowers around ${MONTH_NAMES[firstBloom - 1]}`);
  } else if (cal.bloom.includes(wrap(month + 1))) {
    score += 20;
    status = 'soon';
    reasons.push(`Starts flowering next month`);
  }

  const [sun, sunReason] = indoor ? (flower.indoor ? [25, 'Made for bright indoor rooms'] : [4, null]) : sunScore(flower.sunlight, g.sunlight);
  score += sun;
  if (sunReason) reasons.push(sunReason);
  else if (sun < 10) warnings.push(flower.sunlight === 'full' ? 'Needs more direct sun than your space gets' : 'Prefers more shade than your space offers');

  if (flower.spaces.includes(g.spaceType)) {
    score += 20;
    reasons.push(`Grows well ${SPACE_WHERE[g.spaceType]}`);
  } else if (flower.potFriendly && g.spaceType !== 'indoor') {
    score += 10;
  } else {
    warnings.push(`Not ideal ${SPACE_WHERE[g.spaceType]}`);
  }
  if (g.size === 'small' && flower.heightCm > 150) {
    score -= 8;
    warnings.push('Grows tall — needs room or a trellis');
  }

  const diff = { easy: 0, moderate: 1, expert: 2 }[flower.difficulty];
  const exp = { beginner: 0, intermediate: 1, expert: 2 }[g.experience] ?? 0;
  if (diff <= exp) {
    score += 10;
    if (flower.difficulty === 'easy') reasons.push('Easy to grow — great for your experience level');
  } else if (diff - exp === 1) score += 5;
  else warnings.push('Best for experienced gardeners');

  if (g.preferredColors?.length && flower.colors.some((c) => g.preferredColors.includes(c))) {
    score += 5;
    reasons.push('Comes in your favourite colours');
  }
  if (g.hasPets && flower.toxicToPets) {
    score -= 15;
    warnings.push('Toxic to pets — keep out of reach');
  }
  if (g.goals?.includes('fragrance') && flower.fragrant) {
    score += 3;
    reasons.push('Beautifully fragrant');
  }

  return {
    slug: flower.slug,
    name: flower.name,
    localName: flower.localName,
    image: flower.image,
    category: flower.category,
    difficulty: flower.difficulty,
    sunlight: flower.sunlight,
    colors: flower.colors,
    match: Math.max(0, Math.min(100, Math.round(score))),
    status,
    bloomWindow: formatMonths(cal.bloom),
    sowWindow: formatMonths(cal.sow),
    reasons,
    warnings,
  };
}

function recommend({ city, month, garden }) {
  const scored = FLOWERS.map((f) => scoreFlower(f, city, month, garden)).sort((a, b) => b.match - a.match);
  return {
    city: { id: city.id, name: city.name, province: city.province, zone: city.zone, zoneLabel: ZONES[city.zone].label },
    month,
    monthName: MONTH_NAMES[month - 1],
    season: seasonFor(month, city.zone),
    avgTemp: city.temps[month - 1],
    personalised: !!garden,
    topPicks: scored.filter((s) => s.status !== 'off').slice(0, 6),
    blooming: scored.filter((s) => s.status === 'blooming'),
    sowNow: scored.filter((s) => s.status === 'sow'),
    comingSoon: scored.filter((s) => s.status === 'soon'),
  };
}

module.exports = { recommend, scoreFlower };
