import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, IconName> = {
  sunny: 'sunny-outline',
  partly: 'partly-sunny-outline',
  cloudy: 'cloudy-outline',
  fog: 'cloudy-outline',
  rain: 'rainy-outline',
  snow: 'snow-outline',
  storm: 'thunderstorm-outline',
};

export const weatherIcon = (icon: string): IconName => ICONS[icon] ?? 'partly-sunny-outline';
