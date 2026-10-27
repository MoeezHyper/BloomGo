import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { CITIES, cityName } from '@/lib/constants';
import { colors, fonts, radius } from '@/theme';
import { Sheet } from './layout';
import { T, Tap } from './ui';

type IconName = keyof typeof Ionicons.glyphMap;

// Big selectable tile (garden setup, role selection).
export function OptionCard({
  icon,
  title,
  hint,
  active,
  onPress,
  tint = colors.sageSoft,
  style,
}: {
  icon: IconName;
  title: string;
  hint?: string;
  active?: boolean;
  onPress?: () => void;
  tint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Tap onPress={onPress} scaleTo={0.96} style={[styles.option, active && styles.optionActive, style]}>
      <View style={[styles.optionIcon, { backgroundColor: active ? colors.forest : tint }]}>
        <Ionicons name={icon} size={20} color={active ? colors.white : colors.forest} />
      </View>
      <T variant="bodyStrong" style={{ marginTop: 10 }}>{title}</T>
      {hint && <T variant="caption">{hint}</T>}
      {active && (
        <View style={styles.check}>
          <Ionicons name="checkmark" size={13} color={colors.white} />
        </View>
      )}
    </Tap>
  );
}

// Tappable field that opens the city sheet, with "use my location".
export function CityField({ value, onChange, label = 'City', style }: { value: string; onChange: (id: string) => void; label?: string; style?: StyleProp<ViewStyle> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={style}>
      {label && <T variant="label" style={{ marginBottom: 8 }}>{label}</T>}
      <Tap onPress={() => setOpen(true)} style={styles.field} scaleTo={0.99}>
        <Ionicons name="location-outline" size={19} color={colors.forest} />
        <T variant="bodyStrong" style={{ flex: 1 }}>{cityName(value)}</T>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Tap>
      <CitySheet visible={open} value={value} onClose={() => setOpen(false)} onSelect={(id) => { onChange(id); setOpen(false); }} />
    </View>
  );
}

export function CitySheet({ visible, value, onClose, onSelect }: { visible: boolean; value: string; onClose: () => void; onSelect: (id: string) => void }) {
  const toast = useToast();
  const [locating, setLocating] = useState(false);

  async function useLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast('Location permission was not granted.', 'error');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const r = await api<{ city: { id: string; name: string }; distanceKm: number; supported: boolean }>('/seasonal/nearest', {
        query: { lat: pos.coords.latitude, lon: pos.coords.longitude },
      });
      if (!r.supported) {
        toast(`You seem to be outside Pakistan (${r.distanceKm} km from ${r.city.name}). Please pick a city.`, 'info');
        return;
      }
      toast(`Location found: ${r.city.name}`);
      onSelect(r.city.id);
    } catch (e: any) {
      toast(e.message || 'Could not get your location.', 'error');
    } finally {
      setLocating(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Choose your city">
      <Tap onPress={useLocation} style={styles.locate} scaleTo={0.98}>
        {locating ? <ActivityIndicator color={colors.forest} /> : <Ionicons name="navigate" size={18} color={colors.forest} />}
        <T variant="bodyStrong" color={colors.forest}>Use my current location</T>
      </Tap>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
        {CITIES.map((c) => {
          const active = c.id === value;
          return (
            <Tap key={c.id} onPress={() => onSelect(c.id)} scaleTo={0.95} style={[styles.cityChip, active && { backgroundColor: colors.forest, borderColor: colors.forest }]}>
              <T style={{ fontFamily: fonts.medium, fontSize: 14 }} color={active ? colors.white : colors.ink}>{c.name}</T>
            </Tap>
          );
        })}
      </View>
    </Sheet>
  );
}

// Compact segmented control.
export function Segmented<K extends string>({ options, value, onChange, style }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.seg, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Tap key={o.key} onPress={() => onChange(o.key)} scaleTo={0.97} style={[styles.segItem, active && styles.segActive]}>
            <T style={{ fontFamily: active ? fonts.semibold : fonts.medium, fontSize: 13 }} color={active ? colors.forest : colors.muted} numberOfLines={1}>
              {o.label}
            </T>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flex: 1, padding: 14, borderRadius: radius.lg, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface, minHeight: 112 },
  optionActive: { borderColor: colors.forest, backgroundColor: '#F7FAF5' },
  optionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  field: { height: 54, borderRadius: radius.md, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  locate: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: radius.md, backgroundColor: colors.sageSoft, marginBottom: 12 },
  cityChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  seg: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: 4 },
  segItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1.5 },
});
