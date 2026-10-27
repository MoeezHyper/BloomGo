import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { CityField } from '@/components/pickers';
import { Button, Chip, Input, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import type { Address } from '@/lib/types';
import { colors } from '@/theme';

const LABELS = ['Home', 'Work', 'Event', 'Other'];

export default function AddressForm() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = user?.addresses.find((a) => a.id === id);
  const [form, setForm] = useState({
    label: existing?.label ?? 'Home',
    line1: existing?.line1 ?? '',
    area: existing?.area ?? '',
    city: existing?.city ?? user?.city ?? 'lahore',
    notes: existing?.notes ?? '',
    isDefault: existing?.isDefault ?? (user?.addresses.length ?? 0) === 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await api<{ addresses: Address[] }>(existing ? `/profile/addresses/${existing.id}` : '/profile/addresses', { method: existing ? 'PUT' : 'POST', body: form });
      if (user) setUser({ ...user, addresses: r.addresses });
      toast(existing ? 'Address updated' : 'Address added');
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page keyboard>
      <TopBar title={existing ? 'Edit address' : 'New address'} />
      <Gutter>
        <T variant="label" style={{ marginBottom: 10 }}>Label</T>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {LABELS.map((l) => (
            <Chip key={l} label={l} active={form.label === l} onPress={() => set('label', l)} />
          ))}
        </View>
        <View style={{ gap: 16, marginTop: 20 }}>
          <Input label="Street address" icon="home-outline" placeholder="House 12, Street 4" value={form.line1} onChangeText={(v) => set('line1', v)} />
          <Input label="Area / sector" icon="map-outline" placeholder="e.g. Gulberg III" value={form.area} onChangeText={(v) => set('area', v)} />
          <CityField value={form.city} onChange={(v) => set('city', v)} />
          <Input label="Notes for visitors (optional)" icon="chatbox-outline" placeholder="Gate code, landmark, parking…" value={form.notes} onChangeText={(v) => set('notes', v)} multiline />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong">Use as default</T>
            <T variant="caption">Pre-selected for bookings and deliveries</T>
          </View>
          <Switch value={form.isDefault} onValueChange={(v) => set('isDefault', v)} trackColor={{ true: colors.forestSoft, false: colors.line }} thumbColor={form.isDefault ? colors.forest : '#fff'} />
        </View>
        {error && <T variant="caption" color={colors.danger} style={{ marginTop: 12 }}>{error}</T>}
        <Button title={existing ? 'Save address' : 'Add address'} onPress={save} loading={saving} style={{ marginTop: 24 }} />
      </Gutter>
    </Page>
  );
}
