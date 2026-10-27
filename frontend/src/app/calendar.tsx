import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ComponentRef, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Legend, MonthStrip } from '@/components/flowers';
import { Gutter, Page, TopBar } from '@/components/layout';
import { CitySheet, Segmented } from '@/components/pickers';
import { Card, EmptyState, ErrorState, FadeIn, Loading, Pill, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { imageUrl } from '@/lib/api';
import { cityName, MONTHS } from '@/lib/constants';
import { colors, fonts, radius, space } from '@/theme';

type CalFlower = { slug: string; name: string; localName: string; image: string; category: string; bloom: number[]; sow: number[]; notes: string[] };
type Calendar = { city: { id: string; name: string; zoneLabel: string }; temps: number[]; seasons: { id: string; label: string }[]; flowers: CalFlower[] };

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ city?: string }>();
  const [city, setCity] = useState(params.city ?? user?.garden?.city ?? user?.city ?? 'lahore');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [mode, setMode] = useState<'bloom' | 'sow'>('bloom');
  const [pick, setPick] = useState(false);
  const { data, loading, error, refresh } = useFetch<Calendar>('/seasonal/calendar', { city });
  const monthsRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const list = useMemo(() => (data ? data.flowers.filter((f) => (mode === 'bloom' ? f.bloom : f.sow).includes(month)) : []), [data, mode, month]);
  const maxT = data ? Math.max(...data.temps) : 40;
  const minT = data ? Math.min(...data.temps) : 0;

  return (
    <Page>
      <TopBar title="Seasonal calendar" />
      <Gutter>
        <T variant="eyebrow">Plan your year</T>
        <T variant="title" style={{ marginTop: 6 }}>A year of blooms in</T>
        <Tap onPress={() => setPick(true)} style={styles.cityRow} haptic={false}>
          <T variant="title" color={colors.forest} style={{ fontFamily: fonts.serifItalic, textDecorationLine: 'underline' }}>{cityName(city)}</T>
          <T variant="title" color={colors.forest}> ▾</T>
        </Tap>
        {data && <T variant="caption">{data.city.zoneLabel} climate · monthly average temperatures</T>}
      </Gutter>

      {/* Temperature + month picker */}
      {data && (
        <ScrollView
          ref={monthsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={() => monthsRef.current?.scrollTo({ x: Math.max(0, (month - 3) * 70), animated: false })}
          contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, paddingVertical: 18 }}
        >
          {MONTHS.map((m, i) => {
            const active = month === i + 1;
            const t = data.temps[i]!;
            const h = 18 + ((t - minT) / Math.max(1, maxT - minT)) * 46;
            return (
              <Tap key={m} onPress={() => setMonth(i + 1)} style={[styles.month, active && styles.monthActive]} scaleTo={0.93}>
                <Text style={[styles.temp, active && { color: colors.white }]}>{t}°</Text>
                <View style={{ height: 64, justifyContent: 'flex-end' }}>
                  <View style={{ width: 8, height: h, borderRadius: 4, backgroundColor: active ? colors.sage : t >= 30 ? colors.terracotta : t <= 12 ? '#8DB3C2' : colors.gold }} />
                </View>
                <Text style={[styles.monthLabel, active && { color: colors.white }]}>{m}</Text>
                <Text style={[styles.season, active && { color: colors.sage }]} numberOfLines={1}>{data.seasons[i]!.label}</Text>
              </Tap>
            );
          })}
        </ScrollView>
      )}

      <Gutter>
        <Segmented
          options={[
            { key: 'bloom', label: `In bloom · ${data ? data.flowers.filter((f) => f.bloom.includes(month)).length : 0}` },
            { key: 'sow', label: `Sow / plant · ${data ? data.flowers.filter((f) => f.sow.includes(month)).length : 0}` },
          ]}
          value={mode}
          onChange={setMode}
        />
        <View style={{ marginTop: 14, marginBottom: 16 }}>
          <Legend />
        </View>

        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : list.length === 0 ? (
          <EmptyState icon="calendar-outline" title={`Quiet month for ${mode === 'bloom' ? 'blooms' : 'sowing'}`} text="Pick another month to plan ahead." />
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((f, i) => (
              <FadeIn key={f.slug} delay={Math.min(i, 8) * 35}>
                <Card padded={false} onPress={() => router.push(`/flower/${f.slug}`)} style={styles.row}>
                  <Image source={{ uri: imageUrl(f.image) }} style={styles.thumb} contentFit="cover" transition={200} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <T variant="subheading" style={{ fontFamily: fonts.serif, fontSize: 18 }} numberOfLines={1}>{f.name}</T>
                      <Pill label={f.category} />
                    </View>
                    <MonthStrip bloom={f.bloom} sow={f.sow} current={month} compact />
                    {f.notes[0] && <T variant="caption" numberOfLines={1} color={colors.terracotta}>{f.notes[0]}</T>}
                  </View>
                </Card>
              </FadeIn>
            ))}
          </View>
        )}
      </Gutter>

      <CitySheet visible={pick} value={city} onClose={() => setPick(false)} onSelect={(id) => { setCity(id); setPick(false); }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  cityRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6, alignSelf: 'flex-start' },
  month: { width: 62, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', gap: 6 },
  monthActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  temp: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  monthLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  season: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted, maxWidth: 56 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  thumb: { width: 58, height: 58, borderRadius: 14, backgroundColor: colors.surfaceAlt },
});
