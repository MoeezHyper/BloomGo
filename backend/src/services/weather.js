// Live weather from Open-Meteo (free, no API key). Falls back to the city's
// climate averages when offline so the screen always has something useful.
const { ZONES } = require('../data/cities');
const { seasonFor } = require('./seasons');

const cache = new Map();
const TTL = 30 * 60 * 1000;

const CODES = {
  0: ['Clear sky', 'sunny'],
  1: ['Mainly clear', 'sunny'],
  2: ['Partly cloudy', 'partly'],
  3: ['Overcast', 'cloudy'],
  45: ['Fog', 'fog'],
  48: ['Fog', 'fog'],
  51: ['Light drizzle', 'rain'],
  53: ['Drizzle', 'rain'],
  55: ['Heavy drizzle', 'rain'],
  61: ['Light rain', 'rain'],
  63: ['Rain', 'rain'],
  65: ['Heavy rain', 'rain'],
  71: ['Light snow', 'snow'],
  73: ['Snow', 'snow'],
  75: ['Heavy snow', 'snow'],
  80: ['Rain showers', 'rain'],
  81: ['Rain showers', 'rain'],
  82: ['Violent showers', 'storm'],
  95: ['Thunderstorm', 'storm'],
  96: ['Thunderstorm', 'storm'],
  99: ['Thunderstorm', 'storm'],
};
const describe = (code) => {
  const [label, icon] = CODES[code] || ['Fair', 'partly'];
  return { label, icon };
};

async function fetchLive(city) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
    '&timezone=auto&forecast_days=7';
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const d = await res.json();
  return {
    source: 'live',
    current: {
      temp: Math.round(d.current.temperature_2m),
      feelsLike: Math.round(d.current.apparent_temperature),
      humidity: d.current.relative_humidity_2m,
      wind: Math.round(d.current.wind_speed_10m),
      precipitation: d.current.precipitation,
      ...describe(d.current.weather_code),
    },
    daily: d.daily.time.map((date, i) => ({
      date,
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
      rainChance: d.daily.precipitation_probability_max?.[i] ?? 0,
      uv: d.daily.uv_index_max?.[i] ?? 0,
      ...describe(d.daily.weather_code[i]),
    })),
  };
}

function climateEstimate(city) {
  const m = new Date().getMonth();
  const t = city.temps[m];
  const monsoon = ZONES[city.zone].monsoon.includes(m + 1);
  return {
    source: 'climate',
    current: { temp: t, feelsLike: t, humidity: monsoon || city.zone === 'coastal' ? 75 : 45, wind: 10, precipitation: 0, ...describe(monsoon ? 80 : 1) },
    daily: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
      return { date, max: t + 6, min: t - 6, rainChance: monsoon ? 60 : 10, uv: t > 25 ? 9 : 5, ...describe(monsoon ? 80 : 1) };
    }),
  };
}

function buildTips(w, city) {
  const tips = [];
  const { current, daily } = w;
  const week = daily.slice(0, 3);
  const maxT = Math.max(...week.map((d) => d.max));
  const minT = Math.min(...week.map((d) => d.min));
  const rainSoon = week.some((d) => d.rainChance >= 60);
  const uv = Math.max(...week.map((d) => d.uv));

  if (maxT >= 40) tips.push({ icon: 'thermometer', tone: 'alert', title: 'Heatwave care', text: `Up to ${maxT}°C ahead. Water at dawn and dusk, mulch pots and move delicate plants under a green shade net.` });
  else if (maxT >= 34) tips.push({ icon: 'sunny', tone: 'warm', title: 'Hot days', text: 'Water deeply early in the morning. Pots on rooftops may need a second evening drink.' });
  if (minT <= 3) tips.push({ icon: 'snow', tone: 'alert', title: 'Frost risk', text: `Nights near ${minT}°C. Cover tender plants (hibiscus, jasmine, bougainvillea) or bring pots indoors.` });
  else if (minT <= 8) tips.push({ icon: 'cloudy-night', tone: 'cool', title: 'Cold nights', text: 'Water before noon so roots aren’t wet overnight, and cut back on feeding.' });
  if (rainSoon) tips.push({ icon: 'rainy', tone: 'cool', title: 'Rain expected', text: 'Skip watering, check that pots drain freely and stake tall stems before the wind picks up.' });
  if (current.humidity >= 75) tips.push({ icon: 'water', tone: 'cool', title: 'Humid air', text: 'Fungal diseases spread fast. Space plants out, water at soil level and watch for mildew.' });
  if (current.wind >= 30) tips.push({ icon: 'flag', tone: 'warm', title: 'Windy', text: 'Secure hanging baskets and climbers; rooftop pots dry out quicker in wind.' });
  if (uv >= 9) tips.push({ icon: 'glasses', tone: 'warm', title: 'Very high UV', text: 'Shade-lovers like begonia and peace lily should stay out of direct midday sun.' });
  if (current.humidity < 30) tips.push({ icon: 'leaf', tone: 'warm', title: 'Dry air', text: 'Mist indoor plants and group pots together to raise humidity.' });

  const season = seasonFor(new Date().getMonth() + 1, city.zone);
  const winter = {
    highland: 'Winter in the hills: most beds rest. Protect pots from frost and plan spring bulbs.',
    coastal: 'Mild coastal winters are peak bloom time — deadhead annuals weekly and feed roses every 2–3 weeks.',
  }[city.zone] ?? 'Winter is peak bloom time in the plains — deadhead annuals weekly and feed roses every 2–3 weeks.';
  const seasonal = {
    winter,
    spring: 'Spring is the time to repot, prune summer shrubs and sow summer annuals like zinnia and sunflower.',
    summer: 'In summer, mulch generously and water early. Pause pruning and heavy feeding until the heat breaks.',
    monsoon: 'Monsoon is great for cuttings and planting shrubs, but watch drainage and spray neem against pests.',
    autumn: 'Autumn is sowing season — start pansy, petunia, sweet pea and calendula seeds now.',
  }[season.id];
  tips.push({ icon: 'calendar', tone: 'neutral', title: `${season.label} in ${city.name}`, text: seasonal });
  if (tips.length === 1) tips.unshift({ icon: 'happy', tone: 'neutral', title: 'Perfect growing weather', text: 'Mild conditions — a good week for planting, repotting and feeding.' });
  return tips;
}

async function getWeather(city) {
  const hit = cache.get(city.id);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  let w;
  try {
    w = await fetchLive(city);
  } catch (e) {
    console.warn('[weather] live fetch failed, using climate averages:', e.message);
    w = climateEstimate(city);
  }
  const value = { city: { id: city.id, name: city.name }, ...w, tips: buildTips(w, city) };
  if (w.source === 'live') cache.set(city.id, { at: Date.now(), value });
  return value;
}

module.exports = { getWeather };
