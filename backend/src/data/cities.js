// Approximate monthly mean temperatures (°C, Jan..Dec) used to match flowers to
// a city's climate. Values are rounded long-term averages.
const ZONES = {
  plains: { label: 'Hot plains', monsoon: [7, 8, 9] },
  coastal: { label: 'Coastal', monsoon: [7, 8] },
  foothills: { label: 'Potohar & foothills', monsoon: [7, 8, 9] },
  highland: { label: 'Highlands', monsoon: [7, 8] },
};

const CITIES = [
  { id: 'lahore', name: 'Lahore', province: 'Punjab', lat: 31.5497, lon: 74.3436, zone: 'plains', temps: [13, 16, 21, 27, 32, 34, 31, 31, 30, 26, 20, 15] },
  { id: 'karachi', name: 'Karachi', province: 'Sindh', lat: 24.8607, lon: 67.0011, zone: 'coastal', temps: [19, 21, 25, 28, 30, 31, 30, 29, 29, 28, 24, 20] },
  { id: 'islamabad', name: 'Islamabad', province: 'ICT', lat: 33.6844, lon: 73.0479, zone: 'foothills', temps: [10, 12, 17, 23, 28, 32, 30, 29, 27, 22, 16, 12] },
  { id: 'rawalpindi', name: 'Rawalpindi', province: 'Punjab', lat: 33.5651, lon: 73.0169, zone: 'foothills', temps: [10, 13, 18, 23, 29, 32, 30, 29, 28, 23, 17, 12] },
  { id: 'faisalabad', name: 'Faisalabad', province: 'Punjab', lat: 31.4504, lon: 73.135, zone: 'plains', temps: [13, 16, 22, 28, 33, 35, 33, 32, 31, 26, 20, 15] },
  { id: 'multan', name: 'Multan', province: 'Punjab', lat: 30.1575, lon: 71.5249, zone: 'plains', temps: [13, 17, 23, 29, 34, 36, 34, 33, 31, 27, 20, 15] },
  { id: 'peshawar', name: 'Peshawar', province: 'Khyber Pakhtunkhwa', lat: 34.0151, lon: 71.5249, zone: 'plains', temps: [11, 13, 18, 24, 29, 33, 33, 31, 29, 24, 18, 13] },
  { id: 'quetta', name: 'Quetta', province: 'Balochistan', lat: 30.1798, lon: 66.975, zone: 'highland', temps: [4, 6, 11, 16, 21, 25, 27, 25, 20, 14, 9, 5] },
  { id: 'hyderabad', name: 'Hyderabad', province: 'Sindh', lat: 25.396, lon: 68.3578, zone: 'plains', temps: [18, 21, 26, 31, 34, 34, 32, 31, 30, 28, 23, 19] },
  { id: 'sialkot', name: 'Sialkot', province: 'Punjab', lat: 32.4945, lon: 74.5229, zone: 'plains', temps: [12, 15, 20, 26, 31, 33, 31, 30, 29, 24, 18, 13] },
  { id: 'bahawalpur', name: 'Bahawalpur', province: 'Punjab', lat: 29.3956, lon: 71.6836, zone: 'plains', temps: [14, 17, 23, 29, 34, 36, 34, 33, 31, 27, 21, 15] },
  { id: 'abbottabad', name: 'Abbottabad', province: 'Khyber Pakhtunkhwa', lat: 34.1688, lon: 73.2215, zone: 'foothills', temps: [7, 9, 13, 18, 23, 26, 25, 24, 22, 18, 13, 9] },
  { id: 'swat', name: 'Swat', province: 'Khyber Pakhtunkhwa', lat: 34.7717, lon: 72.3601, zone: 'foothills', temps: [7, 9, 14, 19, 24, 28, 28, 27, 24, 19, 13, 9] },
  { id: 'murree', name: 'Murree', province: 'Punjab', lat: 33.907, lon: 73.3943, zone: 'highland', temps: [3, 4, 8, 13, 18, 21, 20, 19, 17, 13, 9, 5] },
  { id: 'gilgit', name: 'Gilgit', province: 'Gilgit-Baltistan', lat: 35.9208, lon: 74.3144, zone: 'highland', temps: [2, 5, 11, 16, 21, 26, 28, 27, 22, 15, 8, 3] },
  { id: 'gwadar', name: 'Gwadar', province: 'Balochistan', lat: 25.1216, lon: 62.3254, zone: 'coastal', temps: [19, 20, 23, 27, 30, 31, 30, 29, 28, 27, 24, 21] },
];

const cityById = (id) => CITIES.find((c) => c.id === id);

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function nearestCity(lat, lon) {
  let best = null;
  for (const c of CITIES) {
    const km = haversineKm(lat, lon, c.lat, c.lon);
    if (!best || km < best.km) best = { city: c, km };
  }
  return best;
}

module.exports = { CITIES, ZONES, cityById, nearestCity };
