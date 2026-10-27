import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gutter, Page } from '@/components/layout';
import { Avatar, Card, ErrorState, FadeIn, Loading, Pill, SectionHeader, T, Tap } from '@/components/ui';
import { useFetch } from '@/hooks/useFetch';
import { imageUrl } from '@/lib/api';
import { greeting, ROLE_META } from '@/lib/constants';
import type { Role, User } from '@/lib/types';
import { colors, fonts, radius } from '@/theme';

type Stats = {
  totalUsers: number;
  byRole: Record<Role, number>;
  active: number;
  suspended: number;
  newThisWeek: number;
  gardenProfiles: number;
  flowers: number;
  topFavorites: { slug: string; name: string; image: string; count: number }[];
  recent: User[];
};

export default function AdminOverview() {
  const router = useRouter();
  const { data, loading, error, refresh, refreshing, reload } = useFetch<Stats>('/admin/stats');
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const roles: Role[] = ['customer', 'gardener', 'decorator', 'admin'];
  const maxRole = data ? Math.max(...roles.map((r) => data.byRole[r])) : 1;

  return (
    <Page tabBar refreshing={refreshing} onRefresh={refresh}>
      <Gutter>
        <T variant="eyebrow">{greeting()} · Admin</T>
        <T variant="display" style={{ marginTop: 6 }}>Platform{'\n'}overview.</T>
      </Gutter>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : data ? (
        <>
          <Gutter style={{ marginTop: 22 }}>
            <FadeIn>
              <View style={styles.hero}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>Total users</Text>
                  <Text style={styles.heroValue}>{data.totalUsers}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <Pill label={`+${data.newThisWeek} this week`} icon="trending-up" bg="rgba(221,232,218,0.95)" />
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  <View style={styles.heroMini}>
                    <Text style={styles.heroMiniValue}>{data.active}</Text>
                    <Text style={styles.heroMiniLabel}>Active</Text>
                  </View>
                  <View style={styles.heroMini}>
                    <Text style={styles.heroMiniValue}>{data.suspended}</Text>
                    <Text style={styles.heroMiniLabel}>Suspended</Text>
                  </View>
                </View>
              </View>
            </FadeIn>
          </Gutter>

          <Gutter style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            {[
              { icon: 'leaf-outline' as const, value: data.gardenProfiles, label: 'Garden profiles', tint: colors.sageSoft },
              { icon: 'flower-outline' as const, value: data.flowers, label: 'Flowers in library', tint: colors.blush },
            ].map((s) => (
              <Card key={s.label} style={{ flex: 1 }}>
                <View style={[styles.icon, { backgroundColor: s.tint }]}>
                  <Ionicons name={s.icon} size={18} color={colors.forest} />
                </View>
                <T style={{ fontFamily: fonts.serif, fontSize: 28, marginTop: 10 }} color={colors.ink}>{s.value}</T>
                <T variant="caption">{s.label}</T>
              </Card>
            ))}
          </Gutter>

          <Gutter style={{ marginTop: 28 }}>
            <SectionHeader eyebrow="Breakdown" title="Users by role" action="Manage" onAction={() => router.push('/admin/users')} />
            <Card>
              {roles.map((r, i) => (
                <View key={r} style={[{ paddingVertical: 10 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.icon, { backgroundColor: ROLE_META[r].tint, width: 32, height: 32 }]}>
                      <Ionicons name={ROLE_META[r].icon} size={15} color={colors.forest} />
                    </View>
                    <T variant="bodyStrong" style={{ flex: 1 }}>{ROLE_META[r].label}s</T>
                    <T style={{ fontFamily: fonts.serif, fontSize: 20 }} color={colors.ink}>{data.byRole[r]}</T>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { width: `${(data.byRole[r] / Math.max(1, maxRole)) * 100}%` }]} />
                  </View>
                </View>
              ))}
            </Card>
          </Gutter>

          {data.topFavorites.length > 0 && (
            <Gutter style={{ marginTop: 28 }}>
              <SectionHeader eyebrow="Engagement" title="Most-loved flowers" />
              <Card padded={false}>
                {data.topFavorites.map((f, i) => (
                  <Tap key={f.slug} onPress={() => router.push(`/flower/${f.slug}`)} style={[styles.favRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]} scaleTo={0.99}>
                    <T style={{ fontFamily: fonts.serif, fontSize: 18, width: 22 }} color={colors.faint}>{i + 1}</T>
                    <Image source={{ uri: imageUrl(f.image) }} style={styles.favImg} contentFit="cover" />
                    <T variant="bodyStrong" style={{ flex: 1 }}>{f.name}</T>
                    <Pill label={`${f.count}`} icon="heart" bg={colors.blush} />
                  </Tap>
                ))}
              </Card>
            </Gutter>
          )}

          <Gutter style={{ marginTop: 28 }}>
            <SectionHeader eyebrow="Latest" title="Recent sign-ups" />
            <Card padded={false}>
              {data.recent.map((u, i) => (
                <Tap key={u.id} onPress={() => router.push(`/user/${u.id}`)} style={[styles.favRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]} scaleTo={0.99}>
                  <Avatar name={u.name} color={u.avatarColor} size={40} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong">{u.name}</T>
                    <T variant="caption">{new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</T>
                  </View>
                  <Pill label={ROLE_META[u.role].label} bg={ROLE_META[u.role].tint} />
                </Tap>
              ))}
            </Card>
          </Gutter>
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: radius.xl, backgroundColor: colors.forest },
  heroLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2, color: colors.sage, textTransform: 'uppercase' },
  heroValue: { fontFamily: fonts.serif, fontSize: 60, lineHeight: 66, color: colors.white },
  heroMini: { width: 96, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroMiniValue: { fontFamily: fonts.serif, fontSize: 24, color: colors.white },
  heroMiniLabel: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginTop: 10, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.forest },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  favImg: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surfaceAlt },
});
