import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPassword() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.');
    setError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      router.push({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Account recovery" title={'Forgot your\npassword?'} subtitle="Enter the email you registered with and we’ll email you a secure link to choose a new password.">
      <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} onSubmitEditing={submit} />
      <Button title="Send reset link" icon="paper-plane-outline" onPress={submit} loading={loading} style={{ marginTop: 22, borderRadius: 999 }} />
    </AuthShell>
  );
}
