// First Google sign-in: Firebase knows the person, the app still needs their role and city.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { CityField } from '@/components/pickers';
import { Button, Input, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ROLE_META } from '@/lib/constants';
import { goHomeAfterSignUp } from '@/lib/navigation';
import type { Role } from '@/lib/types';
import { colors, radius } from '@/theme';

const ROLES: Role[] = ['customer', 'gardener', 'decorator'];

export default function CompleteProfile() {
  const router = useRouter();
  const toast = useToast();
  const { completeProfile, signOut } = useAuth();
  const params = useLocalSearchParams<{ email?: string; name?: string }>();
  const [role, setRole] = useState<Role>('customer');
  const [name, setName] = useState(params.name ?? '');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('islamabad');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (name.trim().length < 2) return setError('Please enter your full name.');
    setError(null);
    setSaving(true);
    try {
      const user = await completeProfile({ name: name.trim(), phone, role, city });
      toast(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
      goHomeAfterSignUp(router, user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Leaving without finishing ends the half-done Google session.
  async function cancel() {
    await signOut().catch(() => {});
    router.canGoBack() ? router.back() : router.replace('/welcome');
  }

  return (
    <AuthShell eyebrow="Almost there" title={'Finish setting up\nyour account.'} subtitle={`Signed in with Google as ${params.email ?? ''}. How will you use the app?`} onBack={cancel}>
      <View style={{ gap: 12 }}>
        {ROLES.map((r) => {
          const m = ROLE_META[r];
          const active = r === role;
          return (
            <Tap key={r} onPress={() => setRole(r)} style={[styles.role, active && styles.roleActive]} scaleTo={0.98}>
              <View style={[styles.roleIcon, { backgroundColor: active ? colors.forest : m.tint }]}>
                <Ionicons name={m.icon} size={22} color={active ? colors.white : colors.forest} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="subheading">{m.label}</T>
                <T variant="caption">{m.blurb}</T>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>{active && <View style={styles.radioDot} />}</View>
            </Tap>
          );
        })}
      </View>
      <View style={{ gap: 16, marginTop: 22 }}>
        <Input label="Full name" icon="person-outline" placeholder="e.g. Sara Ahmed" value={name} onChangeText={setName} autoComplete="name" />
        <Input label="Phone (optional)" icon="call-outline" placeholder="+92 300 0000000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <CityField value={city} onChange={setCity} />
      </View>
      {error && <T variant="caption" color={colors.danger} style={{ marginTop: 12 }}>{error}</T>}
      <Button title="Create my account" onPress={submit} loading={saving} style={{ marginTop: 24, borderRadius: 999 }} />
      <Button title="Cancel" kind="ghost" onPress={cancel} style={{ marginTop: 6 }} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  role: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface },
  roleActive: { borderColor: colors.forest, backgroundColor: '#F7FAF5' },
  roleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.forest },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.forest },
});
