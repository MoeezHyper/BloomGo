import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { CityField } from '@/components/pickers';
import { Button, Input, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { homeFor, ROLE_META } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

const ROLES: Role[] = ['customer', 'gardener', 'decorator'];

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = [
  { label: 'Too short', color: colors.danger },
  { label: 'Weak', color: colors.terracotta },
  { label: 'Fair', color: colors.gold },
  { label: 'Good', color: colors.forestSoft },
  { label: 'Strong', color: colors.forest },
];

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('customer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', city: 'lahore' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pw = strength(form.password);

  async function submit() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/\d/.test(form.password) || !/[A-Za-z]/.test(form.password)) e.password = 'Use 8+ characters with letters and numbers.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const user = await register({ ...form, email: form.email.trim(), role });
      toast(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
      router.replace(homeFor(user.role));
      // New home owners go straight into the garden setup; they can skip it.
      if (user.role === 'customer') setTimeout(() => router.push({ pathname: '/settings/garden', params: { onboarding: '1' } }), 350);
      if (user.role !== 'customer' && user.role !== 'admin') setTimeout(() => router.push({ pathname: '/settings/professional', params: { onboarding: '1' } }), 350);
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <AuthShell eyebrow="Step 1 of 2" title={'How will you use\nthe app?'} subtitle="Choose the account type that fits you best.">
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
        <Button title="Continue" iconRight="arrow-forward" onPress={() => setStep(2)} style={{ marginTop: 26 }} />
        <View style={styles.footer}>
          <T variant="body" color={colors.muted}>Already registered?</T>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <T style={{ fontFamily: fonts.semibold, fontSize: 15 }} color={colors.forest}>Sign in</T>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow={`Step 2 of 2 · ${ROLE_META[role].label}`} title="Tell us about you." subtitle="We use your city to match flowers to your climate." onBack={() => setStep(1)}>
      <View style={{ gap: 16 }}>
        <Input label="Full name" icon="person-outline" placeholder="e.g. Sara Ahmed" value={form.name} onChangeText={set('name')} error={errors.name} autoComplete="name" />
        <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={form.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Input label="Phone (optional)" icon="call-outline" placeholder="+92 300 0000000" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <CityField value={form.city} onChange={set('city')} />
        <View>
          <Input label="Password" icon="lock-closed-outline" placeholder="At least 8 characters" value={form.password} onChangeText={set('password')} error={errors.password} secure />
          {form.password.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < pw ? STRENGTH[pw]!.color : colors.line }} />
                ))}
              </View>
              <T variant="caption" color={STRENGTH[pw]!.color}>{STRENGTH[pw]!.label}</T>
            </View>
          )}
        </View>
      </View>
      {errors.form && (
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <T variant="caption" color={colors.danger} style={{ flex: 1 }}>{errors.form}</T>
        </View>
      )}
      <Button title="Create account" onPress={submit} loading={loading} style={{ marginTop: 26 }} />
      <T variant="caption" center style={{ marginTop: 14 }}>By continuing you agree to our terms and privacy policy.</T>
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
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  error: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12, marginTop: 16 },
});
