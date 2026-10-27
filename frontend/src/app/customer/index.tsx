import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FeatureCard, MatchRing } from '@/components/flowers';
import { Gutter, Page } from '@/components/layout';
import { Avatar, Button, Card, ErrorState, FadeIn, Pill, SectionHeader, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { heroImage, imageUrl } from '@/lib/api';
import { cityName, greeting, SPACE_META, SUN_META } from '@/lib/constants';
import type { Recommendations, Weather } from '@/lib/types';
import { weatherIcon } from '@/lib/weather';
import { colors, fonts, radius, shadow, space } from '@/theme';

const QUICK: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string; tint: string }[] = [
  { icon: 'book-outline', label: 'Flower\nlibrary', href: '/customer/explore', tint: colors.sageSoft },
  { icon: 'calendar-outline', label: 'Seasonal\ncalendar', href: '/calendar', tint: colors.goldSoft },
  { icon: 'chatbubbles-outline', label: 'Ask the\nassistant', href: '/customer/assistant', tint: colors.blush },
  { icon: 'heart-outline', label: 'My\nfavourites', href: '/favorites', tint: '#E4DDF0' },
];

const SERVICES = [
  { title: 'Book a gardener', subtitle: 'Vetted pros, same-week visits.', image: heroImage('container') },
  { title: 'Design an event', subtitle: 'Stages, arches & entrances.', image: heroImage('shalimar') },
  { title: 'Compose a bouquet', subtitle: 'Stem by stem, live preview.', image: heroImage('flowergarden') },
];

export default function CustomerHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const rec = useFetch<Recommendations>('/seasonal/recommendations', { g: user?.garden?.updatedAt });
  const weather = useFetch<Weather>('/seasonal/weather', { city: user?.garden?.city ?? user?.city });
  const firstName = user?.name.split(' ')[0] ?? '';
  const garden = user?.garden;
  const tip = weather.data?.tips[0];

  return (
    <Page tabBar refreshing={rec.refreshing} onRefresh={() => { rec.refresh(); weather.refresh(); }}>
      {/* Greeting */}
      <Gutter style={styles.header}>
        <View style={{ flex: 1 }}>
          <T variant="eyebrow">{greeting()}</T>
          <T variant="title" style={{ marginTop: 4 }}>{firstName}.</T>
        </View>
        <Tap onPress={() => router.push('/customer/profile')} scaleTo={0.9}>
          <Avatar name={user?.name ?? ''} color={user?.avatarColor} size={46} />
        </Tap>
      </Gutter>

      {rec.error && !rec.data && (
        <Gutter style={{ marginBottom: 14 }}>
          <Card>
            <ErrorState message={rec.error} onRetry={() => { rec.refresh(); weather.refresh(); }} />
          </Card>
        </Gutter>
      )}

      {/* Hero */}
      <FadeIn>
        <Gutter>
          <Tap onPress={() => router.push('/customer/seasonal')} style={styles.hero} scaleTo={0.985}>
            <Image source={{ uri: heroImage('rosegarden') }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient colors={['rgba(12,28,18,0.1)', 'rgba(12,28,18,0.2)', 'rgba(12,28,18,0.85)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
            {rec.data && (
              <View style={styles.heroBadge}>
                <Ionicons name="location" size={12} color={colors.forest} />
                <Text style={styles.heroBadgeText}>{rec.data.city.name} · {rec.data.season.label}</Text>
              </View>
            )}
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>Nature’s latest chapter</Text>
              <Text style={styles.heroTitle}>
                Meet the {rec.data ? <Text style={{ fontFamily: fonts.serifItalic }}>{rec.data.season.label.toLowerCase()}</Text> : 'seasonal'} edit.
              </Text>
              <View style={styles.heroCta}>
                <Text style={styles.heroCtaText}>See what’s blooming</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.forest} style={{ transform: [{ rotate: '-45deg' }] }} />
              </View>
            </View>
          </Tap>
        </Gutter>
      </FadeIn>

      {/* Weather strip */}
      {weather.data && (
        <FadeIn delay={80}>
          <Gutter style={{ marginTop: 14 }}>
            <Card onPress={() => router.push('/customer/seasonal')} style={styles.weather} padded={false}>
              <View style={styles.weatherTemp}>
                <Ionicons name={weatherIcon(weather.data.current.icon)} size={22} color={colors.forest} />
                <Text style={styles.weatherDeg}>{weather.data.current.temp}°</Text>
              </View>
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong" numberOfLines={1}>{tip?.title ?? weather.data.current.label}</T>
                <T variant="caption" numberOfLines={2}>{tip?.text}</T>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Card>
          </Gutter>
        </FadeIn>
      )}

      {/* Quick actions */}
      <Gutter style={styles.quick}>
        {QUICK.map((q, i) => (
          <FadeIn key={q.label} delay={120 + i * 50} style={{ flex: 1 }}>
            <Tap onPress={() => router.push(q.href as any)} style={styles.quickItem} scaleTo={0.94}>
              <View style={[styles.quickIcon, { backgroundColor: q.tint }]}>
                <Ionicons name={q.icon} size={22} color={colors.forest} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Tap>
          </FadeIn>
        ))}
      </Gutter>

      {/* Garden profile */}
      <Gutter style={{ marginTop: 26 }}>
        {garden ? (
          <Card style={styles.garden} onPress={() => router.push('/settings/garden')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <T variant="eyebrow">Your garden</T>
                <T variant="heading" style={{ marginTop: 4 }}>{SPACE_META[garden.spaceType].label} in {cityName(garden.city)}</T>
              </View>
              <View style={styles.editDot}>
                <Ionicons name="create-outline" size={17} color={colors.forest} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <Pill icon={SUN_META[garden.sunlight].icon} label={SUN_META[garden.sunlight].label} />
              <Pill icon="resize-outline" label={`${garden.size[0]!.toUpperCase()}${garden.size.slice(1)} space`} />
              <Pill icon="ribbon-outline" label={garden.experience[0]!.toUpperCase() + garden.experience.slice(1)} />
              {garden.hasPets && <Pill icon="paw-outline" label="Pet-safe picks" bg={colors.blush} />}
            </View>
          </Card>
        ) : (
          <Tap onPress={() => router.push('/settings/garden')} style={styles.setup} scaleTo={0.98}>
            <View style={{ flex: 1 }}>
              <T variant="eyebrow" color={colors.sage}>Personalise</T>
              <T variant="heading" color={colors.white} style={{ marginTop: 6 }}>Tell us about your space</T>
              <T variant="caption" color="rgba(255,255,255,0.8)" style={{ marginTop: 4 }}>Balcony, rooftop or lawn? We’ll match flowers to your sun, space and city.</T>
            </View>
            <View style={styles.setupArrow}>
              <Ionicons name="arrow-forward" size={20} color={colors.forest} />
            </View>
          </Tap>
        )}
      </Gutter>

      {/* Top picks */}
      <Gutter style={{ marginTop: 32 }}>
        <SectionHeader
          eyebrow={rec.data ? `In season · ${rec.data.city.name}` : 'In season'}
          title={rec.data?.personalised ? 'Picked for your garden' : 'Blooming this month'}
          action="See all"
          onAction={() => router.push('/customer/seasonal')}
        />
      </Gutter>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 14 }} decelerationRate="fast" snapToInterval={width * 0.58 + 14}>
        {(rec.data?.topPicks ?? []).map((p) => (
          <Tap key={p.slug} onPress={() => router.push(`/flower/${p.slug}`)} style={[styles.pick, { width: width * 0.58 }]} scaleTo={0.97}>
            <Image source={{ uri: imageUrl(p.image) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient colors={['rgba(10,25,15,0)', 'rgba(12,32,20,0.88)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', top: 12, right: 12 }}>
              <MatchRing value={p.match} size={48} light />
            </View>
            <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
              <Text style={styles.pickStatus}>{p.status === 'sow' ? 'Sow now' : p.status === 'soon' ? 'Next month' : 'Blooming now'}</Text>
              <Text style={styles.pickName}>{p.name}</Text>
              <Text style={styles.pickReason} numberOfLines={2}>{p.reasons[1] ?? p.reasons[0]}</Text>
            </View>
          </Tap>
        ))}
        {!rec.data && !rec.error && [0, 1].map((i) => <View key={i} style={[styles.pick, { width: width * 0.58, backgroundColor: colors.surfaceAlt }]} />)}
      </ScrollView>

      {/* Services preview */}
      <Gutter style={{ marginTop: 34 }}>
        <SectionHeader eyebrow="Coming soon" title="More ways to bloom" />
      </Gutter>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 14 }}>
        {SERVICES.map((s, i) => (
          <FeatureCard key={s.title} title={s.title} subtitle={s.subtitle} image={s.image} width={width * 0.62} height={i === 1 ? 250 : 230} badge="Soon" />
        ))}
      </ScrollView>

      {/* Editorial */}
      <Gutter style={{ marginTop: 34 }}>
        <View style={styles.editorial}>
          <Image source={{ uri: heroImage('butchart') }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          <LinearGradient colors={['rgba(12,28,18,0.82)', 'rgba(12,28,18,0.35)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.heroEyebrow}>The art of everyday living</Text>
          <Text style={[styles.heroTitle, { fontSize: 28, lineHeight: 33 }]}>A little help.{'\n'}A whole lot of heart.</Text>
          <Text style={styles.editorialText}>Questions about watering, pests or yellow leaves? Our plant assistant knows every flower in the library.</Text>
          <Button title="Ask the assistant" kind="light" small iconRight="arrow-forward" onPress={() => router.push('/customer/assistant')} style={{ alignSelf: 'flex-start', marginTop: 16 }} />
        </View>
      </Gutter>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  hero: { height: 360, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.forest },
  heroBadge: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(250,247,240,0.95)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  heroBadgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.forest },
  heroBody: { position: 'absolute', left: 22, right: 22, bottom: 22 },
  heroEyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.2, color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 41, color: colors.white },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, marginTop: 16 },
  heroCtaText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.forest },
  weather: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  weatherTemp: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  weatherDeg: { fontFamily: fonts.serif, fontSize: 20, color: colors.forest, marginTop: -2 },
  quick: { flexDirection: 'row', gap: 10, marginTop: 22 },
  quickItem: { alignItems: 'center', gap: 8 },
  quickIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.text, textAlign: 'center' },
  garden: { backgroundColor: colors.surface },
  editDot: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  setup: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.forest, borderRadius: radius.xl, padding: 22, ...shadow },
  setupArrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  pick: { height: 300, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.forest },
  pickStatus: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: colors.sage, textTransform: 'uppercase' },
  pickName: { fontFamily: fonts.serif, fontSize: 27, lineHeight: 32, color: colors.white, marginTop: 4 },
  pickReason: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  editorial: { borderRadius: radius.xl, overflow: 'hidden', padding: 24, minHeight: 280, justifyContent: 'flex-end', backgroundColor: colors.forest },
  editorialText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.88)', marginTop: 10 },
});
