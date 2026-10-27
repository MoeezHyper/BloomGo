import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular, DMSerifDisplay_400Regular_Italic } from '@expo-google-fonts/dm-serif-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <RootNavigator fontsLoaded={fontsLoaded} />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { user, ready } = useAuth();
  const loaded = fontsLoaded && ready;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  const role = user?.role;
  const isPro = role === 'gardener' || role === 'decorator';

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />

      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>

      {/* Role-based areas */}
      <Stack.Protected guard={role === 'customer'}>
        <Stack.Screen name="customer" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings/garden" />
      </Stack.Protected>
      <Stack.Protected guard={isPro}>
        <Stack.Screen name="pro" options={{ animation: 'fade' }} />
        <Stack.Screen name="settings/professional" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'admin'}>
        <Stack.Screen name="admin" options={{ animation: 'fade' }} />
        <Stack.Screen name="user/[id]" />
      </Stack.Protected>

      {/* Shared signed-in screens */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="flower/[slug]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="settings/edit-profile" />
        <Stack.Screen name="settings/addresses" />
        <Stack.Screen name="settings/address-form" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings/password" />
      </Stack.Protected>
    </Stack>
  );
}
