// Shown after a reset email is sent. With a real Firebase project the email links to
// Firebase's secure page where the new password is chosen. In local test mode (Firebase
// emulator, no real email) the emailed code is applied here with confirmPasswordReset.
import { Ionicons } from '@expo/vector-icons';
import { confirmPasswordReset } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { auth, authMessage, EMULATOR_HOST, PROJECT_ID } from '@/lib/firebase';
import { colors, fonts, radius } from '@/theme';

const RESEND_SECONDS = 60;

const STEPS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'mail-open-outline', text: 'Open the email from Smart Home Gardening (check spam too).' },
  { icon: 'link-outline', text: 'Tap the link and choose a new password.' },
  { icon: 'log-in-outline', text: 'Come back here and sign in with it.' },
];

// The emulator keeps sent emails instead of delivering them; fetch the latest reset code.
async function latestEmulatorCode(email: string) {
  const r = await fetch(`http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/oobCodes`);
  const { oobCodes = [] } = await r.json();
  const match = oobCodes.filter((c: any) => c.requestType === 'PASSWORD_RESET' && c.email?.toLowerCase() === email.toLowerCase()).pop();
  return match?.oobCode as string | undefined;
}

const validPassword = (pw: string) => pw.length >= 6 && /\d/.test(pw) && /[A-Za-z]/.test(pw);

function EmulatorReset({ email, onDone }: { email: string; onDone: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!validPassword(password)) return setError('Password must be at least 6 characters with letters and numbers.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError(null);
    setSaving(true);
    try {
      const code = await latestEmulatorCode(email);
      if (!code) return setError('No reset email found for this address. Go back and request one.');
      await confirmPasswordReset(auth, code, password);
      toast('Password updated — sign in with your new password.');
      onDone();
    } catch (e: any) {
      setError(e?.code === 'auth/invalid-action-code' || e?.code === 'auth/expired-action-code' ? 'This reset link was already used or has expired. Request a new one.' : authMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.dev}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Ionicons name="flask-outline" size={18} color={colors.forest} />
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: fonts.semibold, fontSize: 13 }} color={colors.forest}>Local test mode — Firebase emulator</T>
          <T variant="caption">No real email is sent, so you can finish the reset here.</T>
        </View>
      </View>
      <View style={{ gap: 12, marginTop: 14 }}>
        <Input label="New password" icon="lock-closed-outline" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secure />
        <Input label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secure onSubmitEditing={save} />
      </View>
      {error && <T variant="caption" color={colors.danger} style={{ marginTop: 10 }}>{error}</T>}
      <Button title="Set new password" onPress={save} loading={saving} small style={{ marginTop: 14 }} />
    </View>
  );
}

export default function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const { sendPasswordReset } = useAuth();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [wait, setWait] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const toSignIn = () => router.replace({ pathname: '/login', params: { email } });

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setSending(true);
    try {
      await sendPasswordReset(email);
      toast('A new reset link is on its way.');
      setWait(RESEND_SECONDS);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthShell eyebrow="Account recovery" title={'Check your\ninbox.'} subtitle={`If an account exists for ${email}, we’ve sent it a password reset link.`}>
      <View style={styles.card}>
        {STEPS.map((s, i) => (
          <View key={s.text} style={[styles.step, i > 0 && styles.stepBorder]}>
            <View style={styles.stepIcon}>
              <Ionicons name={s.icon} size={18} color={colors.forest} />
            </View>
            <T variant="body" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{s.text}</T>
          </View>
        ))}
      </View>

      {EMULATOR_HOST && <EmulatorReset email={email} onDone={toSignIn} />}

      <Button title="Back to sign in" icon="log-in-outline" onPress={toSignIn} style={{ marginTop: 22, borderRadius: 999 }} />
      <Button
        title={wait > 0 ? `Resend email in ${wait}s` : 'Resend email'}
        kind="ghost"
        disabled={wait > 0}
        loading={sending}
        onPress={resend}
        style={{ marginTop: 8 }}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  stepBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  stepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  dev: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.sageSoft, borderWidth: 1, borderColor: colors.sage, marginTop: 16 },
});
