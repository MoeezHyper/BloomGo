import { Platform } from 'react-native';

export const colors = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE8',
  forest: '#183B27',
  forestDeep: '#10281B',
  forestSoft: '#28543B',
  sage: '#DFEADE',
  sageSoft: '#EEF5ED',
  pillBadge: '#EAF3E9',
  blush: '#F7DDD6',
  blushDeep: '#E8A598',
  terracotta: '#C86E53',
  gold: '#D4A85A',
  goldSoft: '#F5EBD7',
  ink: '#15241C',
  text: '#34453B',
  muted: '#76857C',
  faint: '#ABB6AF',
  line: '#E7E0D3',
  white: '#FFFFFF',
  danger: '#B4483C',
  dangerSoft: '#F7E1DD',
  overlay: 'rgba(12, 26, 17, 0.58)',
};

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, gutter: 20 };

export const shadow = Platform.select({
  android: { elevation: 3, shadowColor: '#1F3D2B' },
  default: { shadowColor: '#1F3D2B', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
})!;

export const softShadow = Platform.select({
  android: { elevation: 1.5, shadowColor: '#1F3D2B' },
  default: { shadowColor: '#1F3D2B', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
})!;

// Room left at the bottom of tab screens for the floating tab bar.
export const TAB_BAR_SPACE = 112;
