import {
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
} from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { auth, authMessage } from '@/lib/firebase';
import { getGoogleIdToken } from '@/lib/googleSignIn';
import type { Role, User } from '@/lib/types';

// Last known profile, so a signed-in user stays signed in when the API is unreachable.
const USER_KEY = 'shgds.user';

type RegisterInput = { name: string; email: string; phone: string; password: string; role: Role; city: string };
type GoogleResult = { user: User } | { needsProfile: true; email: string; name: string };
type ProfileInput = { name: string; phone: string; role: Role; city: string };

interface AuthValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  signInWithGoogle: () => Promise<GoogleResult>;
  completeProfile: (input: ProfileInput) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
  toggleFavorite: (slug: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthValue | null>(null);

// Firebase errors carry a `code`; rethrow them with a friendly message.
const friendly = (e: any) => (e?.code?.startsWith?.('auth/') ? new Error(authMessage(e)) : e);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  // Set while signIn/register run, so the auth listener doesn't load the profile twice.
  const busy = useRef(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (busy.current) return;
      if (!fbUser) {
        setUser(null);
        setReady(true);
        return;
      }
      try {
        const { user } = await api<{ user: User }>('/auth/me');
        setUser(user);
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          // Suspended, or no profile for this account: end the Firebase session too.
          await firebaseSignOut(auth).catch(() => {});
          setUser(null);
        } else {
          const cached = await SecureStore.getItemAsync(USER_KEY).catch(() => null);
          if (cached) setUser(JSON.parse(cached));
        }
      } finally {
        setReady(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    (user ? SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)) : SecureStore.deleteItemAsync(USER_KEY)).catch(() => {});
  }, [user, ready]);

  const startSession = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    try {
      const { user } = await api<{ user: User }>('/auth/session', { method: 'POST' });
      setUser(user);
      return user;
    } catch (e) {
      await firebaseSignOut(auth).catch(() => {});
      throw e;
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      busy.current = true;
      try {
        return await startSession(email, password);
      } catch (e) {
        throw friendly(e);
      } finally {
        busy.current = false;
      }
    },
    [startSession]
  );

  // The API creates the Firebase account (so it can enforce roles); then we sign in.
  const register = useCallback(
    async (input: RegisterInput) => {
      busy.current = true;
      try {
        await api('/auth/register', { method: 'POST', body: { ...input, email: input.email.trim() } });
        return await startSession(input.email, input.password);
      } catch (e) {
        throw friendly(e);
      } finally {
        busy.current = false;
      }
    },
    [startSession]
  );

  // Browser-based Google sign-in, then Firebase signInWithCredential. A first-time
  // Google user has no profile yet; the caller then shows the complete-profile screen.
  const signInWithGoogle = useCallback(async (): Promise<GoogleResult> => {
    busy.current = true;
    try {
      const idToken = await getGoogleIdToken();
      const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      try {
        const { user } = await api<{ user: User }>('/auth/session', { method: 'POST' });
        setUser(user);
        return { user };
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          return { needsProfile: true, email: cred.user.email ?? '', name: cred.user.displayName ?? '' };
        }
        await firebaseSignOut(auth).catch(() => {});
        throw e;
      }
    } catch (e) {
      throw friendly(e);
    } finally {
      busy.current = false;
    }
  }, []);

  const completeProfile = useCallback(async (input: ProfileInput) => {
    const { user } = await api<{ user: User }>('/auth/complete-profile', { method: 'POST', body: input });
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e: any) {
      // Don't reveal whether an account exists for this email.
      if (e?.code === 'auth/user-not-found') return;
      throw friendly(e);
    }
  }, []);

  // Firebase requires a recent sign-in before changing the password.
  const changePassword = useCallback(async (current: string, next: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser?.email) throw new Error('Please sign in again and retry.');
    try {
      await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email, current));
    } catch (e: any) {
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password') throw new Error('Your current password is incorrect.');
      throw friendly(e);
    }
    try {
      await updatePassword(fbUser, next);
    } catch (e) {
      throw friendly(e);
    }
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
    () => ({ user, ready, signIn, register, signInWithGoogle, completeProfile, signOut, sendPasswordReset, changePassword, setUser, refresh, toggleFavorite }),
    [user, ready, signIn, register, signInWithGoogle, completeProfile, signOut, sendPasswordReset, changePassword, refresh, toggleFavorite]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
