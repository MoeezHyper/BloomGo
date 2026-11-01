// Deletes the local database (and the Firebase emulator's saved accounts) so demo
// data is re-seeded on next start. Accounts in a real Firebase project are not touched.
const fs = require('fs');
const path = require('path');
const { DB_FILE } = require('../config');

const EMULATOR_DATA = path.join(__dirname, '..', '..', '..', '.firebase-emulator');

if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log('Database removed. Demo data will be re-created on next start.');
} else {
  console.log('No database file found — nothing to reset.');
}

if (fs.existsSync(EMULATOR_DATA)) {
  fs.rmSync(EMULATOR_DATA, { recursive: true, force: true });
  console.log('Firebase emulator accounts removed.');
}
