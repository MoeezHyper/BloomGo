// Firebase Admin: verifies the ID tokens the app sends and manages auth accounts.
//
// Local development uses the Firebase Auth Emulator (set FIREBASE_AUTH_EMULATOR_HOST,
// which `npm start` does automatically). For a real project, set FIREBASE_PROJECT_ID
// and GOOGLE_APPLICATION_CREDENTIALS (path to a service-account JSON) in backend/.env.
const { initializeApp, applicationDefault, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FIREBASE_PROJECT_ID } = require('./config');

const usingEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!getApps().length) {
  const options = { projectId: FIREBASE_PROJECT_ID };
  // The emulator needs no credentials; a real project needs a service account.
  if (!usingEmulator && process.env.GOOGLE_APPLICATION_CREDENTIALS) options.credential = applicationDefault();
  initializeApp(options);
}

const auth = getAuth();

module.exports = { auth, usingEmulator, projectId: FIREBASE_PROJECT_ID };
