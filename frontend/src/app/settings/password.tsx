import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { Button, Input, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors } from '@/theme';

export default function ChangePassword() {
  const router = useRouter();
  const toast = useToast();
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (next.length < 6 || !/\d/.test(next) || !/[A-Za-z]/.test(next)) {
      return setError('Password must be at least 6 characters with letters and numbers.');
    }
    if (next !== confirm) return setError('New passwords do not match.');
    setSaving(true);
    setError(null);
    try {
      await changePassword(current, next);
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
        <T variant="body" color={colors.muted}>Use at least 6 characters with a mix of letters and numbers.</T>
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
