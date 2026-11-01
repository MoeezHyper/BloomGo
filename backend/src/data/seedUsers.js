const crypto = require('crypto');

const AVATAR_COLORS = ['#F8DCD6', '#DDE8DA', '#F3E6C8', '#E4DDF0', '#D8E7EE'];

// Sign-in passwords for the seeded accounts. They live in Firebase Auth, not in
// the app database; the sync step creates them on first start.
const DEMO_PASSWORDS = {};

function makeUser(fields, password) {
  DEMO_PASSWORDS[fields.email.toLowerCase()] = password;
  return {
    id: crypto.randomUUID(),
    phone: '',
    city: 'islamabad',
    status: 'active',
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    addresses: [],
    garden: null,
    professional: null,
    favorites: [],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 40) * 86400000).toISOString(),
    ...fields,
    email: fields.email.toLowerCase(),
  };
}

function buildSeed() {
  const users = [
    makeUser({ name: 'System Admin', email: 'admin@shgds.app', role: 'admin', city: 'islamabad' }, 'Admin1'),
    makeUser(
      {
        name: 'Sara Ahmed',
        email: 'sara@demo.com',
        role: 'customer',
        phone: '+92 300 1234567',
        city: 'islamabad',
        favorites: ['rose', 'jasmine', 'petunia'],
        addresses: [
          {
            id: crypto.randomUUID(),
            label: 'Home',
            line1: 'House 14, Street 7',
            area: 'F-7/2',
            city: 'islamabad',
            notes: 'Gate code 2241',
            isDefault: true,
          },
        ],
        garden: {
          spaceType: 'balcony',
          size: 'small',
          sunlight: 'full',
          waterAccess: 'easy',
          experience: 'beginner',
          hasPets: true,
          preferredColors: ['pink', 'white'],
          goals: ['fragrance', 'colour'],
          city: 'islamabad',
        },
      },
      'Demo12'
    ),
    makeUser(
      {
        name: 'Ali Raza',
        email: 'ali@demo.com',
        role: 'gardener',
        phone: '+92 321 7654321',
        city: 'islamabad',
        professional: {
          skills: ['Lawn care', 'Pruning', 'Pest control', 'Planting'],
          experienceYears: 6,
          serviceAreas: ['islamabad', 'rawalpindi'],
          availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'],
          hours: '9:00 AM - 5:00 PM',
          bio: 'Certified horticulturist who loves bringing tired gardens back to life.',
          rate: 1500,
        },
      },
      'Demo12'
    ),
    makeUser(
      {
        name: 'Hina Malik',
        email: 'hina@demo.com',
        role: 'decorator',
        phone: '+92 333 1112233',
        city: 'islamabad',
        professional: {
          skills: ['Mehndi & Nikah decor', 'Stage design', 'Entrance arches', 'Petal work'],
          experienceYears: 8,
          serviceAreas: ['islamabad', 'rawalpindi'],
          availableDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          hours: 'Flexible',
          bio: 'Fresh-flower stages and entrances for weddings and intimate ceremonies.',
          rate: 25000,
        },
      },
      'Demo12'
    ),
    makeUser({ name: 'Usman Tariq', email: 'usman@demo.com', role: 'customer', city: 'islamabad' }, 'Demo12'),
    makeUser({ name: 'Ayesha Khan', email: 'ayesha@demo.com', role: 'customer', city: 'islamabad' }, 'Demo12'),
    makeUser({ name: 'Bilal Hussain', email: 'bilal@demo.com', role: 'gardener', city: 'islamabad' }, 'Demo12'),
    makeUser({ name: 'Zara Sheikh', email: 'zara@demo.com', role: 'decorator', city: 'islamabad', status: 'suspended' }, 'Demo12'),
  ];
  return { users };
}

module.exports = { buildSeed, AVATAR_COLORS, DEMO_PASSWORDS };
