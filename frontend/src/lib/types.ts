export type Role = 'customer' | 'gardener' | 'decorator' | 'admin';
export type SpaceType = 'indoor' | 'balcony' | 'rooftop' | 'lawn';
export type Sunlight = 'full' | 'partial' | 'shade';

export interface Address {
  id: string;
  label: string;
  line1: string;
  area: string;
  city: string;
  notes: string;
  isDefault: boolean;
}

export interface Garden {
  spaceType: SpaceType;
  size: 'small' | 'medium' | 'large';
  sunlight: Sunlight;
  waterAccess?: 'easy' | 'limited';
  experience: 'beginner' | 'intermediate' | 'expert';
  hasPets: boolean;
  preferredColors: string[];
  goals: string[];
  city: string;
  updatedAt?: string;
}

export interface Professional {
  skills: string[];
  experienceYears: number;
  serviceAreas: string[];
  availableDays: string[];
  hours: string;
  bio: string;
  rate: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  city: string;
  status: 'active' | 'suspended';
  avatarColor: string;
  addresses: Address[];
  garden: Garden | null;
  professional: Professional | null;
  favorites: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface FlowerSummary {
  slug: string;
  name: string;
  localName: string;
  scientificName: string;
  category: string;
  colors: string[];
  image: string;
  tagline: string;
  difficulty: 'easy' | 'moderate' | 'expert';
  sunlight: Sunlight;
  water: 'low' | 'moderate' | 'high';
  fragrant: boolean;
  toxicToPets: boolean;
  spaces: SpaceType[];
  inSeason?: boolean;
  isFavorite?: boolean;
}

export interface Flower extends FlowerSummary {
  description: string;
  heightCm: number;
  potFriendly: boolean;
  uses: string[];
  care: Record<'water' | 'light' | 'soil' | 'feeding' | 'pruning' | 'propagation', string>;
  precautions: string[];
  problems: { issue: string; fix: string }[];
  local: {
    city: { id: string; name: string };
    bloomMonths: number[];
    sowMonths: number[];
    bloomWindow: string;
    sowWindow: string;
    inSeason: boolean;
    notes: string[];
  };
}

export interface City {
  id: string;
  name: string;
  province: string;
  zone: string;
  zoneLabel: string;
}

export interface Pick {
  slug: string;
  name: string;
  localName: string;
  image: string;
  category: string;
  difficulty: string;
  sunlight: Sunlight;
  colors: string[];
  match: number;
  status: 'blooming' | 'sow' | 'soon' | 'off';
  bloomWindow: string;
  sowWindow: string;
  reasons: string[];
  warnings: string[];
}

export interface Recommendations {
  city: City;
  month: number;
  monthName: string;
  season: { id: string; label: string };
  avgTemp: number;
  personalised: boolean;
  topPicks: Pick[];
  blooming: Pick[];
  sowNow: Pick[];
  comingSoon: Pick[];
}

export interface Weather {
  city: { id: string; name: string };
  source: 'live' | 'climate';
  current: { temp: number; feelsLike: number; humidity: number; wind: number; label: string; icon: string };
  daily: { date: string; max: number; min: number; rainChance: number; uv: number; label: string; icon: string }[];
  tips: { icon: string; tone: 'alert' | 'warm' | 'cool' | 'neutral'; title: string; text: string }[];
}
