// Flower-specific presentation components.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { imageUrl } from '@/lib/api';
import { MONTHS, SUN_META } from '@/lib/constants';
import type { FlowerSummary, Pick } from '@/lib/types';
import { colors, fonts, radius, shadow } from '@/theme';
import { Pill, T, Tap } from './ui';

export function HeartButton({ slug, size = 38, style }: { slug: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const { user, toggleFavorite } = useAuth();
  const toast = useToast();
  const active = !!user?.favorites.includes(slug);
  return (
    <Tap
      scaleTo={0.8}
      onPress={async () => {
        try {
          const now = await toggleFavorite(slug);
          if (now) toast('Saved to your favourites');
        } catch (e: any) {
          toast(e.message, 'error');
        }
      }}
      style={[styles.heart, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
      <Ionicons name={active ? 'heart' : 'heart-outline'} size={size * 0.5} color={active ? colors.terracotta : colors.forest} />
    </Tap>
  );
}

// Grid card: image with tag + heart, serif name below.
export function FlowerCard({ flower, width, arch, style }: { flower: FlowerSummary; width: number; arch?: boolean; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const h = width * 1.22;
  return (
    <Tap onPress={() => router.push(`/flower/${flower.slug}`)} style={[{ width }, style]} scaleTo={0.97}>
      <View style={[styles.cardImg, { height: h }, arch && { borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }]}>
        <Image source={{ uri: imageUrl(flower.image) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        {flower.inSeason ? (
          <Pill label="In season" icon="sunny-outline" style={[styles.tag, arch && { top: width * 0.3 }]} bg="rgba(237,243,234,0.95)" />
        ) : flower.fragrant ? (
          <Pill label="Fragrant" style={[styles.tag, arch && { top: width * 0.3 }]} bg="rgba(248,220,214,0.95)" fg={colors.forest} />
        ) : null}
        <HeartButton slug={flower.slug} style={styles.cardHeart} size={36} />
      </View>
      <View style={{ paddingTop: 10, paddingHorizontal: 2 }}>
        <T variant="subheading" style={{ fontFamily: fonts.serif, fontSize: 19, lineHeight: 24 }} numberOfLines={1}>
          {flower.name}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Ionicons name={SUN_META[flower.sunlight].icon} size={13} color={colors.muted} />
          <T variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {flower.localName !== flower.name ? `${flower.localName} · ` : ''}
            {flower.category}
          </T>
        </View>
      </View>
    </Tap>
  );
}

// Tall editorial card with gradient overlay (used in horizontal carousels).
export function FeatureCard({
  title,
  subtitle,
  image,
  width = 220,
  height = 290,
  onPress,
  badge,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  image: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  badge?: string;
  eyebrow?: string;
}) {
  return (
    <Tap onPress={onPress} style={[styles.feature, { width, height }]} scaleTo={0.97}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      <LinearGradient colors={['rgba(10,25,15,0)', 'rgba(10,25,15,0.15)', 'rgba(12,32,20,0.88)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      {badge && <Pill label={badge} style={{ position: 'absolute', top: 14, left: 14 }} bg="rgba(255,255,255,0.92)" />}
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
        {eyebrow && <Text style={styles.featureEyebrow}>{eyebrow}</Text>}
        <Text style={styles.featureTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.featureSub} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
    </Tap>
  );
}

export function MatchRing({ value, size = 52, stroke = 4, light }: { value: number; size?: number; stroke?: number; light?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = value >= 80 ? colors.forest : value >= 60 ? colors.gold : colors.terracotta;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={light ? 'rgba(255,255,255,0.25)' : colors.line} strokeWidth={stroke} fill={light ? 'rgba(0,0,0,0.25)' : colors.surface} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={light ? colors.white : tone}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(c * value) / 100} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.26, color: light ? colors.white : colors.ink }}>
        {value}
        <Text style={{ fontSize: size * 0.16 }}>%</Text>
      </Text>
    </View>
  );
}

const STATUS = {
  blooming: { label: 'Blooming now', bg: colors.sageSoft, fg: colors.forest, icon: 'flower-outline' as const },
  sow: { label: 'Sow now', bg: colors.goldSoft, fg: '#7A5B1E', icon: 'leaf-outline' as const },
  soon: { label: 'Next month', bg: colors.blush, fg: '#8A3F31', icon: 'time-outline' as const },
  off: { label: 'Off season', bg: colors.surfaceAlt, fg: colors.muted, icon: 'moon-outline' as const },
};

// Recommendation row with match ring and the reasons behind it.
export function PickCard({ pick }: { pick: Pick }) {
  const router = useRouter();
  const s = STATUS[pick.status];
  return (
    <Tap onPress={() => router.push(`/flower/${pick.slug}`)} style={styles.pick} scaleTo={0.98}>
      <Image source={{ uri: imageUrl(pick.image) }} style={styles.pickImg} contentFit="cover" transition={250} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <T variant="subheading" style={{ fontFamily: fonts.serif, fontSize: 19 }} numberOfLines={1}>
              {pick.name}
            </T>
            <Pill label={s.label} icon={s.icon} bg={s.bg} fg={s.fg} style={{ marginTop: 4 }} />
          </View>
          <MatchRing value={pick.match} size={50} />
        </View>
        {pick.reasons.slice(0, 2).map((r) => (
          <View key={r} style={styles.reason}>
            <Ionicons name="checkmark" size={14} color={colors.forest} />
            <T variant="caption" style={{ flex: 1, color: colors.text }} numberOfLines={2}>
              {r}
            </T>
          </View>
        ))}
        {pick.warnings[0] && (
          <View style={styles.reason}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.terracotta} />
            <T variant="caption" style={{ flex: 1, color: colors.terracotta }} numberOfLines={2}>
              {pick.warnings[0]}
            </T>
          </View>
        )}
      </View>
    </Tap>
  );
}

// 12-month strip: bloom months in forest, sowing months in gold.
export function MonthStrip({ bloom, sow, current, compact }: { bloom: number[]; sow: number[]; current?: number; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: compact ? 2 : 4 }}>
      {MONTHS.map((m, i) => {
        const month = i + 1;
        const isBloom = bloom.includes(month);
        const isSow = sow.includes(month);
        const bg = isBloom ? colors.forest : isSow ? colors.gold : colors.surfaceAlt;
        return (
          <View key={m} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
            <View
              style={{
                height: compact ? 8 : 30,
                alignSelf: 'stretch',
                borderRadius: compact ? 3 : 8,
                backgroundColor: bg,
                borderWidth: current === month ? 2 : 0,
                borderColor: colors.terracotta,
              }}
            />
            {!compact && (
              <Text style={{ fontFamily: current === month ? fonts.bold : fonts.medium, fontSize: 10, color: current === month ? colors.terracotta : colors.muted }}>
                {m[0]}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function Legend() {
  const item = (c: string, l: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: c }} />
      <T variant="caption">{l}</T>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
      {item(colors.forest, 'In bloom')}
      {item(colors.gold, 'Sow / plant')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 12, height: 12, borderRadius: 4, borderWidth: 2, borderColor: colors.terracotta }} />
        <T variant="caption">This month</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heart: { backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  cardImg: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  tag: { position: 'absolute', top: 12, left: 12 },
  cardHeart: { position: 'absolute', bottom: 12, right: 12 },
  feature: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.forest },
  featureEyebrow: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginBottom: 6 },
  featureTitle: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 30, color: colors.white },
  featureSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  pick: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
    elevation: 1.5,
  },
  pickImg: { width: 96, height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
});
