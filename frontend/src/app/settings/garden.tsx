import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { CityField, OptionCard, Segmented } from '@/components/pickers';
import { Button, Chip, FadeIn, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { COLOR_SWATCH, SPACE_META, SUN_META } from '@/lib/constants';
import type { Garden, SpaceType, Sunlight, User } from '@/lib/types';
import { colors, fonts } from '@/theme';

const GOALS = [
  { key: 'colour', label: 'Lots of colour' },
  { key: 'fragrance', label: 'Fragrance' },
  { key: 'low-maintenance', label: 'Low maintenance' },
  { key: 'cut-flowers', label: 'Cut flowers' },
  { key: 'pollinators', label: 'Bees & butterflies' },
  { key: 'events', label: 'Event decor' },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: 26 }}>
      <T variant="subheading">{title}</T>
      {hint && <T variant="caption" style={{ marginTop: 2 }}>{hint}</T>}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

export default function GardenProfile() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const g = user?.garden;
  const [form, setForm] = useState<Garden>({
    city: g?.city ?? user?.city ?? 'lahore',
    spaceType: g?.spaceType ?? 'balcony',
    size: g?.size ?? 'small',
    sunlight: g?.sunlight ?? 'full',
    waterAccess: g?.waterAccess ?? 'easy',
    experience: g?.experience ?? 'beginner',
    hasPets: g?.hasPets ?? false,
    preferredColors: g?.preferredColors ?? [],
    goals: g?.goals ?? [],
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Garden>(k: K, v: Garden[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k: 'preferredColors' | 'goals', v: string) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  async function save() {
    setSaving(true);
    try {
      const r = await api<{ user: User }>('/profile/garden', { method: 'PUT', body: form });
      setUser(r.user);
      toast('Garden saved — your recommendations are updated 🌱');
      router.back();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <TopBar
        title={onboarding ? undefined : 'Garden profile'}
        right={
          onboarding ? (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <T style={{ fontFamily: fonts.semibold, fontSize: 15 }} color={colors.muted}>Skip</T>
            </Pressable>
          ) : undefined
        }
      />
      <Gutter>
        <FadeIn>
          <T variant="eyebrow">{onboarding ? 'Welcome aboard' : 'Personalise'}</T>
          <T variant="title" style={{ marginTop: 6 }}>{onboarding ? 'Let’s set up your garden.' : 'Your growing space'}</T>
          <T variant="body" color={colors.muted} style={{ marginTop: 6 }}>
            We use this to match flowers to your climate, sunlight and space — and to keep pets safe.
          </T>
        </FadeIn>

        <Section title="Location" hint="Climate drives what blooms when.">
          <CityField value={form.city} onChange={(v) => set('city', v)} label="" />
        </Section>

        <Section title="Where do you garden?">
          <View style={{ gap: 10 }}>
            {[(['indoor', 'balcony'] as SpaceType[]), (['rooftop', 'lawn'] as SpaceType[])].map((row) => (
              <View key={row.join()} style={{ flexDirection: 'row', gap: 10 }}>
                {row.map((k) => (
                  <OptionCard key={k} icon={SPACE_META[k].icon} title={SPACE_META[k].label} hint={SPACE_META[k].hint} active={form.spaceType === k} onPress={() => set('spaceType', k)} />
                ))}
              </View>
            ))}
          </View>
        </Section>

        <Section title="How much direct sun?">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(Object.keys(SUN_META) as Sunlight[]).map((k) => (
              <OptionCard key={k} icon={SUN_META[k].icon} title={SUN_META[k].label} hint={SUN_META[k].hint} active={form.sunlight === k} onPress={() => set('sunlight', k)} tint={colors.goldSoft} />
            ))}
          </View>
        </Section>

        <Section title="Space size">
          <Segmented
            options={[
              { key: 'small', label: 'Small' },
              { key: 'medium', label: 'Medium' },
              { key: 'large', label: 'Large' },
            ]}
            value={form.size}
            onChange={(v) => set('size', v)}
          />
        </Section>

        <Section title="Gardening experience">
          <Segmented
            options={[
              { key: 'beginner', label: 'Beginner' },
              { key: 'intermediate', label: 'Some' },
              { key: 'expert', label: 'Expert' },
            ]}
            value={form.experience}
            onChange={(v) => set('experience', v)}
          />
        </Section>

        <Section title="Water access">
          <Segmented
            options={[
              { key: 'easy', label: 'Tap nearby' },
              { key: 'limited', label: 'Limited' },
            ]}
            value={form.waterAccess ?? 'easy'}
            onChange={(v) => set('waterAccess', v)}
          />
        </Section>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 26, padding: 16, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line }}>
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong">Pets at home</T>
            <T variant="caption">We’ll flag flowers that are toxic to cats & dogs</T>
          </View>
          <Switch value={form.hasPets} onValueChange={(v) => set('hasPets', v)} trackColor={{ true: colors.forestSoft, false: colors.line }} thumbColor={form.hasPets ? colors.forest : '#fff'} />
        </View>

        <Section title="Favourite colours" hint="Optional — boosts matching flowers.">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(COLOR_SWATCH).map(([k, c]) => (
              <Chip key={k} label={k[0]!.toUpperCase() + k.slice(1)} swatch={c} active={form.preferredColors.includes(k)} onPress={() => toggleIn('preferredColors', k)} tone="sage" />
            ))}
          </View>
        </Section>

        <Section title="What matters most?">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map((goal) => (
              <Chip key={goal.key} label={goal.label} active={form.goals.includes(goal.key)} onPress={() => toggleIn('goals', goal.key)} tone="sage" />
            ))}
          </View>
        </Section>

        <Button title={onboarding ? 'Save & see my picks' : 'Save garden'} onPress={save} loading={saving} style={{ marginTop: 32 }} />
      </Gutter>
    </Page>
  );
}
