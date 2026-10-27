import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '@/lib/api';
import type { Role, User } from '@/lib/types';

const TOKEN_KEY = 'shgds.token';

type AuthResult = { token: string; user: User };
type RegisterInput = { name: string; email: string; phone: string; password: string; role: Role; city: string };

interface AuthValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  acceptSession: (r: AuthResult) => Promise<User>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
  toggleFavorite: (slug: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const { user } = await api<{ user: User }>('/auth/me');
          setUser(user);
        }
      } catch (e: any) {
        // A rejected token means sign in again; a network error keeps the token for next launch.
        if (e?.status === 401 || e?.status === 403) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setAuthToken(null);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const acceptSession = useCallback(async ({ token, user }: AuthResult) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(user);
    return user;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => acceptSession(await api<AuthResult>('/auth/login', { method: 'POST', body: { email, password } })),
    [acceptSession]
  );

  const register = useCallback(
    async (input: RegisterInput) => acceptSession(await api<AuthResult>('/auth/register', { method: 'POST', body: input })),
    [acceptSession]
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { user } = await api<{ user: User }>('/auth/me');
    setUser(user);
  }, []);

  const toggleFavorite = useCallback(async (slug: string) => {
    // Optimistic: flip locally first so the heart responds instantly.
    let next = false;
    setUser((u) => {
      if (!u) return u;
      next = !u.favorites.includes(slug);
      return { ...u, favorites: next ? [...u.favorites, slug] : u.favorites.filter((s) => s !== slug) };
    });
    try {
      const r = await api<{ isFavorite: boolean; favorites: string[] }>(`/flowers/${slug}/favorite`, { method: 'POST' });
      setUser((u) => (u ? { ...u, favorites: r.favorites } : u));
      return r.isFavorite;
    } catch (e) {
      setUser((u) => (u ? { ...u, favorites: next ? u.favorites.filter((s) => s !== slug) : [...u.favorites, slug] } : u));
      throw e;
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, register, acceptSession, signOut, setUser, refresh, toggleFavorite }),
    [user, ready, signIn, register, acceptSession, signOut, refresh, toggleFavorite]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
