import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORT = 4000;

// The dev script sets EXPO_PUBLIC_API_URL (localhost via adb reverse). Otherwise
// fall back to the machine running Metro, which also works on a real phone.
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${PORT}` : `http://localhost:${PORT}`;
}

export const API_URL = resolveBaseUrl();

let authToken: string | null = null;
export const setAuthToken = (t: string | null) => {
  authToken = t;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: string; body?: unknown; query?: Record<string, string | number | boolean | undefined | null> };

export async function api<T = any>(path: string, { method = 'GET', body, query }: Options = {}): Promise<T> {
  let url = `${API_URL}/api${path}`;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}. Make sure the backend is running.`, 0);
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status);
  return data as T;
}

export const imageUrl = (path?: string | null) => (path ? (path.startsWith('http') ? path : `${API_URL}${path}`) : undefined);

export const heroImage = (name: 'butchart' | 'container' | 'cottage' | 'flowergarden' | 'garden' | 'greenhouse' | 'keukenhof' | 'rosegarden' | 'shalimar') =>
  `${API_URL}/images/hero/${name}.jpg`;
