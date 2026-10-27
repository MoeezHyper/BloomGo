import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { Avatar, Button, Card, Chip, ErrorState, Loading, Pill, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/api';
import { cityName, ROLE_META, SPACE_META, SUN_META } from '@/lib/constants';
import type { Role, User } from '@/lib/types';
import { colors } from '@/theme';

const ROLES: Role[] = ['customer', 'gardener', 'decorator', 'admin'];

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 }}>
      <T variant="caption">{label}</T>
      <T variant="bodyStrong" style={{ fontSize: 14, flexShrink: 1, textAlign: 'right' }}>{value || '—'}</T>
    </View>
  );
}

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, loading, error, refresh, setData } = useFetch<{ user: User }>(`/admin/users/${id}`);
  const [busy, setBusy] = useState(false);
  const u = data?.user;
  const isMe = u?.id === me?.id;

  async function patch(body: Partial<Pick<User, 'role' | 'status'>>, msg: string) {
    setBusy(true);
    try {
      const r = await api<{ user: User }>(`/admin/users/${id}`, { method: 'PATCH', body });
      setData(r);
      toast(msg);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <TopBar title="User details" />
      {loading && !u ? (
        <Loading />
      ) : error || !u ? (
        <ErrorState message={error ?? 'Not found'} onRetry={refresh} />
      ) : (
        <Gutter>
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Avatar name={u.name} color={u.avatarColor} size={80} />
            <T variant="title" style={{ marginTop: 12 }} center>{u.name}</T>
            <T variant="caption">{u.email}</T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pill label={ROLE_META[u.role].label} icon={ROLE_META[u.role].icon} bg={ROLE_META[u.role].tint} />
              <Pill label={u.status === 'active' ? 'Active' : 'Suspended'} icon={u.status === 'active' ? 'checkmark-circle' : 'ban'} bg={u.status === 'active' ? colors.sageSoft : colors.dangerSoft} fg={u.status === 'active' ? colors.forest : colors.danger} />
            </View>
          </View>

          <Card style={{ marginTop: 22 }}>
            <Row label="Phone" value={u.phone} />
            <Row label="City" value={cityName(u.city)} />
            <Row label="Joined" value={new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} />
            <Row label="Last sign-in" value={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'} />
            <Row label="Addresses" value={String(u.addresses.length)} />
            <Row label="Favourites" value={String(u.favorites.length)} />
            {u.garden && <Row label="Garden" value={`${SPACE_META[u.garden.spaceType].label} · ${SUN_META[u.garden.sunlight].label}`} />}
            {u.professional && <Row label="Skills" value={u.professional.skills.join(', ')} />}
            {u.professional && <Row label="Service areas" value={u.professional.serviceAreas.map(cityName).join(', ')} />}
          </Card>

          {!isMe && (
            <>
              <T variant="subheading" style={{ marginTop: 26, marginBottom: 10 }}>Change role</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.map((r) => (
                  <Chip
                    key={r}
                    label={ROLE_META[r].label}
                    icon={ROLE_META[r].icon}
                    active={u.role === r}
                    onPress={() =>
                      u.role !== r &&
                      Alert.alert('Change role?', `${u.name} will become ${ROLE_META[r].label.toLowerCase()}.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Change', onPress: () => patch({ role: r }, `Role changed to ${ROLE_META[r].label}`) },
                      ])
                    }
                  />
                ))}
              </View>
              <Button
                title={u.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                kind={u.status === 'active' ? 'danger' : 'primary'}
                icon={u.status === 'active' ? 'ban-outline' : 'checkmark-circle-outline'}
                loading={busy}
                style={{ marginTop: 26 }}
                onPress={() =>
                  u.status === 'active'
                    ? Alert.alert('Suspend account?', `${u.name} will not be able to sign in.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Suspend', style: 'destructive', onPress: () => patch({ status: 'suspended' }, 'Account suspended') },
                      ])
                    : patch({ status: 'active' }, 'Account reactivated')
                }
              />
            </>
          )}
        </Gutter>
      )}
    </Page>
  );
}
