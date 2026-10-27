import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { CityField } from '@/components/pickers';
import { Avatar, Button, Input, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { colors } from '@/theme';

const AVATAR_COLORS = ['#F8DCD6', '#DDE8DA', '#F3E6C8', '#E4DDF0', '#D8E7EE', '#F1D9C6'];

export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState(user?.city ?? 'lahore');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]!);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await api<{ user: User }>('/profile', { method: 'PATCH', body: { name, phone, city, avatarColor } });
      setUser(r.user);
      toast('Profile updated');
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page keyboard>
      <TopBar title="Personal details" />
      <Gutter>
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <Avatar name={name || 'U'} color={avatarColor} size={88} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {AVATAR_COLORS.map((c) => (
              <Tap key={c} onPress={() => setAvatarColor(c)} scaleTo={0.85} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: avatarColor === c ? 2.5 : 1, borderColor: avatarColor === c ? colors.forest : colors.line }}>
                <View />
              </Tap>
            ))}
          </View>
        </View>
        <View style={{ gap: 16, marginTop: 18 }}>
          <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} />
          <Input label="Email" icon="mail-outline" value={user?.email} editable={false} style={{ opacity: 0.6 }} />
          <Input label="Phone" icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+92 300 0000000" />
          <CityField value={city} onChange={setCity} />
        </View>
        {error && <T variant="caption" color={colors.danger} style={{ marginTop: 12 }}>{error}</T>}
        <Button title="Save changes" onPress={save} loading={saving} style={{ marginTop: 26 }} />
      </Gutter>
    </Page>
  );
}
