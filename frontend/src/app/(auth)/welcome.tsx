import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, FadeIn } from '@/components/ui';
import { colors, fonts } from '@/theme';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'flower-outline', label: 'Seasonal picks' },
  { icon: 'book-outline', label: 'Care guides' },
  { icon: 'sparkles-outline', label: 'Event decor' },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <StatusBar style="light" />
      <Image source={require('../../../assets/images/welcome.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient
        colors={['rgba(10,22,14,0.55)', 'rgba(10,22,14,0.05)', 'rgba(10,22,14,0.7)', 'rgba(12,28,18,0.98)']}
        locations={[0, 0.22, 0.48, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.brand, { paddingTop: insets.top + 14 }]}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={18} color={colors.forest} />
        </View>
        <View>
          <Text style={styles.brandName}>Smart Home Gardening</Text>
          <Text style={styles.brandSub}>& DECORATION SYSTEM</Text>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <FadeIn delay={100}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="leaf-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.eyebrow}>A greener kind of living</Text>
          </View>
        </FadeIn>
        <FadeIn delay={220}>
          <Text style={styles.title}>
            Let something{'\n'}
            <Text style={{ fontFamily: fonts.serifItalic }}>beautiful</Text> grow.
          </Text>
        </FadeIn>
        <FadeIn delay={340}>
          <Text style={styles.sub}>Seasonal flowers matched to your city, expert care guides and a plant assistant — all in one place.</Text>
        </FadeIn>
        <FadeIn delay={440}>
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.feature}>
                <Ionicons name={f.icon} size={14} color={colors.white} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </FadeIn>
        <FadeIn delay={540} style={{ gap: 12, marginTop: 26 }}>
          <Button title="Create your account" kind="light" iconRight="arrow-forward" onPress={() => router.push('/register')} />
          <Button title="I already have an account" kind="outlineLight" onPress={() => router.push('/login')} />
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24 },
  logo: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: fonts.serif, fontSize: 19, color: colors.white },
  brandSub: { fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 2.4, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 2.4, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' },
  title: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 54, color: colors.white, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: 'rgba(255,255,255,0.86)', marginTop: 14 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  featureText: { fontFamily: fonts.medium, fontSize: 12, color: colors.white },
});
