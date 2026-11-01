// "Continue with Google" through the browser, so it works in Expo Go:
// the API runs Google's OAuth flow and returns a Google ID token, which the app
// then uses to sign in to Firebase.
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from './api';

export class GoogleCancelled extends Error {
  constructor() {
    super('Google sign-in was cancelled.');
  }
}

type Result = { id_token?: string; error?: string; state?: string };

// Some Android browsers won't hand the result back through the app link, so the
// API also keeps it (single use, keyed by our random state) for us to collect.
async function collectResult(state: string): Promise<Result | null> {
  try {
    const r = await fetch(`${API_URL}/api/auth/google/result?state=${encodeURIComponent(state)}`);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function getGoogleIdToken(): Promise<string> {
  const returnUrl = Linking.createURL('google-auth');
  const begin = await fetch(`${API_URL}/api/auth/google/begin`, { method: 'POST' }).catch(() => null);
  if (!begin?.ok) throw new Error(`Can't reach the server at ${API_URL}. Make sure the backend is running.`);
  const { state } = (await begin.json()) as { state: string };
  const start = `${API_URL}/api/auth/google/start?redirect=${encodeURIComponent(returnUrl)}&state=${state}`;
  const session = await WebBrowser.openAuthSessionAsync(start, returnUrl);

  let result: Result | null;
  if (session.type === 'success') {
    const q = Linking.parse(session.url).queryParams ?? {};
    result = { id_token: q.id_token as string, error: q.error as string, state: q.state as string };
  } else {
    result = await collectResult(state);
  }
  if (!result) throw new GoogleCancelled();
  if (result.state !== state) throw new Error('Google sign-in could not be verified. Please try again.');
  if (result.error) {
    throw result.error === 'access_denied' ? new GoogleCancelled() : new Error('Google sign-in failed. Please try again.');
  }
  if (!result.id_token) throw new Error('Google sign-in failed. Please try again.');
  return result.id_token;
}
