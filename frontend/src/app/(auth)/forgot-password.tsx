import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const r = await api<{ message: string; demoCode?: string }>('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
      toast(r.message, 'info');
      router.push({ pathname: '/reset-password', params: { email: email.trim(), demoCode: r.demoCode ?? '' } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="Account recovery" title={'Forgot your\npassword?'} subtitle="Enter the email you registered with and we’ll send you a 6-digit reset code.">
      <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} onSubmitEditing={submit} />
      <Button title="Send reset code" icon="paper-plane-outline" onPress={submit} loading={loading} style={{ marginTop: 22 }} />
    </AuthShell>
  );
}
