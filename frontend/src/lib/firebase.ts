import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// The React Native build of Firebase Auth (picked by Metro) exports getReactNativePersistence;
// the web typings used by TypeScript don't, so it's imported from @firebase/auth directly.
// @ts-ignore -- react-native export
import { connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth';

// A real project is used when its keys are in frontend/.env (see .env.example).
// Without them the app talks to the local Firebase Auth Emulator that `npm start` runs.
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
export const EMULATOR_HOST = apiKey ? null : process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1:9099';
export const PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-shgds';

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: apiKey || 'demo-api-key',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    });

function createAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialised (fast refresh).
    return getAuth(app);
  }
}

export const auth = createAuth();
if (EMULATOR_HOST) {
  try {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}`, { disableWarnings: true });
  } catch {
    // Already connected (fast refresh).
  }
}

// Turns Firebase error codes into messages people understand.
export function authMessage(e: any): string {
  switch (e?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Incorrect email or password.';
    case 'auth/user-disabled':
      return 'This account has been suspended. Contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return EMULATOR_HOST
        ? `Can't reach the sign-in server (Firebase emulator at ${EMULATOR_HOST}). Start the app with npm start.`
        : 'No internet connection. Please check your network and try again.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again and retry.';
    case 'auth/missing-email':
      return 'Please enter your email address.';
    default:
      return e?.message?.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)\.?$/, '') || 'Something went wrong. Please try again.';
  }
}
