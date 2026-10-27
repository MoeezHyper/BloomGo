import { Platform } from 'react-native';

export const colors = {
  bg: '#FAF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EFE6',
  forest: '#1F3D2B',
  forestDeep: '#142A1D',
  forestSoft: '#2E5A40',
  sage: '#DDE8DA',
  sageSoft: '#EDF3EA',
  blush: '#F8DCD6',
  blushDeep: '#E8A598',
  terracotta: '#C47A5A',
  gold: '#C9A961',
  goldSoft: '#F4EBD5',
  ink: '#1A2A20',
  text: '#33433A',
  muted: '#7A857D',
  faint: '#A9B1AA',
  line: '#E8E2D5',
  white: '#FFFFFF',
  danger: '#B4483C',
  dangerSoft: '#F7E1DD',
  overlay: 'rgba(15, 30, 20, 0.55)',
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
