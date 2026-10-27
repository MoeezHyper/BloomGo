import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { Button, Input, T } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { colors } from '@/theme';

export default function ChangePassword() {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (next !== confirm) return setError('New passwords do not match.');
    setSaving(true);
    setError(null);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      toast('Password changed');
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page keyboard>
      <TopBar title="Change password" />
      <Gutter>
        <T variant="body" color={colors.muted}>Use at least 8 characters with a mix of letters and numbers.</T>
        <View style={{ gap: 16, marginTop: 20 }}>
          <Input label="Current password" icon="lock-closed-outline" value={current} onChangeText={setCurrent} secure />
          <Input label="New password" icon="key-outline" value={next} onChangeText={setNext} secure />
          <Input label="Confirm new password" icon="key-outline" value={confirm} onChangeText={setConfirm} secure onSubmitEditing={save} />
        </View>
        {error && <T variant="caption" color={colors.danger} style={{ marginTop: 12 }}>{error}</T>}
        <Button title="Update password" onPress={save} loading={saving} style={{ marginTop: 24 }} />
      </Gutter>
    </Page>
  );
}
