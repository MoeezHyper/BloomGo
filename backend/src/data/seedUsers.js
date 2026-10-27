const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const AVATAR_COLORS = ['#F8DCD6', '#DDE8DA', '#F3E6C8', '#E4DDF0', '#D8E7EE'];

function makeUser(fields, password) {
  return {
    id: crypto.randomUUID(),
    phone: '',
    city: 'lahore',
    status: 'active',
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    addresses: [],
    garden: null,
    professional: null,
    favorites: [],
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 40) * 86400000).toISOString(),
    ...fields,
    email: fields.email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
  };
}

function buildSeed() {
  const users = [
    makeUser({ name: 'System Admin', email: 'admin@shgds.app', role: 'admin', city: 'islamabad' }, 'Admin@123'),
    makeUser(
      {
        name: 'Sara Ahmed',
        email: 'sara@demo.com',
        role: 'customer',
        phone: '+92 300 1234567',
        city: 'lahore',
        favorites: ['rose', 'jasmine', 'petunia'],
        addresses: [
          {
            id: crypto.randomUUID(),
            label: 'Home',
            line1: 'House 14, Street 7',
            area: 'DHA Phase 5',
            city: 'lahore',
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
          city: 'lahore',
        },
      },
      'Demo@123'
    ),
    makeUser(
      {
        name: 'Ali Raza',
        email: 'ali@demo.com',
        role: 'gardener',
        phone: '+92 321 7654321',
        city: 'lahore',
        professional: {
          skills: ['Lawn care', 'Pruning', 'Pest control', 'Planting'],
          experienceYears: 6,
          serviceAreas: ['lahore'],
          availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'],
          hours: '9:00 AM - 5:00 PM',
          bio: 'Certified horticulturist who loves bringing tired gardens back to life.',
          rate: 1500,
        },
      },
      'Demo@123'
    ),
    makeUser(
      {
        name: 'Hina Malik',
        email: 'hina@demo.com',
        role: 'decorator',
        phone: '+92 333 1112233',
        city: 'karachi',
        professional: {
          skills: ['Mehndi & Nikah decor', 'Stage design', 'Entrance arches', 'Petal work'],
          experienceYears: 8,
          serviceAreas: ['karachi', 'hyderabad'],
          availableDays: ['Thu', 'Fri', 'Sat', 'Sun'],
          hours: 'Flexible',
          bio: 'Fresh-flower stages and entrances for weddings and intimate ceremonies.',
          rate: 25000,
        },
      },
      'Demo@123'
    ),
    makeUser({ name: 'Usman Tariq', email: 'usman@demo.com', role: 'customer', city: 'islamabad' }, 'Demo@123'),
    makeUser({ name: 'Ayesha Khan', email: 'ayesha@demo.com', role: 'customer', city: 'karachi' }, 'Demo@123'),
    makeUser({ name: 'Bilal Hussain', email: 'bilal@demo.com', role: 'gardener', city: 'islamabad' }, 'Demo@123'),
    makeUser({ name: 'Zara Sheikh', email: 'zara@demo.com', role: 'decorator', city: 'lahore', status: 'suspended' }, 'Demo@123'),
  ];
  return { users, resetCodes: [] };
}

module.exports = { buildSeed, AVATAR_COLORS };
