import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Gutter, Page } from '@/components/layout';
import { Avatar, Card, Chip, EmptyState, ErrorState, FadeIn, Input, Loading, Pill, T, Tap } from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import { cityName, ROLE_META } from '@/lib/constants';
import type { Role, User } from '@/lib/types';
import { colors, space } from '@/theme';

const FILTERS: { key: Role | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'customer', label: 'Home owners' },
  { key: 'gardener', label: 'Gardeners' },
  { key: 'decorator', label: 'Decorators' },
  { key: 'admin', label: 'Admins' },
];

export default function AdminUsers() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const { data, loading, error, refresh, refreshing, reload } = useFetch<{ users: User[] }>('/admin/users', { q, role: role === 'all' ? undefined : role });
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <Page tabBar refreshing={refreshing} onRefresh={refresh}>
      <Gutter>
        <T variant="eyebrow">User management</T>
        <T variant="display" style={{ marginTop: 6 }}>People.</T>
        <Input icon="search-outline" placeholder="Search by name or email" value={search} onChangeText={setSearch} style={{ marginTop: 18 }} autoCapitalize="none" />
      </Gutter>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, paddingVertical: 14 }}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={role === f.key} onPress={() => setRole(f.key)} />
        ))}
      </ScrollView>
      <Gutter>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : !data?.users.length ? (
          <EmptyState icon="people-outline" title="No users found" text="Try a different search or filter." />
        ) : (
          <>
            <T variant="caption" style={{ marginBottom: 10 }}>{data.users.length} users</T>
            <Card padded={false}>
              {data.users.map((u, i) => (
                <FadeIn key={u.id} delay={Math.min(i, 10) * 30}>
                  <Tap onPress={() => router.push(`/user/${u.id}`)} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]} scaleTo={0.99}>
                    <Avatar name={u.name} color={u.avatarColor} size={44} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <T variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>{u.name}</T>
                        {u.status === 'suspended' && <Ionicons name="ban" size={14} color={colors.danger} />}
                      </View>
                      <T variant="caption" numberOfLines={1}>{u.email} · {cityName(u.city)}</T>
                    </View>
                    <Pill label={ROLE_META[u.role].label} bg={ROLE_META[u.role].tint} />
                  </Tap>
                </FadeIn>
              ))}
            </Card>
          </>
        )}
      </Gutter>
    </Page>
  );
}
