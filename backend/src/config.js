const fs = require('fs');
const path = require('path');

// Optional backend/.env (real Firebase project settings). Loaded here rather than with
// node --env-file so watch mode doesn't restart on every database write.
const ENV_FILE = path.join(__dirname, '..', '.env');
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

module.exports = {
  APP_NAME: 'Smart Home Gardening and Decoration System',
  PORT: Number(process.env.PORT) || 4000,
  DB_FILE: process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json'),
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  // "demo-" project IDs are offline-only projects understood by the Firebase emulators.
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'demo-shgds',
  // Google sign-in (real Firebase project only): the project's OAuth "Web client".
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
};
