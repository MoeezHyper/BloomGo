// Deletes the local database so demo data is re-seeded on next start.
const fs = require('fs');
const { DB_FILE } = require('../config');

if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE);
  console.log('Database removed. Demo data will be re-created on next start.');
} else {
  console.log('No database file found — nothing to reset.');
}
