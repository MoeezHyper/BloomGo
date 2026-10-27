import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { Button, Chip, FadeIn, Input, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { CITIES } from '@/lib/constants';
import type { User } from '@/lib/types';
import { colors, fonts } from '@/theme';

const SKILLS = {
  gardener: ['Lawn care', 'Planting', 'Pruning', 'Pest control', 'Soil & fertiliser', 'Landscaping', 'Irrigation', 'Indoor plants', 'Rooftop gardens'],
  decorator: ['Mehndi & Nikah decor', 'Stage design', 'Entrance arches', 'Petal work', 'Table centrepieces', 'Birthday decor', 'Corporate events', 'Car decoration'],
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProfessionalProfile() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const p = user?.professional;
  const kind = user?.role === 'decorator' ? 'decorator' : 'gardener';
  const [skills, setSkills] = useState<string[]>(p?.skills ?? []);
  const [areas, setAreas] = useState<string[]>(p?.serviceAreas ?? [user?.city ?? 'lahore']);
  const [days, setDays] = useState<string[]>(p?.availableDays ?? []);
  const [hours, setHours] = useState(p?.hours ?? '');
  const [years, setYears] = useState(p?.experienceYears ? String(p.experienceYears) : '');
  const [rate, setRate] = useState(p?.rate ? String(p.rate) : '');
  const [bio, setBio] = useState(p?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function save() {
    setSaving(true);
    try {
      const r = await api<{ user: User }>('/profile/professional', {
        method: 'PUT',
        body: { skills, serviceAreas: areas, availableDays: days, hours, experienceYears: Number(years) || 0, rate: Number(rate) || 0, bio },
      });
      setUser(r.user);
      toast('Professional profile saved');
      router.back();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page keyboard>
      <TopBar
        title={onboarding ? undefined : 'Professional profile'}
        right={onboarding ? <Pressable onPress={() => router.back()} hitSlop={10}><T style={{ fontFamily: fonts.semibold, fontSize: 15 }} color={colors.muted}>Skip</T></Pressable> : undefined}
      />
      <Gutter>
        <FadeIn>
          <T variant="eyebrow">{kind === 'gardener' ? 'Gardener profile' : 'Decorator profile'}</T>
          <T variant="title" style={{ marginTop: 6 }}>{onboarding ? 'Show customers what you do best.' : 'Your services'}</T>
          <T variant="body" color={colors.muted} style={{ marginTop: 6 }}>A complete profile helps you get matched with the right jobs.</T>
        </FadeIn>

        <T variant="subheading" style={{ marginTop: 26, marginBottom: 12 }}>Skills</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SKILLS[kind].map((s) => (
            <Chip key={s} label={s} active={skills.includes(s)} onPress={() => toggle(skills, setSkills, s)} tone="sage" />
          ))}
        </View>

        <T variant="subheading" style={{ marginTop: 26, marginBottom: 12 }}>Available days</T>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {DAYS.map((d) => (
            <Chip key={d} label={d} active={days.includes(d)} onPress={() => toggle(days, setDays, d)} style={{ flex: 1, paddingHorizontal: 0, justifyContent: 'center' }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Input label="Experience (years)" icon="ribbon-outline" value={years} onChangeText={setYears} keyboardType="number-pad" style={{ flex: 1 }} />
          <Input label={kind === 'gardener' ? 'Rate / visit (Rs)' : 'Starting price (Rs)'} icon="cash-outline" value={rate} onChangeText={setRate} keyboardType="number-pad" style={{ flex: 1 }} />
        </View>
        <Input label="Working hours" icon="time-outline" placeholder="e.g. 9:00 AM – 5:00 PM" value={hours} onChangeText={setHours} style={{ marginTop: 16 }} />

        <T variant="subheading" style={{ marginTop: 26, marginBottom: 12 }}>Service areas</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CITIES.map((c) => (
            <Chip key={c.id} label={c.name} active={areas.includes(c.id)} onPress={() => toggle(areas, setAreas, c.id)} tone="sage" />
          ))}
        </View>

        <Input label="About you" icon="chatbox-ellipses-outline" placeholder="Tell customers about your experience and style…" value={bio} onChangeText={setBio} multiline style={{ marginTop: 22 }} />

        <Button title="Save profile" onPress={save} loading={saving} style={{ marginTop: 28 }} />
      </Gutter>
    </Page>
  );
}
