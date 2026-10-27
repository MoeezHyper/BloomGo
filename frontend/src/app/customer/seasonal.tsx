import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickCard } from '@/components/flowers';
import { Gutter, Page } from '@/components/layout';
import { CitySheet, Segmented } from '@/components/pickers';
import { Chip, EmptyState, ErrorState, FadeIn, Loading, SectionHeader, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { heroImage } from '@/lib/api';
import { SPACE_META } from '@/lib/constants';
import type { Recommendations, SpaceType, Weather } from '@/lib/types';
import { weatherIcon } from '@/lib/weather';
import { colors, fonts, radius, space } from '@/theme';

const SEASON_IMG = { winter: 'keukenhof', spring: 'flowergarden', summer: 'butchart', monsoon: 'greenhouse', autumn: 'cottage' } as const;
const TONE = {
  alert: { bg: '#FBE7E2', fg: colors.danger },
  warm: { bg: colors.goldSoft, fg: '#7A5B1E' },
  cool: { bg: '#E3EEF2', fg: '#2F5D6E' },
  neutral: { bg: colors.sageSoft, fg: colors.forest },
};
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Seasonal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.garden?.city ?? user?.city ?? 'lahore');
  const [spaceType, setSpaceType] = useState<SpaceType | undefined>(user?.garden?.spaceType);
  const [tab, setTab] = useState<'blooming' | 'sowNow' | 'comingSoon'>('blooming');
  const [pickCity, setPickCity] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const focused = useIsFocused();

  useEffect(() => {
    if (user?.garden) {
      setCity(user.garden.city);
      setSpaceType(user.garden.spaceType);
    }
  }, [user?.garden]);

  const rec = useFetch<Recommendations>('/seasonal/recommendations', { city, space: spaceType });
  const weather = useFetch<Weather>('/seasonal/weather', { city });
  const r = rec.data;
  const w = weather.data;
  const list = r ? r[tab] : [];

  return (
    <Page
      tabBar
      edgeTop={false}
      scrollEventThrottle={32}
      onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 380)}
      overlay={<StatusScrim visible={scrolled} />}
      refreshing={rec.refreshing} onRefresh={() => { rec.refresh(); weather.refresh(); }}>
      {focused && <StatusBar style={scrolled ? 'dark' : 'light'} />}
      {/* Season hero */}
      <View style={styles.hero}>
        <Image source={{ uri: heroImage(SEASON_IMG[(r?.season.id ?? 'autumn') as keyof typeof SEASON_IMG] ?? 'cottage') }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient colors={['rgba(12,28,18,0.6)', 'rgba(12,28,18,0.35)', 'rgba(12,28,18,0.92)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <Gutter style={{ paddingTop: insets.top + 14 }}>
          <Tap onPress={() => setPickCity(true)} style={styles.cityPill} scaleTo={0.95}>
            <Ionicons name="location" size={14} color={colors.forest} />
            <Text style={styles.cityText}>{r?.city.name ?? '…'}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.forest} />
          </Tap>
          <Text style={styles.eyebrow}>{r ? `${r.season.label} · ${r.monthName}` : 'Seasonal guide'}</Text>
          <Text style={styles.title}>What to grow{'\n'}right now.</Text>
          {r && <Text style={styles.sub}>{r.city.zoneLabel} climate · avg {r.avgTemp}°C this month</Text>}

          {w && (
            <View style={styles.weatherCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name={weatherIcon(w.current.icon)} size={34} color={colors.white} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.temp}>{w.current.temp}°</Text>
                  <Text style={styles.cond}>{w.current.label} · feels {w.current.feelsLike}°</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.meta}><Ionicons name="water-outline" size={12} /> {w.current.humidity}%</Text>
                  <Text style={styles.meta}><Ionicons name="flag-outline" size={12} /> {w.current.wind} km/h</Text>
                </View>
              </View>
              <View style={styles.forecast}>
                {w.daily.slice(0, 7).map((d, i) => (
                  <View key={d.date} style={{ alignItems: 'center', flex: 1, gap: 4 }}>
                    <Text style={styles.day}>{i === 0 ? 'Today' : DAY[new Date(d.date).getDay()]}</Text>
                    <Ionicons name={weatherIcon(d.icon)} size={17} color={colors.white} />
                    <Text style={styles.dayTemp}>{d.max}°</Text>
                    <Text style={[styles.day, { opacity: 0.65 }]}>{d.min}°</Text>
                  </View>
                ))}
              </View>
              {w.source === 'climate' && <Text style={[styles.day, { marginTop: 8 }]}>Offline — showing climate averages</Text>}
            </View>
          )}
        </Gutter>
      </View>

      {/* Weather tips */}
      {w && (
        <>
          <Gutter style={{ marginTop: 26 }}>
            <SectionHeader eyebrow="Weather-wise care" title="This week’s garden tips" />
          </Gutter>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 12 }}>
            {w.tips.map((t, i) => (
              <FadeIn key={t.title} delay={i * 60}>
                <View style={[styles.tip, { backgroundColor: TONE[t.tone].bg }]}>
                  <View style={styles.tipIcon}>
                    <Ionicons name={(t.icon + '-outline') in Ionicons.glyphMap ? ((t.icon + '-outline') as any) : (t.icon as any)} size={19} color={TONE[t.tone].fg} />
                  </View>
                  <T variant="subheading" style={{ marginTop: 12 }} color={TONE[t.tone].fg}>{t.title}</T>
                  <T variant="caption" style={{ marginTop: 4, color: colors.text, lineHeight: 19 }}>{t.text}</T>
                </View>
              </FadeIn>
            ))}
          </ScrollView>
        </>
      )}

      {/* Space suitability */}
      <Gutter style={{ marginTop: 30 }}>
        <SectionHeader eyebrow="Space suitability" title="Where are you growing?" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(SPACE_META) as SpaceType[]).map((k) => (
            <Chip key={k} label={SPACE_META[k].label} icon={SPACE_META[k].icon} active={spaceType === k} onPress={() => setSpaceType(spaceType === k ? undefined : k)} />
          ))}
        </View>
        {!user?.garden && (
          <Tap onPress={() => router.push('/settings/garden')} style={styles.personalise} haptic={false}>
            <Ionicons name="sparkles-outline" size={16} color={colors.forest} />
            <T variant="caption" style={{ flex: 1, color: colors.forest }}>Set up your garden profile for sunlight & pet-aware matches.</T>
            <Ionicons name="chevron-forward" size={16} color={colors.forest} />
          </Tap>
        )}
      </Gutter>

      {/* Recommendations */}
      <Gutter style={{ marginTop: 30 }}>
        <SectionHeader eyebrow={r?.personalised ? 'Matched to your garden' : 'In-season flowers'} title="Recommended for you" action="Calendar" onAction={() => router.push({ pathname: '/calendar', params: { city } })} />
        <Segmented
          options={[
            { key: 'blooming', label: `Blooming${r ? ` · ${r.blooming.length}` : ''}` },
            { key: 'sowNow', label: `Sow now${r ? ` · ${r.sowNow.length}` : ''}` },
            { key: 'comingSoon', label: `Next${r ? ` · ${r.comingSoon.length}` : ''}` },
          ]}
          value={tab}
          onChange={setTab}
          style={{ marginBottom: 16 }}
        />
        {rec.loading && !r ? (
          <Loading />
        ) : rec.error ? (
          <ErrorState message={rec.error} onRetry={rec.refresh} />
        ) : list.length === 0 ? (
          <EmptyState icon="flower-outline" title="Nothing here this month" text="Try another tab or check the seasonal calendar." />
        ) : (
          <View style={{ gap: 12 }}>
            {list.slice(0, 12).map((p, i) => (
              <FadeIn key={p.slug} delay={Math.min(i, 6) * 50}>
                <PickCard pick={p} />
              </FadeIn>
            ))}
          </View>
        )}
      </Gutter>

      <CitySheet visible={pickCity} value={city} onClose={() => setPickCity(false)} onSelect={(id) => { setCity(id); setPickCity(false); }} />
    </Page>
  );
}

function StatusScrim({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.bg, opacity: 0.96 }} />;
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 22, backgroundColor: colors.forest, borderBottomLeftRadius: radius.xl + 4, borderBottomRightRadius: radius.xl + 4, overflow: 'hidden' },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  cityText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.forest },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.2, color: colors.sage, textTransform: 'uppercase', marginTop: 22 },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 45, color: colors.white, marginTop: 8 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  weatherCard: { marginTop: 22, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  temp: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36, color: colors.white },
  cond: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  forecast: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  day: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  dayTemp: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
  tip: { width: 230, minHeight: 170, padding: 16, borderRadius: radius.lg },
  tipIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  personalise: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.sageSoft },
});
