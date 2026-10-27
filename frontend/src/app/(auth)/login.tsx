import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { DEMO_ACCOUNTS, homeFor } from '@/lib/constants';
import { colors, fonts, radius } from '@/theme';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e = email, p = password) {
    if (!e.trim() || !p) return setError('Enter your email and password.');
    setError(null);
    setLoading(true);
    try {
      const user = await signIn(e.trim(), p);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.replace(homeFor(user.role));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Welcome back" title={'Sign in to your\ngarden.'} subtitle="Pick up right where you left off.">
      <View style={{ gap: 16 }}>
        <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Input label="Password" icon="lock-closed-outline" placeholder="Your password" value={password} onChangeText={setPassword} secure autoComplete="password" onSubmitEditing={() => submit()} />
      </View>
      <Pressable onPress={() => router.push({ pathname: '/forgot-password', params: { email } })} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: 12 }}>
        <T style={{ fontFamily: fonts.semibold, fontSize: 14 }} color={colors.forest}>Forgot password?</T>
      </Pressable>

      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <T variant="caption" color={colors.danger} style={{ flex: 1 }}>{error}</T>
        </View>
      )}

      <Button title="Sign in" onPress={() => submit()} loading={loading} style={{ marginTop: 22 }} />

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <T variant="eyebrow" color={colors.muted}>Demo accounts</T>
        <View style={styles.line} />
      </View>
      <View style={styles.demoGrid}>
        {DEMO_ACCOUNTS.map((a) => (
          <Tap
            key={a.email}
            style={styles.demo}
            onPress={() => {
              setEmail(a.email);
              setPassword(a.password);
              submit(a.email, a.password);
            }}
          >
            <Ionicons name={a.icon} size={18} color={colors.forest} />
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: fonts.semibold, fontSize: 13 }} color={colors.ink}>{a.label}</T>
              <T style={{ fontSize: 11, fontFamily: fonts.regular }} color={colors.muted} numberOfLines={1}>{a.email}</T>
            </View>
          </Tap>
        ))}
      </View>

      <View style={styles.footer}>
        <T variant="body" color={colors.muted}>New here?</T>
        <Pressable onPress={() => router.replace('/register')} hitSlop={8}>
          <T style={{ fontFamily: fonts.semibold, fontSize: 15 }} color={colors.forest}>Create an account</T>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12, marginTop: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 30, marginBottom: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demo: { width: '48.4%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 },
});
