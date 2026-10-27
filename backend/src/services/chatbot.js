// Rule-based plant-care assistant built on the flower knowledge base.
// It detects which flower the user means (or remembers it from context) and
// what they want to know, then answers from the care guide for their city.
const { FLOWERS, flowerBySlug } = require('../data/flowers');
const { cityById } = require('../data/cities');
const { flowerCalendar, formatMonths } = require('./seasons');
const { recommend } = require('./recommender');

// A trailing * means "prefix match" (fertili* -> fertiliser/fertilizer); other
// single words must match whole, so "pet" does not fire on "petunia".
const INTENTS = [
  { id: 'greeting', words: ['hi', 'hello', 'hey', 'salam', 'assalam*', 'aoa', 'good morning', 'good evening'] },
  { id: 'thanks', words: ['thanks', 'thank you', 'shukriya', 'great', 'awesome'] },
  { id: 'recommend', words: ['recommend*', 'suggest*', 'which flower', 'what should i plant', 'what to plant', 'best flower*', 'what can i grow', 'ideas'] },
  { id: 'pets', words: ['pet', 'pets', 'cat', 'cats', 'dog', 'dogs', 'toxic', 'poison*', 'safe for', 'child', 'children', 'kids'] },
  { id: 'season', words: ['when', 'season*', 'month*', 'plant now', 'time to', 'mausam', 'bloom', 'blooms', 'flowering time', 'sow', 'sowing'] },
  { id: 'problem', words: ['yellow*', 'brown*', 'spot*', 'wilt*', 'droop*', 'dying', 'dead', 'rot', 'rotting', 'mildew', 'not flowering', 'no flower*', 'no bloom*', 'drop*', 'curl*', 'leggy', 'sick', 'problem*', 'issue*', 'disease*', 'fung*', 'white powder'] },
  { id: 'pests', words: ['pest*', 'bug*', 'insect*', 'aphid*', 'mealy*', 'mite*', 'whitefl*', 'keeda', 'ants', 'caterpillar*', 'thrips'] },
  { id: 'water', words: ['water*', 'pani', 'how often', 'thirsty', 'irrigat*'] },
  { id: 'light', words: ['sun', 'sunlight', 'sunny', 'light', 'shade', 'dhoop', 'window', 'bright'] },
  { id: 'soil', words: ['soil', 'mitti', 'potting', 'compost', 'repot*', 'pot mix', 'drainage'] },
  { id: 'feeding', words: ['fertili*', 'feed*', 'khad', 'nutrient*', 'npk', 'manure'] },
  { id: 'pruning', words: ['prun*', 'cut back', 'deadhead*', 'trim*', 'pinch*'] },
  { id: 'propagation', words: ['propagat*', 'cutting*', 'seed*', 'grow from', 'multiply'] },
  { id: 'precautions', words: ['precaution*', 'careful', 'avoid', 'warning*', 'danger*', 'mistake*'] },
  { id: 'overview', words: ['tell me about', 'about', 'info', 'what is', 'describe', 'care guide', 'how to grow', 'how to care'] },
];

const GENERAL_PROBLEMS = [
  { keys: ['yellow*'], title: 'Yellow leaves', text: 'Most often overwatering. Let the top 2–3 cm of soil dry before watering and make sure the pot drains. If only new leaves are yellow with green veins, it’s iron deficiency — use a feed with chelated iron. Old lower leaves yellowing slowly is normal.' },
  { keys: ['brown tip', 'brown edge', 'crispy'], title: 'Brown, crispy tips', text: 'Usually underwatering, dry AC air or salt build-up from tap water. Water deeply, flush pots monthly and mist indoor plants.' },
  { keys: ['rot', 'rotting', 'mushy', 'black stem'], title: 'Root or stem rot', text: 'Caused by soggy soil. Remove the plant, trim black/mushy roots, repot in fresh, gritty mix and water only when dry.' },
  { keys: ['mildew', 'white powder', 'powder*'], title: 'Powdery mildew', text: 'Spray 1 tbsp baking soda + a few drops of liquid soap in 1 L water, or neem oil, every 5–7 days. Water in the morning at soil level and improve airflow.' },
  { keys: ['aphid*'], title: 'Aphids', text: 'Blast them off with water, then spray soapy water (1 tsp soap/L) or neem oil every 3 days for two weeks.' },
  { keys: ['mealy*', 'white cotton'], title: 'Mealybugs', text: 'Dab clusters with cotton dipped in rubbing alcohol, then spray neem oil weekly. Check leaf joints and under leaves.' },
  { keys: ['mite*', 'webs', 'webbing'], title: 'Spider mites', text: 'Thrive in hot, dry air. Hose the undersides of leaves, raise humidity and spray neem oil every 4 days.' },
  { keys: ['whitefl*'], title: 'Whiteflies', text: 'Hang yellow sticky traps and spray neem oil on leaf undersides every 5 days.' },
  { keys: ['not flowering', 'no flower*', 'no bloom*', 'not blooming'], title: 'Not flowering', text: 'Common causes: too little sun, too much nitrogen fertiliser, or the wrong season. Move to a sunnier spot and switch to a potash/phosphorus-rich feed.' },
  { keys: ['wilt*', 'droop*'], title: 'Wilting', text: 'Check the soil: dry means thirsty — water deeply. Wet but wilting means root rot — let it dry and check the roots. Midday wilting in heat that recovers by evening is normal.' },
  { keys: ['leggy', 'stretch*'], title: 'Leggy growth', text: 'The plant is reaching for light. Move it to a brighter spot and pinch stems back by a third to encourage bushier growth.' },
  { keys: ['spot*'], title: 'Leaf spots', text: 'Usually fungal. Remove spotted leaves, avoid wetting foliage and spray neem oil or a copper fungicide weekly.' },
];

const norm = (s) => ` ${s.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ')} `;
const has = (text, word) => {
  if (word.endsWith('*')) return new RegExp(`\\b${word.slice(0, -1)}`).test(text);
  if (word.includes(' ')) return text.includes(word);
  return new RegExp(`\\b${word}\\b`).test(text);
};
const findProblem = (text) => GENERAL_PROBLEMS.find((g) => g.keys.some((k) => has(text, k)));

const lastWord = (f) => f.name.split(' ').slice(-1)[0];
// "Jasmine" should find Arabian Jasmine, but "daisy" is ambiguous, so only use
// a flower's last name-word as an alias when no other flower shares it.
const ALIASES = new Map(FLOWERS.map((f) => [f.slug, FLOWERS.filter((o) => lastWord(o) === lastWord(f)).length === 1 ? lastWord(f) : null]));

function findFlower(text) {
  let best = null;
  for (const f of FLOWERS) {
    const names = [f.name, f.localName, f.slug.replace(/-/g, ' '), f.scientificName.split(' ')[0], ALIASES.get(f.slug)]
      .filter(Boolean)
      .map((n) => n.toLowerCase());
    for (const n of names) {
      if (n.length < 3) continue;
      if (text.includes(` ${n} `) || text.includes(` ${n}s `) || text.includes(` ${n}es `)) {
        if (!best || n.length > best.len) best = { flower: f, len: n.length };
      }
    }
  }
  return best?.flower || null;
}

function detectIntents(text) {
  return INTENTS.filter((i) => i.words.some((w) => has(text, w))).map((i) => i.id);
}

const flowerCard = (f) => ({ slug: f.slug, name: f.name, localName: f.localName, image: f.image });

function suggestionsFor(f) {
  if (!f) return ['What should I plant this month?', 'Why are my leaves turning yellow?', 'How do I get rid of aphids?', 'Pet-safe flowers'];
  return [`How often should I water ${f.name}?`, `When to plant ${f.name}?`, `Is ${f.name} safe for pets?`, `${f.name} problems`];
}

function answerForFlower(f, intents, text, city) {
  const lines = [];
  const name = f.name;
  const cal = flowerCalendar(f, city);
  const want = (id) => intents.includes(id);

  if (want('water')) lines.push(`💧 Watering ${name}: ${f.care.water}`);
  if (want('light')) lines.push(`☀️ Light: ${f.care.light}`);
  if (want('soil')) lines.push(`🪴 Soil: ${f.care.soil}`);
  if (want('feeding')) lines.push(`🌱 Feeding: ${f.care.feeding}`);
  if (want('pruning')) lines.push(`✂️ Pruning: ${f.care.pruning}`);
  if (want('propagation')) lines.push(`🌿 Propagation: ${f.care.propagation}`);
  if (want('season')) {
    lines.push(`📅 In ${city.name}, ${name} flowers ${formatMonths(cal.bloom)}. Best time to sow/plant: ${formatMonths(cal.sow)}.`);
    cal.notes.forEach((n) => lines.push(`Note: ${n}`));
  }
  if (want('pets')) {
    lines.push(
      f.toxicToPets
        ? `⚠️ ${name} is toxic to pets. Keep it out of reach of cats, dogs and small children.`
        : `✅ ${name} is generally considered safe around pets — but discourage nibbling anyway.`
    );
  }
  if (want('precautions')) lines.push(`Precautions for ${name}:\n• ${f.precautions.join('\n• ')}`);
  if (want('problem') || want('pests')) {
    const matched = f.problems.filter((p) => p.issue.toLowerCase().split(/[\s()]+/).some((w) => w.length > 3 && text.includes(w.slice(0, 5))));
    const general = findProblem(text);
    if (matched.length) matched.forEach((p) => lines.push(`🩺 ${p.issue}: ${p.fix}`));
    else if (general) lines.push(`🩺 ${general.title} on ${name}: ${general.text}`);
    else lines.push(`Common ${name} problems:\n${f.problems.map((p) => `• ${p.issue} — ${p.fix}`).join('\n')}`);
  }
  if (!lines.length) {
    lines.push(
      `🌸 ${name}${f.localName && f.localName !== f.name ? ` (${f.localName})` : ''} — ${f.tagline}`,
      `${f.description}`,
      `Quick care: ${f.sunlight === 'full' ? 'full sun' : f.sunlight === 'partial' ? 'partial sun' : 'bright shade'}, ${f.water} water, ${f.difficulty} to grow.`,
      `In ${city.name} it flowers ${formatMonths(cal.bloom)}.`
    );
  }
  return lines.join('\n\n');
}

function reply({ message, context = {}, user }) {
  const text = norm(message || '');
  const intents = detectIntents(text);
  const cityId = user?.garden?.city || user?.city || 'lahore';
  const city = cityById(cityId) || cityById('lahore');
  const mentioned = findFlower(text);
  const flower = mentioned || (context.flowerSlug ? flowerBySlug(context.flowerSlug) : null);
  const firstName = user?.name?.split(' ')[0];

  if (!mentioned && intents.includes('greeting') && intents.length === 1) {
    return {
      reply: `Assalam-o-Alaikum${firstName ? `, ${firstName}` : ''}! 🌿 I’m your plant-care assistant. Ask me about watering, sunlight, pests, or what to plant this season in ${city.name}.`,
      suggestions: suggestionsFor(null),
      context: {},
    };
  }
  if (intents.includes('thanks') && intents.length === 1 && !mentioned) {
    return { reply: 'Happy gardening! 🌼 Ask me anything else whenever you need.', suggestions: suggestionsFor(flower), context: { flowerSlug: flower?.slug } };
  }

  if (intents.includes('recommend') || (intents.includes('season') && !flower)) {
    const month = new Date().getMonth() + 1;
    const rec = recommend({ city, month, garden: user?.garden });
    const petSafe = has(text, 'pet') || has(text, 'pets');
    const ok = (r) => !petSafe || !flowerBySlug(r.slug).toxicToPets;
    // Mix what is flowering now with what to sow now for later colour.
    const list = [...rec.blooming.filter(ok).slice(0, 2), ...rec.sowNow.filter(ok).slice(0, 2)];
    const line = (r) => `• ${r.name} (${r.match}% match) — ${r.status === 'sow' ? r.reasons[0] : r.reasons[1] || r.reasons[0]}`;
    return {
      reply:
        `Here’s what I’d grow in ${city.name} this ${rec.season.label.toLowerCase()} (${rec.monthName}, avg ${rec.avgTemp}°C)${petSafe ? ', all pet-friendly' : ''}:\n\n` +
        list.map(line).join('\n') +
        (user?.garden ? '' : '\n\nTip: complete your garden profile for personalised picks.'),
      flowers: list.map((r) => flowerCard(flowerBySlug(r.slug))),
      suggestions: list.slice(0, 2).map((r) => `How do I care for ${r.name}?`).concat(['What can I sow this month?']),
      context: {},
    };
  }

  if (intents.includes('pets') && !flower) {
    const safe = FLOWERS.filter((f) => !f.toxicToPets).slice(0, 8);
    return {
      reply: `Pet-friendly flowers include:\n• ${safe.map((f) => f.name).join('\n• ')}\n\nAvoid lilies (very dangerous for cats), chrysanthemum, periwinkle, sweet pea and plumeria if you have pets.`,
      flowers: safe.slice(0, 4).map(flowerCard),
      suggestions: suggestionsFor(null),
      context: {},
    };
  }

  if (flower) {
    return {
      reply: answerForFlower(flower, intents, text, city),
      flowers: mentioned ? [flowerCard(flower)] : [],
      suggestions: suggestionsFor(flower),
      context: { flowerSlug: flower.slug },
    };
  }

  const general = findProblem(text);
  if (general) {
    return {
      reply: `🩺 ${general.title}\n\n${general.text}\n\nTell me which plant it is for more specific advice.`,
      suggestions: suggestionsFor(null),
      context: {},
    };
  }

  const generic = {
    water: 'Most flowering plants like to dry slightly between waterings. Push a finger 2–3 cm into the soil — water only if it feels dry. Water early in the morning, at the base, not on the leaves.',
    light: 'Flowering plants generally need 6+ hours of direct sun. Shade-tolerant bloomers include begonia, peace lily, anthurium and orchids.',
    soil: 'A good all-round mix: 40% garden soil, 30% compost, 20% coco-peat and 10% sand or perlite for drainage.',
    feeding: 'Feed every 2–3 weeks while plants are flowering. Use a balanced feed for leaves and a potash-rich feed (like banana-peel tea) for flowers.',
    pruning: 'Deadhead faded flowers weekly to keep plants blooming, and prune shrubs at the end of their flowering season.',
    pests: 'Neem oil (5 ml + 2 ml liquid soap per litre of water) sprayed every 5–7 days controls most common pests: aphids, mealybugs, whiteflies and mites.',
  };
  const g = intents.map((i) => generic[i]).find(Boolean);
  if (g) return { reply: `${g}\n\nWhich plant are you growing? I can be more specific.`, suggestions: suggestionsFor(null), context: {} };

  return {
    reply: 'I didn’t quite catch that. 🌱 Try asking about a specific flower — e.g. “How often should I water roses?” or “Why are my petunia leaves yellow?”',
    suggestions: suggestionsFor(null),
    context: { flowerSlug: flower?.slug },
  };
}

module.exports = { reply };
