import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { homeFor } from '@/lib/constants';
import { GoogleCancelled } from '@/lib/googleSignIn';
import { colors, fonts } from '@/theme';
import { Tap } from './ui';

// "Continue with Google": signs in, or sends a first-time Google user to finish their profile.
export function GoogleButton({ onError }: { onError?: (message: string | null) => void }) {
  const router = useRouter();
  const toast = useToast();
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  async function press() {
    onError?.(null);
    setBusy(true);
    try {
      const r = await signInWithGoogle();
      if ('needsProfile' in r) {
        router.push({ pathname: '/complete-profile', params: { email: r.email, name: r.name } });
      } else {
        toast(`Welcome back, ${r.user.name.split(' ')[0]}!`);
        router.replace(homeFor(r.user.role));
      }
    } catch (e: any) {
      if (!(e instanceof GoogleCancelled)) onError ? onError(e.message) : toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Tap onPress={press} disabled={busy} style={styles.btn} scaleTo={0.98}>
      {busy ? (
        <ActivityIndicator color={colors.forest} />
      ) : (
        <>
          <View style={styles.logo}>
            <Ionicons name="logo-google" size={18} color="#4285F4" />
          </View>
          <Text style={styles.text}>Continue with Google</Text>
        </>
      )}
    </Tap>
  );
}

export function OrDivider({ label = 'or' }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.line} />
      <Text style={styles.or}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: 999, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  or: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
});
