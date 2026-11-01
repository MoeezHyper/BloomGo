import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, FadeIn } from '@/components/ui';
import { colors, fonts } from '@/theme';

const heroImg = require('../../../assets/images/welcome_hero.jpg');

const FEATURES = [
  { icon: 'leaf-outline' as const, label: 'Curated botanicals' },
  { icon: 'sparkles-outline' as const, label: 'Spaces with soul' },
  { icon: 'shield-checkmark-outline' as const, label: 'Expert care guides' },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <StatusBar style="light" />
      <Image
        source={heroImg}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['rgba(10,22,14,0.5)', 'rgba(10,22,14,0.08)', 'rgba(10,22,14,0.35)', 'rgba(10,22,14,0.92)']}
        locations={[0, 0.22, 0.58, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.brand, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="leaf" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Smart Home Gardening</Text>
            <Text style={styles.brandSubtitle}>& DECORATION SYSTEM</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 26 }]}>
        <FadeIn delay={100}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="leaf-outline" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.eyebrow}>A greener kind of living</Text>
          </View>
        </FadeIn>
        <FadeIn delay={200}>
          <Text style={styles.title}>
            A better{'\n'}
            <Text style={{ fontFamily: fonts.serifItalic }}>everyday.</Text>
          </Text>
        </FadeIn>
        <FadeIn delay={300}>
          <Text style={styles.sub}>
            Beautiful blooms. Thoughtful spaces. Happier plants. Everything you need to bring your home to life.
          </Text>
        </FadeIn>
        <FadeIn delay={400}>
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.feature}>
                <Ionicons name={f.icon} size={13} color={colors.white} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </FadeIn>
        <FadeIn delay={500} style={{ gap: 12, marginTop: 24 }}>
          <Button
            title="Explore your green world"
            kind="light"
            iconRight="arrow-forward"
            onPress={() => router.push('/register')}
            style={{ borderRadius: 999 }}
          />
          <Button
            title="Sign in to your garden"
            kind="outlineLight"
            onPress={() => router.push('/login')}
            style={{ borderRadius: 999 }}
          />
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.white, letterSpacing: -0.2 },
  brandSubtitle: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: colors.gold, marginTop: 2 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.2, color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' },
  title: { fontFamily: fonts.serif, fontSize: 46, lineHeight: 52, color: colors.white, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.88)', marginTop: 12 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureText: { fontFamily: fonts.medium, fontSize: 12, color: colors.white },
});
