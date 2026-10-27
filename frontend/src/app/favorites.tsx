import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { FlowerCard } from '@/components/flowers';
import { Gutter, Page, TopBar } from '@/components/layout';
import { EmptyState, ErrorState, FadeIn, Loading, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import type { FlowerSummary } from '@/lib/types';
import { colors, space } from '@/theme';

export default function Favorites() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch<{ flowers: FlowerSummary[] }>('/flowers/favorites/list');
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );
  const cardW = (width - space.gutter * 2 - 14) / 2;
  // Hide hearts removed on this screen straight away.
  const flowers = (data?.flowers ?? []).filter((f) => user?.favorites.includes(f.slug));
  const explore = user?.role === 'customer' ? '/customer/explore' : user?.role === 'admin' ? '/admin/explore' : '/pro/explore';

  return (
    <Page>
      <TopBar title="Favourites" />
      <Gutter>
        <T variant="eyebrow">Your collection</T>
        <T variant="title" style={{ marginTop: 6, marginBottom: 6 }}>Flowers you love.</T>
        <T variant="body" color={colors.muted} style={{ marginBottom: 20 }}>{flowers.length} saved</T>
        {loading && !data ? (
          <Loading />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : flowers.length === 0 ? (
          <EmptyState icon="heart-outline" title="No favourites yet" text="Tap the heart on any flower to save it here." action="Browse the library" onAction={() => router.push(explore as any)} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 22 }}>
            {flowers.map((f, i) => (
              <FadeIn key={f.slug} delay={i * 40}>
                <FlowerCard flower={f} width={cardW} />
              </FadeIn>
            ))}
          </View>
        )}
      </Gutter>
    </Page>
  );
}
