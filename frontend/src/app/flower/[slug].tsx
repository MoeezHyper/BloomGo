import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowerCard, HeartButton, Legend, MonthStrip } from '@/components/flowers';
import { Button, Card, ErrorState, FadeIn, IconButton, Loading, Pill, SectionHeader, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { imageUrl } from '@/lib/api';
import { COLOR_SWATCH, DIFFICULTY_LABEL, SPACE_META, SUN_META, WATER_META } from '@/lib/constants';
import type { Flower, FlowerSummary } from '@/lib/types';
import { colors, fonts, radius, shadow, space } from '@/theme';

const CARE: { key: keyof Flower['care']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'water', label: 'Watering', icon: 'water-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'soil', label: 'Soil', icon: 'layers-outline' },
  { key: 'feeding', label: 'Feeding', icon: 'nutrition-outline' },
  { key: 'pruning', label: 'Pruning', icon: 'cut-outline' },
  { key: 'propagation', label: 'Propagation', icon: 'git-branch-outline' },
];

export default function FlowerDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { data, loading, error, refresh } = useFetch<{ flower: Flower; related: FlowerSummary[] }>(`/flowers/${slug}`);
  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO = 440;
  const [darkBar, setDarkBar] = useState(false);
  // Status bar icons turn dark once the cream header fades in.
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => setDarkBar(value > HERO - 120));
    return () => scrollY.removeListener(id);
  }, [scrollY]);
  const month = new Date().getMonth() + 1;
  const assistant = user?.role === 'customer' ? '/customer/assistant' : user?.role === 'admin' ? null : '/pro/assistant';

  if (loading || error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 10 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <IconButton icon="chevron-back" onPress={() => router.back()} />
        </View>
        {error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />}
      </View>
    );
  }

  const f = data.flower;
  const headerBg = scrollY.interpolate({ inputRange: [HERO - 160, HERO - 80], outputRange: [0, 1], extrapolate: 'clamp' });
  const imgScale = scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.4, 1], extrapolate: 'clamp' });
  const imgTranslate = scrollY.interpolate({ inputRange: [0, HERO], outputRange: [0, HERO * 0.4], extrapolate: 'clamp' });

  const stats = [
    { icon: SUN_META[f.sunlight].icon, label: 'Light', value: SUN_META[f.sunlight].label },
    { icon: WATER_META[f.water].icon, label: 'Water', value: WATER_META[f.water].label },
    { icon: 'ribbon-outline' as const, label: 'Care', value: DIFFICULTY_LABEL[f.difficulty] },
    { icon: 'resize-outline' as const, label: 'Height', value: f.heightCm >= 100 ? `${(f.heightCm / 100).toFixed(1)} m` : `${f.heightCm} cm` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={darkBar ? 'dark' : 'light'} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={{ height: HERO, overflow: 'hidden', backgroundColor: colors.forest }}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: imgTranslate }, { scale: imgScale }] }]}>
            <Image source={{ uri: imageUrl(f.image) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          </Animated.View>
          <LinearGradient colors={['rgba(10,22,14,0.45)', 'rgba(10,22,14,0)', 'rgba(10,22,14,0.1)', 'rgba(12,28,18,0.85)']} locations={[0, 0.25, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <Pill label={f.category} bg="rgba(255,255,255,0.92)" />
              {f.local.inSeason && <Pill label={`In season · ${f.local.city.name}`} icon="sunny-outline" bg={colors.sage} />}
            </View>
            <Text style={styles.name}>{f.name}</Text>
            <Text style={styles.sci}>
              {f.localName !== f.name ? `${f.localName} · ` : ''}
              <Text style={{ fontFamily: fonts.serifItalic }}>{f.scientificName}</Text>
            </Text>
          </View>
        </View>

        {/* Stats card overlapping the hero */}
        <FadeIn style={{ paddingHorizontal: space.gutter, marginTop: -26 }}>
          <View style={styles.stats}>
            {stats.map((s, i) => (
              <View key={s.label} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}>
                <Ionicons name={s.icon} size={20} color={colors.forest} />
                <T variant="caption" style={{ marginTop: 6, fontSize: 11 }}>{s.label}</T>
                <T style={{ fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center' }} color={colors.ink} numberOfLines={1}>{s.value}</T>
              </View>
            ))}
          </View>
        </FadeIn>

        <View style={{ paddingHorizontal: space.gutter, marginTop: 26 }}>
          <T style={{ fontFamily: fonts.serifItalic, fontSize: 21, lineHeight: 28 }} color={colors.forest}>“{f.tagline}”</T>
          <T variant="body" style={{ marginTop: 12 }}>{f.description}</T>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {f.colors.map((c) => (
              <View key={c} style={styles.colorChip}>
                <View style={[styles.swatch, { backgroundColor: COLOR_SWATCH[c] ?? colors.line }]} />
                <T style={{ fontFamily: fonts.medium, fontSize: 12 }} color={colors.text}>{c[0]!.toUpperCase() + c.slice(1)}</T>
              </View>
            ))}
            {f.fragrant && <Pill label="Fragrant" icon="flower-outline" bg={colors.blush} />}
            <Pill label={f.toxicToPets ? 'Toxic to pets' : 'Pet safe'} icon="paw-outline" bg={f.toxicToPets ? colors.dangerSoft : colors.sageSoft} fg={f.toxicToPets ? colors.danger : colors.forest} />
          </View>

          {/* Local calendar */}
          <Card style={{ marginTop: 26 }}>
            <T variant="eyebrow">Your local calendar</T>
            <T variant="heading" style={{ marginTop: 4 }}>{f.local.city.name}</T>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <View style={styles.window}>
                <Ionicons name="flower-outline" size={16} color={colors.forest} />
                <View style={{ flex: 1 }}>
                  <T variant="caption">Blooms</T>
                  <T variant="bodyStrong" style={{ fontSize: 14 }}>{f.local.bloomWindow}</T>
                </View>
              </View>
              <View style={[styles.window, { backgroundColor: colors.goldSoft }]}>
                <Ionicons name="leaf-outline" size={16} color="#7A5B1E" />
                <View style={{ flex: 1 }}>
                  <T variant="caption">Sow / plant</T>
                  <T variant="bodyStrong" style={{ fontSize: 14 }}>{f.local.sowWindow}</T>
                </View>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <MonthStrip bloom={f.local.bloomMonths} sow={f.local.sowMonths} current={month} />
            </View>
            <View style={{ marginTop: 14 }}>
              <Legend />
            </View>
            {f.local.notes.map((n) => (
              <View key={n} style={styles.note}>
                <Ionicons name="information-circle-outline" size={16} color={colors.terracotta} />
                <T variant="caption" style={{ flex: 1, color: colors.text }}>{n}</T>
              </View>
            ))}
          </Card>

          {/* Care guide */}
          <SectionHeader eyebrow="Care guide" title="How to keep it thriving" style={{ marginTop: 32 }} />
          <View style={{ gap: 10 }}>
            {CARE.map((c, i) => (
              <FadeIn key={c.key} delay={i * 40}>
                <View style={styles.care}>
                  <View style={styles.careIcon}>
                    <Ionicons name={c.icon} size={19} color={colors.forest} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="subheading" style={{ fontSize: 15 }}>{c.label}</T>
                    <T variant="body" style={{ fontSize: 14, lineHeight: 21, marginTop: 2 }}>{f.care[c.key]}</T>
                  </View>
                </View>
              </FadeIn>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <T variant="caption" style={{ width: '100%' }}>Grows well in</T>
            {f.spaces.map((s) => (
              <Pill key={s} label={SPACE_META[s].label} icon={SPACE_META[s].icon} />
            ))}
            {f.potFriendly && <Pill label="Pot friendly" icon="cube-outline" bg={colors.goldSoft} fg="#7A5B1E" />}
          </View>

          {/* Precautions */}
          <View style={styles.precautions}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.careIcon, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                <Ionicons name="shield-outline" size={19} color={colors.terracotta} />
              </View>
              <T variant="heading" style={{ fontSize: 21 }}>Precautions</T>
            </View>
            {f.precautions.map((p) => (
              <View key={p} style={styles.bullet}>
                <View style={styles.dot} />
                <T variant="body" style={{ flex: 1, fontSize: 14, lineHeight: 21 }}>{p}</T>
              </View>
            ))}
          </View>

          {/* Problems */}
          <SectionHeader eyebrow="Troubleshooting" title="Common problems" style={{ marginTop: 30 }} />
          <Card padded={false}>
            {f.problems.map((p, i) => (
              <View key={p.issue} style={[{ padding: 16 }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="bug-outline" size={16} color={colors.terracotta} />
                  <T variant="subheading" style={{ fontSize: 15 }}>{p.issue}</T>
                </View>
                <T variant="body" style={{ fontSize: 14, lineHeight: 21, marginTop: 4 }}>{p.fix}</T>
              </View>
            ))}
          </Card>

          {assistant && (
            <Button
              title={`Ask about ${f.name}`}
              icon="chatbubble-ellipses-outline"
              onPress={() => router.push({ pathname: assistant as any, params: { flower: f.slug, ask: `Tell me about ${f.name}`, t: String(Date.now()) } })}
              style={{ marginTop: 22 }}
            />
          )}
        </View>

        {data.related.length > 0 && (
          <>
            <View style={{ paddingHorizontal: space.gutter, marginTop: 36 }}>
              <SectionHeader eyebrow="You may also love" title="Similar blooms" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 14 }}>
              {data.related.map((r) => (
                <FlowerCard key={r.slug} flower={r} width={width * 0.42} />
              ))}
            </ScrollView>
          </>
        )}
      </Animated.ScrollView>

      {/* Floating header */}
      <Animated.View pointerEvents="none" style={[styles.headerBg, { height: insets.top + 64, opacity: headerBg }]}>
        <T variant="subheading" style={{ fontFamily: fonts.serif, fontSize: 20, marginTop: insets.top + 18 }}>{f.name}</T>
      </Animated.View>
      <View style={[styles.headerBtns, { top: insets.top + 8 }]}>
        <IconButton icon="chevron-back" onPress={() => router.back()} bg="rgba(255,255,255,0.94)" bordered={false} />
        <HeartButton slug={f.slug} size={44} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroText: { position: 'absolute', left: space.gutter, right: space.gutter, bottom: 46 },
  name: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 50, color: colors.white },
  sci: { fontFamily: fonts.regular, fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  stats: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 16, ...shadow },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  window: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: colors.sageSoft },
  note: { flexDirection: 'row', gap: 8, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#FBF1EC' },
  care: { flexDirection: 'row', gap: 14, padding: 16, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  careIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  precautions: { marginTop: 26, padding: 20, borderRadius: radius.lg, backgroundColor: '#FBEDE8', gap: 10 },
  bullet: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta, marginTop: 8 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.bg, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  headerBtns: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between' },
});
