import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme';
import { FadeIn, IconButton, T } from './ui';

// Shared frame for sign-in / sign-up / recovery: photo band, then a form card.
export function AuthShell({ eyebrow, title, subtitle, children, onBack }: { eyebrow: string; title: string; subtitle?: string; children: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.band}>
          <Image source={require('../../assets/images/auth.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(10,22,14,0.5)', 'rgba(10,22,14,0.1)', 'rgba(250,247,240,0)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: insets.top + 8, left: 20 }}>
            <IconButton icon="chevron-back" bg="rgba(255,255,255,0.92)" bordered={false} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/welcome')))} />
          </View>
        </View>
        <View style={styles.sheet}>
          <FadeIn>
            <T variant="eyebrow">{eyebrow}</T>
            <T variant="title" style={{ marginTop: 10 }}>{title}</T>
            {subtitle && <T variant="body" color={colors.muted} style={{ marginTop: 8 }}>{subtitle}</T>}
          </FadeIn>
          <FadeIn delay={120} style={{ marginTop: 26 }}>
            {children}
          </FadeIn>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  band: { height: 230, backgroundColor: colors.forest },
  sheet: { marginTop: -36, backgroundColor: colors.bg, borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4, paddingHorizontal: 24, paddingTop: 30 },
});
