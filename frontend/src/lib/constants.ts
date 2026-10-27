import type { Ionicons } from '@expo/vector-icons';
import type { Role } from './types';

type IconName = keyof typeof Ionicons.glyphMap;

export const APP_NAME = 'Smart Home Gardening and Decoration System';
export const APP_SHORT = 'Smart Home Gardening';

export const CITIES = [
  { id: 'lahore', name: 'Lahore' },
  { id: 'karachi', name: 'Karachi' },
  { id: 'islamabad', name: 'Islamabad' },
  { id: 'rawalpindi', name: 'Rawalpindi' },
  { id: 'faisalabad', name: 'Faisalabad' },
  { id: 'multan', name: 'Multan' },
  { id: 'peshawar', name: 'Peshawar' },
  { id: 'quetta', name: 'Quetta' },
  { id: 'hyderabad', name: 'Hyderabad' },
  { id: 'sialkot', name: 'Sialkot' },
  { id: 'bahawalpur', name: 'Bahawalpur' },
  { id: 'abbottabad', name: 'Abbottabad' },
  { id: 'swat', name: 'Swat' },
  { id: 'murree', name: 'Murree' },
  { id: 'gilgit', name: 'Gilgit' },
  { id: 'gwadar', name: 'Gwadar' },
];
export const cityName = (id?: string | null) => CITIES.find((c) => c.id === id)?.name ?? 'Lahore';

export const ROLE_META: Record<Role, { label: string; blurb: string; icon: IconName; tint: string }> = {
  customer: { label: 'Home owner', blurb: 'Grow, care and decorate at home', icon: 'home-outline', tint: '#DDE8DA' },
  gardener: { label: 'Gardener', blurb: 'Offer garden care & planting services', icon: 'leaf-outline', tint: '#F4EBD5' },
  decorator: { label: 'Decorator', blurb: 'Design ceremonies & floral decor', icon: 'sparkles-outline', tint: '#F8DCD6' },
  admin: { label: 'Administrator', blurb: 'Manage the platform', icon: 'shield-checkmark-outline', tint: '#E4DDF0' },
};

export const SPACE_META = {
  indoor: { label: 'Indoors', icon: 'home-outline' as IconName, hint: 'Rooms & windowsills' },
  balcony: { label: 'Balcony', icon: 'grid-outline' as IconName, hint: 'Pots & railings' },
  rooftop: { label: 'Rooftop', icon: 'business-outline' as IconName, hint: 'Open, sunny & windy' },
  lawn: { label: 'Lawn', icon: 'leaf-outline' as IconName, hint: 'Beds & borders' },
};

export const SUN_META = {
  full: { label: 'Full sun', icon: 'sunny-outline' as IconName, hint: '6+ hours' },
  partial: { label: 'Partial sun', icon: 'partly-sunny-outline' as IconName, hint: '3–6 hours' },
  shade: { label: 'Shade', icon: 'cloud-outline' as IconName, hint: 'Under 3 hours' },
};

export const WATER_META = {
  low: { label: 'Low water', icon: 'water-outline' as IconName },
  moderate: { label: 'Moderate', icon: 'water-outline' as IconName },
  high: { label: 'Thirsty', icon: 'water' as IconName },
};

export const DIFFICULTY_LABEL = { easy: 'Easy', moderate: 'Moderate', expert: 'Expert' };

export const COLOR_SWATCH: Record<string, string> = {
  red: '#C8414B',
  pink: '#EBA3B5',
  white: '#F4F1EA',
  yellow: '#F1C94B',
  orange: '#EC8B45',
  peach: '#F5C2A2',
  purple: '#8F6BB0',
  blue: '#6F8FD0',
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DEMO_ACCOUNTS = [
  { label: 'Home owner', email: 'sara@demo.com', password: 'Demo@123', icon: 'home-outline' as IconName },
  { label: 'Gardener', email: 'ali@demo.com', password: 'Demo@123', icon: 'leaf-outline' as IconName },
  { label: 'Decorator', email: 'hina@demo.com', password: 'Demo@123', icon: 'sparkles-outline' as IconName },
  { label: 'Admin', email: 'admin@shgds.app', password: 'Admin@123', icon: 'shield-checkmark-outline' as IconName },
];

export const homeFor = (role: Role) => (role === 'customer' ? '/customer' : role === 'admin' ? '/admin' : '/pro');

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
