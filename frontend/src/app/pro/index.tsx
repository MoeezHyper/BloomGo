import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Gutter, Page } from '@/components/layout';
import { Avatar, Button, Card, ErrorState, FadeIn, Pill, SectionHeader, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { heroImage, imageUrl } from '@/lib/api';
import { cityName, greeting, ROLE_META } from '@/lib/constants';
import type { Recommendations, User } from '@/lib/types';
import { colors, fonts, radius, space } from '@/theme';

function completeness(u: User) {
  const p = u.professional;
  const checks = [!!u.phone, !!p?.skills.length, !!p?.availableDays.length, !!p?.serviceAreas.length, !!p?.bio, !!p?.experienceYears, !!p?.rate, u.addresses.length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Ring({ value }: { value: number }) {
  const size = 84;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={42} cy={42} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={7} fill="none" />
        <Circle cx={42} cy={42} r={r} stroke={colors.sage} strokeWidth={7} fill="none" strokeDasharray={`${(c * value) / 100} ${c}`} strokeLinecap="round" transform="rotate(-90 42 42)" />
      </Svg>
      <Text style={{ fontFamily: fonts.serif, fontSize: 24, color: colors.white }}>{value}%</Text>
    </View>
  );
}

export default function ProDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const rec = useFetch<Recommendations>('/seasonal/recommendations', { city: user?.city });
  if (!user) return null;
  const p = user.professional;
  const pct = completeness(user);
  const meta = ROLE_META[user.role];
  const isGardener = user.role === 'gardener';

  return (
    <Page tabBar refreshing={rec.refreshing} onRefresh={rec.refresh}>
      <Gutter style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <T variant="eyebrow">{greeting()}</T>
          <T variant="title" style={{ marginTop: 4 }}>{user.name.split(' ')[0]}.</T>
        </View>
        <Tap onPress={() => router.push('/pro/profile')} scaleTo={0.9}>
          <Avatar name={user.name} color={user.avatarColor} size={46} />
        </Tap>
      </Gutter>

      <Gutter>
        <FadeIn>
          <Tap onPress={() => router.push('/settings/professional')} style={styles.hero} scaleTo={0.985}>
            <Image source={{ uri: heroImage(isGardener ? 'garden' : 'shalimar') }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['rgba(12,28,18,0.92)', 'rgba(12,28,18,0.55)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={{ flex: 1 }}>
              <Pill label={meta.label} icon={meta.icon} bg="rgba(255,255,255,0.92)" />
              <Text style={styles.heroTitle}>{pct === 100 ? 'Your profile shines.' : 'Complete your profile'}</Text>
              <Text style={styles.heroSub}>{pct === 100 ? 'You’re ready for bookings.' : 'Profiles with skills and availability get matched first.'}</Text>
            </View>
            <Ring value={pct} />
          </Tap>
        </FadeIn>
      </Gutter>

      <Gutter style={styles.stats}>
        {[
          { icon: 'briefcase-outline' as const, value: '0', label: 'Jobs' },
          { icon: 'star-outline' as const, value: '—', label: 'Rating' },
          { icon: 'time-outline' as const, value: `${p?.experienceYears ?? 0}y`, label: 'Experience' },
        ].map((s, i) => (
          <FadeIn key={s.label} delay={80 + i * 60} style={{ flex: 1 }}>
            <View style={styles.stat}>
              <Ionicons name={s.icon} size={20} color={colors.forest} />
              <T style={{ fontFamily: fonts.serif, fontSize: 26, marginTop: 6 }} color={colors.ink}>{s.value}</T>
              <T variant="caption">{s.label}</T>
            </View>
          </FadeIn>
        ))}
      </Gutter>

      <Gutter style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="Requests" title="Upcoming jobs" />
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-clear-outline" size={26} color={colors.forest} />
          </View>
          <T variant="subheading" center style={{ marginTop: 12 }}>No job requests yet</T>
          <T variant="caption" center style={{ marginTop: 4, paddingHorizontal: 20 }}>
            When customers book {isGardener ? 'garden visits' : 'event decor'} in your service areas, requests will appear here.
          </T>
        </Card>
      </Gutter>

      <Gutter style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="Your services" title="At a glance" action="Edit" onAction={() => router.push('/settings/professional')} />
        <Card>
          <T variant="label" color={colors.muted}>Skills</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {p?.skills.length ? p.skills.map((s) => <Pill key={s} label={s} />) : <T variant="caption">No skills added yet</T>}
          </View>
          <T variant="label" color={colors.muted} style={{ marginTop: 16 }}>Availability</T>
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
              const on = p?.availableDays.includes(d);
              return (
                <View key={d} style={[styles.day, on && { backgroundColor: colors.forest }]}>
                  <T style={{ fontFamily: fonts.semibold, fontSize: 11 }} color={on ? colors.white : colors.faint}>{d[0]}</T>
                </View>
              );
            })}
          </View>
          {!!p?.hours && <T variant="caption" style={{ marginTop: 8 }}>{p.hours}</T>}
          <T variant="label" color={colors.muted} style={{ marginTop: 16 }}>Service areas</T>
          <T variant="bodyStrong" style={{ marginTop: 4 }}>{p?.serviceAreas.map(cityName).join(', ') || '—'}</T>
        </Card>
      </Gutter>

      {rec.error && !rec.data && (
        <Gutter style={{ marginTop: 28 }}>
          <Card>
            <ErrorState message={rec.error} onRetry={rec.refresh} />
          </Card>
        </Gutter>
      )}

      {rec.data && (
        <>
          <Gutter style={{ marginTop: 28 }}>
            <SectionHeader eyebrow={`In season · ${rec.data.city.name}`} title={isGardener ? 'What clients will plant' : 'Fresh for your next event'} action="Library" onAction={() => router.push('/pro/explore')} />
          </Gutter>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 12 }}>
            {rec.data.blooming.slice(0, 10).map((f) => (
              <Tap key={f.slug} onPress={() => router.push(`/flower/${f.slug}`)} style={styles.mini} scaleTo={0.95}>
                <Image source={{ uri: imageUrl(f.image) }} style={styles.miniImg} contentFit="cover" transition={200} />
                <T style={{ fontFamily: fonts.serif, fontSize: 16, marginTop: 8 }} color={colors.ink} numberOfLines={1}>{f.name}</T>
                <T variant="caption" numberOfLines={1}>{f.bloomWindow}</T>
              </Tap>
            ))}
          </ScrollView>
        </>
      )}

      <Gutter style={{ marginTop: 28 }}>
        <Button title="Open seasonal calendar" kind="secondary" icon="calendar-outline" onPress={() => router.push('/calendar')} />
      </Gutter>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.forest, minHeight: 170 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 30, color: colors.white, marginTop: 12 },
  heroSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  day: { flex: 1, height: 32, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  mini: { width: 132 },
  miniImg: { width: 132, height: 150, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
});
