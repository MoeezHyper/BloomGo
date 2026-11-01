import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FlowerCard, MatchRing } from '@/components/flowers';
import { Gutter, Page } from '@/components/layout';
import { Avatar, Button, Card, Chip, ErrorState, FadeIn, Pill, SectionHeader, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { heroImage, imageUrl } from '@/lib/api';
import { cityName, greeting, SPACE_META, SUN_META } from '@/lib/constants';
import type { Recommendations, Weather } from '@/lib/types';
import { weatherIcon } from '@/lib/weather';
import { colors, fonts, radius, shadow, space } from '@/theme';

const diningImg = require('../../../assets/images/lifestyle_dining.jpg');
const gardenerImg = require('../../../assets/images/lifestyle_gardener.jpg');

const INSPIRATION_CARDS = [
  {
    tag: 'In season, in love',
    eyebrow: "NATURE'S LATEST CHAPTER",
    title: 'Meet the autumn edit.',
    subtitle: 'Warm palettes and late blooms',
    image: heroImage('rosegarden'),
    href: '/customer/seasonal',
  },
  {
    tag: 'A greener home',
    eyebrow: 'INDOOR BOTANICALS',
    title: 'Find your leafy love.',
    subtitle: 'Plants for every sunny corner',
    image: heroImage('greenhouse'),
    href: '/customer/explore',
  },
  {
    tag: 'Made by you',
    eyebrow: 'FLORAL ARTISTRY',
    title: 'Say it with flowers.',
    subtitle: 'Your stems. Your story.',
    image: heroImage('flowergarden'),
    href: '/customer/explore',
  },
  {
    tag: 'Care & craft',
    eyebrow: 'EXPERT CARE',
    title: 'Book a gardener.',
    subtitle: 'Vetted pros, same-week visits.',
    image: heroImage('container'),
    href: '/customer/assistant',
  },
];

const CATEGORIES = ['All', 'Garden flowers', 'Indoor plants', 'Fresh bouquets'];

export default function CustomerHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const rec = useFetch<Recommendations>('/seasonal/recommendations', { g: user?.garden?.updatedAt });
  const weather = useFetch<Weather>('/seasonal/weather', { city: user?.garden?.city ?? user?.city });
  const garden = user?.garden;
  const tip = weather.data?.tips[0];

  const cardW = (width - space.gutter * 2 - 14) / 2;

  return (
    <Page tabBar refreshing={rec.refreshing} onRefresh={() => { rec.refresh(); weather.refresh(); }}>
      {/* Brand Header */}
      <Gutter style={styles.brandHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={17} color={colors.white} />
          </View>
          <View>
            <Text style={styles.brandLogo}>Smart Home Gardening</Text>
            <Text style={styles.brandLogoSub}>& DECORATION SYSTEM</Text>
          </View>
        </View>
        <Tap onPress={() => router.push('/customer/profile')} scaleTo={0.9}>
          <View style={styles.avatarBorder}>
            <Avatar name={user?.name ?? ''} color={user?.avatarColor ?? colors.sageSoft} size={42} />
          </View>
        </Tap>
      </Gutter>

      {/* Main Editorial Headline */}
      <Gutter style={{ marginTop: 6, marginBottom: 18 }}>
        <T variant="eyebrow" style={{ color: colors.forestSoft }}>A little inspiration</T>
        <Text style={styles.mainHeading}>
          Let something{'\n'}
          <Text style={{ fontFamily: fonts.serifItalic }}>beautiful</Text> grow.
        </Text>
        <Text style={styles.subHeading}>
          Find your next bloom, your perfect corner, your new beginning.
        </Text>
      </Gutter>

      {/* Horizontal Inspiration Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 14 }}
        decelerationRate="fast"
        snapToInterval={width * 0.72 + 14}
      >
        {INSPIRATION_CARDS.map((card, idx) => (
          <Tap
            key={card.title}
            onPress={() => router.push(card.href as any)}
            style={[styles.inspoCard, { width: width * 0.72 }]}
            scaleTo={0.98}
          >
            <Image source={{ uri: card.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            <LinearGradient
              colors={['rgba(15,30,20,0.05)', 'rgba(15,30,20,0.25)', 'rgba(12,28,18,0.88)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* Top pill badge */}
            <View style={styles.inspoBadge}>
              <Text style={styles.inspoBadgeText}>{card.tag}</Text>
            </View>

            {/* Bottom editorial content */}
            <View style={styles.inspoBottom}>
              <Text style={styles.inspoEyebrow}>{card.eyebrow}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <Text style={styles.inspoTitle}>{card.title}</Text>
                <View style={styles.inspoArrow}>
                  <Ionicons name="arrow-forward" size={14} color={colors.forest} style={{ transform: [{ rotate: '-45deg' }] }} />
                </View>
              </View>
              <Text style={styles.inspoSub}>{card.subtitle}</Text>
            </View>
          </Tap>
        ))}
      </ScrollView>

      {/* Weather Strip */}
      {weather.data && (
        <FadeIn delay={80}>
          <Gutter style={{ marginTop: 22 }}>
            <Card onPress={() => router.push('/customer/seasonal')} style={styles.weatherCard} padded={false}>
              <View style={styles.weatherTempBox}>
                <Ionicons name={weatherIcon(weather.data.current.icon)} size={22} color={colors.forest} />
                <Text style={styles.weatherDegText}>{weather.data.current.temp}°</Text>
              </View>
              <View style={{ flex: 1, paddingRight: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.weatherCity}>{rec.data?.city.name ?? 'Live Weather'}</Text>
                  <Text style={styles.weatherDot}>·</Text>
                  <Text style={styles.weatherCondition}>{weather.data.current.label}</Text>
                </View>
                <T variant="caption" numberOfLines={2} style={{ marginTop: 2, color: colors.text }}>
                  {tip?.text ?? 'Check ideal water and sunlight requirements for today.'}
                </T>
              </View>
              <View style={styles.weatherArrow}>
                <Ionicons name="chevron-forward" size={16} color={colors.forest} />
              </View>
            </Card>
          </Gutter>
        </FadeIn>
      )}

      {/* "Find your next favorite" Section */}
      <Gutter style={{ marginTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Find your next favorite.</Text>
            <Text style={styles.sectionSub}>
              Extraordinary blooms and beautiful greenery, thoughtfully selected.
            </Text>
          </View>
          <View style={styles.greenWorldPill}>
            <Ionicons name="leaf-outline" size={12} color={colors.forest} />
            <Text style={styles.greenWorldText}>Your green world</Text>
          </View>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 14, paddingBottom: 4 }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => {
                setActiveCategory(cat);
                if (cat !== 'All') {
                  router.push({ pathname: '/customer/explore', params: { category: cat === 'Garden flowers' ? 'Perennial' : cat === 'Indoor plants' ? 'Indoor' : 'All' } });
                }
              }}
            />
          ))}
        </ScrollView>
      </Gutter>

      {/* Horizontal Top Picks Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 14, marginTop: 16 }}
        decelerationRate="fast"
      >
        {(rec.data?.topPicks ?? []).map((p, idx) => (
          <Tap
            key={p.slug}
            onPress={() => router.push(`/flower/${p.slug}`)}
            style={[styles.flowerPickCard, { width: width * 0.52 }]}
            scaleTo={0.97}
          >
            <View style={[styles.flowerPickImgWrap, idx % 2 === 1 && styles.flowerPickArch]}>
              <Image source={{ uri: imageUrl(p.image) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
              <View style={styles.flowerPickBadge}>
                <Text style={styles.flowerPickBadgeText}>
                  {p.status === 'sow' ? 'Sow now' : p.status === 'soon' ? 'Next month' : 'Seasonal favorite'}
                </Text>
              </View>
              <View style={styles.matchScoreBadge}>
                <MatchRing value={p.match} size={42} stroke={3} light />
              </View>
            </View>
            <View style={{ paddingTop: 10, paddingHorizontal: 4 }}>
              <Text style={styles.flowerPickName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.flowerPickCategory} numberOfLines={1}>{p.category} · {SUN_META[p.sunlight]?.label ?? 'Sunlight'}</Text>
            </View>
          </Tap>
        ))}
      </ScrollView>

      {/* Lifestyle Feature: "Make room for beautiful moments." */}
      <FadeIn delay={150}>
        <Gutter style={{ marginTop: 36 }}>
          <View style={styles.lifestyleCard}>
            <Image source={diningImg} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient
              colors={['rgba(10,22,14,0.35)', 'rgba(10,22,14,0.25)', 'rgba(10,22,14,0.9)']}
              locations={[0, 0.38, 0.88]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.lifestyleEyebrow}>THE ART OF EVERYDAY LIVING</Text>
            <Text style={styles.lifestyleTitle}>
              Make room for{'\n'}
              <Text style={{ fontFamily: fonts.serifItalic }}>beautiful</Text> moments.
            </Text>
            <Text style={styles.lifestyleSub}>
              A table to gather around. Flowers that say something. A little beauty, just because.
            </Text>
            <Tap
              onPress={() => router.push('/customer/explore')}
              style={styles.lifestyleBtn}
              scaleTo={0.95}
            >
              <Text style={styles.lifestyleBtnText}>Set the scene</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.forest} style={{ transform: [{ rotate: '-45deg' }] }} />
            </Tap>
          </View>
        </Gutter>
      </FadeIn>

      {/* Editorial: "A little help. A whole lot of heart." */}
      <FadeIn delay={200}>
        <Gutter style={{ marginTop: 32 }}>
          <View style={styles.gardenerCard}>
            <Image source={gardenerImg} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient
              colors={['rgba(10,22,14,0.35)', 'rgba(10,22,14,0.25)', 'rgba(10,22,14,0.9)']}
              locations={[0, 0.38, 0.88]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.lifestyleEyebrow}>GOOD PEOPLE. GROWING THINGS.</Text>
            <Text style={styles.lifestyleTitle}>
              A little help.{'\n'}A whole lot of heart.
            </Text>
            <Text style={styles.lifestyleSub}>
              Some people just have a way with growing things. Meet the thoughtful hands behind healthier plants, beautiful gardens, and a little more time for you.
            </Text>
            <Tap
              onPress={() => router.push('/customer/assistant')}
              style={styles.gardenerBtn}
              scaleTo={0.95}
            >
              <Text style={styles.gardenerBtnText}>Meet your garden people</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.white} />
            </Tap>
          </View>
        </Gutter>
      </FadeIn>

      {/* Garden Profile Card */}
      <Gutter style={{ marginTop: 32, marginBottom: 20 }}>
        {garden ? (
          <Card style={styles.gardenProfileCard} onPress={() => router.push('/settings/garden')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <T variant="eyebrow" style={{ color: colors.forestSoft }}>Your personal garden</T>
                <T variant="heading" style={{ marginTop: 4, fontSize: 21 }}>
                  {SPACE_META[garden.spaceType].label} in {cityName(garden.city)}
                </T>
              </View>
              <View style={styles.editCircle}>
                <Ionicons name="create-outline" size={16} color={colors.forest} />
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
          <Tap onPress={() => router.push('/settings/garden')} style={styles.setupCard} scaleTo={0.98}>
            <View style={{ flex: 1 }}>
              <T variant="eyebrow" color={colors.sage}>Personalise</T>
              <T variant="heading" color={colors.white} style={{ marginTop: 6 }}>Tell us about your space</T>
              <T variant="caption" color="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>
                Balcony, rooftop or lawn? We’ll match flowers to your sun, space and city.
              </T>
            </View>
            <View style={styles.setupArrowCircle}>
              <Ionicons name="arrow-forward" size={18} color={colors.forest} />
            </View>
          </Tap>
        )}
      </Gutter>
    </Page>
  );
}

const styles = StyleSheet.create({
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginBottom: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  brandLogo: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink, letterSpacing: -0.3, lineHeight: 22 },
  brandLogoSub: { fontFamily: fonts.semibold, fontSize: 9.5, letterSpacing: 1.4, color: colors.forestSoft, textTransform: 'uppercase' },
  avatarBorder: { borderWidth: 1.5, borderColor: colors.forest, borderRadius: 24, padding: 2 },
  mainHeading: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subHeading: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    marginTop: 6,
  },
  inspoCard: {
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.forest,
  },
  inspoBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  inspoBadgeText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.forest },
  inspoBottom: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  inspoEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inspoTitle: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 28, color: colors.white, flex: 1 },
  inspoArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inspoSub: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.86)', marginTop: 4 },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  weatherTempBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherDegText: { fontFamily: fonts.serif, fontSize: 18, color: colors.forest, marginTop: -2 },
  weatherCity: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  weatherDot: { color: colors.muted, fontSize: 12 },
  weatherCondition: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  weatherArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 29, color: colors.ink },
  sectionSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 3 },
  greenWorldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.sageSoft,
  },
  greenWorldText: { fontFamily: fonts.medium, fontSize: 11, color: colors.forest },
  flowerPickCard: { borderRadius: 20 },
  flowerPickImgWrap: { height: 210, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  flowerPickArch: { borderTopLeftRadius: 65, borderTopRightRadius: 65 },
  flowerPickBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  flowerPickBadgeText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.forest },
  matchScoreBadge: { position: 'absolute', top: 8, right: 8 },
  flowerPickName: { fontFamily: fonts.serif, fontSize: 17, color: colors.ink },
  flowerPickCategory: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  lifestyleCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 22,
    minHeight: 280,
    justifyContent: 'flex-end',
    backgroundColor: colors.forest,
  },
  lifestyleEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  lifestyleTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.white },
  lifestyleSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.88)', marginTop: 8 },
  lifestyleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 16,
  },
  lifestyleBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.forest },
  gardenerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 22,
    minHeight: 290,
    justifyContent: 'flex-end',
    backgroundColor: colors.forest,
  },
  gardenerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.forest,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gardenerBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  gardenProfileCard: { backgroundColor: colors.surface, borderRadius: 20 },
  editCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.forest,
    borderRadius: 22,
    padding: 20,
    ...shadow,
  },
  setupArrowCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});