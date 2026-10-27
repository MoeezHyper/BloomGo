import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ComponentRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { homeFor } from '@/lib/constants';
import type { User } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

export default function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const { acceptSession } = useAuth();
  const { email = '', demoCode = '' } = useLocalSearchParams<{ email: string; demoCode?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeRef = useRef<ComponentRef<typeof TextInput>>(null);

  async function submit() {
    if (code.length !== 6) return setError('Enter the 6-digit code.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ message: string; token: string; user: User }>('/auth/reset-password', { method: 'POST', body: { email, code, password } });
      const user = await acceptSession(r);
      toast('Password updated — you’re signed in.');
      router.dismissAll();
      router.replace(homeFor(user.role));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Account recovery" title={'Check your\ninbox.'} subtitle={`Enter the code sent to ${email} and choose a new password.`}>
      {!!demoCode && (
        <Pressable onPress={() => setCode(demoCode)} style={styles.demo}>
          <Ionicons name="flask-outline" size={18} color={colors.forest} />
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: fonts.semibold, fontSize: 13 }} color={colors.forest}>Demo mode — no email service connected</T>
            <T variant="caption">Your code is {demoCode}. Tap to fill it in.</T>
          </View>
        </Pressable>
      )}

      <T variant="label" style={{ marginBottom: 8 }}>Reset code</T>
      <Pressable onPress={() => codeRef.current?.focus()} style={styles.codeRow}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.codeBox, code.length === i && styles.codeBoxActive, !!code[i] && { borderColor: colors.forest }]}>
            <T style={{ fontFamily: fonts.serif, fontSize: 26 }} color={colors.ink}>{code[i] ?? ''}</T>
          </View>
        ))}
        <TextInput
          ref={codeRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={!demoCode}
          style={styles.hiddenInput}
        />
      </Pressable>

      <View style={{ gap: 16, marginTop: 20 }}>
        <Input label="New password" icon="lock-closed-outline" placeholder="At least 8 characters" value={password} onChangeText={setPassword} secure />
        <Input label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secure onSubmitEditing={submit} />
      </View>
      {error && <T variant="caption" color={colors.danger} style={{ marginTop: 12 }}>{error}</T>}
      <Button title="Reset password" onPress={submit} loading={loading} style={{ marginTop: 22 }} />
      <Pressable onPress={() => router.back()} style={{ alignSelf: 'center', marginTop: 18 }} hitSlop={8}>
        <T style={{ fontFamily: fonts.semibold, fontSize: 14 }} color={colors.forest}>Didn’t get it? Send a new code</T>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  demo: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: radius.md, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.sage, marginBottom: 20 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeBox: { flex: 1, height: 60, borderRadius: 14, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  codeBoxActive: { borderColor: colors.forest, borderWidth: 2 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
