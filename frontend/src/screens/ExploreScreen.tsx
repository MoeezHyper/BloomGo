import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { FlowerCard } from '@/components/flowers';
import { Gutter, Page, Sheet } from '@/components/layout';
import { Button, Chip, EmptyState, ErrorState, FadeIn, Input, Loading, Pill, T, Tap } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { COLOR_SWATCH, DIFFICULTY_LABEL, SPACE_META, SUN_META } from '@/lib/constants';
import type { FlowerSummary } from '@/lib/types';
import { colors, space } from '@/theme';

const CATEGORIES = ['All', 'Annual', 'Perennial', 'Shrub', 'Climber', 'Bulb', 'Indoor'];

type Filters = { sunlight?: string; difficulty?: string; space?: string; color?: string; petSafe?: boolean; fragrant?: boolean; inSeason?: boolean };

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [filters, setFilters] = useState<Filters>({});
  const [draft, setDraft] = useState<Filters>({});
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useMemo(
    () => ({
      q,
      category: category === 'All' ? undefined : category,
      ...filters,
      petSafe: filters.petSafe ? 'true' : undefined,
      fragrant: filters.fragrant ? 'true' : undefined,
      inSeason: filters.inSeason ? 'true' : undefined,
    }),
    [q, category, filters]
  );
  const { data, loading, error, refresh, refreshing } = useFetch<{ total: number; city: { name: string }; flowers: FlowerSummary[] }>('/flowers', query as any);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const cardW = (width - space.gutter * 2 - 14) / 2;

  const toggle = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: d[k] === v ? undefined : v }));

  return (
    <Page tabBar refreshing={refreshing} onRefresh={refresh} stickyHeaderIndices={[1]}>
      <Gutter>
        <T variant="eyebrow">The flower library</T>
        <T variant="display" style={{ marginTop: 6 }}>Find your next{'\n'}favourite.</T>
        <T variant="body" color={colors.muted} style={{ marginTop: 6 }}>
          Extraordinary blooms and care guides{user ? `, matched to ${data?.city.name ?? 'your city'}` : ''}.
        </T>
      </Gutter>

      <View style={{ backgroundColor: colors.bg, paddingTop: 18, paddingBottom: 10 }}>
        <Gutter style={{ flexDirection: 'row', gap: 10 }}>
          <Input
            style={{ flex: 1 }}
            icon="search-outline"
            placeholder="Find something lovely…"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            right={search ? <Ionicons name="close-circle" size={18} color={colors.faint} onPress={() => setSearch('')} /> : undefined}
          />
          <Tap
            onPress={() => {
              setDraft(filters);
              setSheet(true);
            }}
            style={[styles.filterBtn, activeCount > 0 && { backgroundColor: colors.forest, borderColor: colors.forest }]}
            scaleTo={0.92}
          >
            <Ionicons name="options-outline" size={21} color={activeCount ? colors.white : colors.forest} />
            {activeCount > 0 && (
              <View style={styles.badge}>
                <T style={{ fontSize: 10, color: colors.forest, fontFamily: 'DMSans_700Bold' }}>{activeCount}</T>
              </View>
            )}
          </Tap>
        </Gutter>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 8, paddingTop: 14 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
      </View>

      <Gutter style={{ marginTop: 8 }}>
        {data && (
          <View style={styles.countRow}>
            <T variant="caption">{data.total} {data.total === 1 ? 'flower' : 'flowers'}</T>
            {activeCount > 0 && (
              <Tap onPress={() => setFilters({})} haptic={false}>
                <Pill label="Clear filters" icon="close" bg={colors.blush} fg={colors.forest} />
              </Tap>
            )}
          </View>
        )}
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : data && data.flowers.length === 0 ? (
          <EmptyState icon="search-outline" title="Nothing matched" text="Try a different name or clear some filters." action="Clear all" onAction={() => { setFilters({}); setSearch(''); setCategory('All'); }} />
        ) : (
          <View style={styles.grid}>
            {data?.flowers.map((f, i) => (
              <FadeIn key={f.slug} delay={Math.min(i, 8) * 40}>
                <FlowerCard flower={f} width={cardW} arch={i % 4 === 1} />
              </FadeIn>
            ))}
          </View>
        )}
      </Gutter>

      <Sheet
        visible={sheet}
        onClose={() => setSheet(false)}
        title="Refine"
        footer={
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button title="Reset" kind="secondary" style={{ flex: 1 }} onPress={() => setDraft({})} />
            <Button
              title="Show results"
              style={{ flex: 2 }}
              onPress={() => {
                setFilters(draft);
                setSheet(false);
              }}
            />
          </View>
        }
      >
        <FilterGroup title="Quick filters">
          <Chip label="In season now" icon="sunny-outline" active={!!draft.inSeason} onPress={() => toggle('inSeason', true)} />
          <Chip label="Pet safe" icon="paw-outline" active={!!draft.petSafe} onPress={() => toggle('petSafe', true)} />
          <Chip label="Fragrant" icon="flower-outline" active={!!draft.fragrant} onPress={() => toggle('fragrant', true)} />
        </FilterGroup>
        <FilterGroup title="Sunlight">
          {(Object.keys(SUN_META) as (keyof typeof SUN_META)[]).map((k) => (
            <Chip key={k} label={SUN_META[k].label} icon={SUN_META[k].icon} active={draft.sunlight === k} onPress={() => toggle('sunlight', k)} />
          ))}
        </FilterGroup>
        <FilterGroup title="Where it grows">
          {(Object.keys(SPACE_META) as (keyof typeof SPACE_META)[]).map((k) => (
            <Chip key={k} label={SPACE_META[k].label} icon={SPACE_META[k].icon} active={draft.space === k} onPress={() => toggle('space', k)} />
          ))}
        </FilterGroup>
        <FilterGroup title="Difficulty">
          {(Object.keys(DIFFICULTY_LABEL) as (keyof typeof DIFFICULTY_LABEL)[]).map((k) => (
            <Chip key={k} label={DIFFICULTY_LABEL[k]} active={draft.difficulty === k} onPress={() => toggle('difficulty', k)} />
          ))}
        </FilterGroup>
        <FilterGroup title="Colour">
          {Object.entries(COLOR_SWATCH).map(([k, c]) => (
            <Chip key={k} label={k[0]!.toUpperCase() + k.slice(1)} swatch={c} active={draft.color === k} onPress={() => toggle('color', k)} />
          ))}
        </FilterGroup>
      </Sheet>
    </Page>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <T variant="label" style={{ marginBottom: 10 }}>{title}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBtn: { width: 54, height: 54, borderRadius: 16, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, minHeight: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 },
});
