// Return address for Google sign-in. The browser session hands the result to
// googleSignIn.ts; if the router also opens this link, just step back.
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme';

export default function GoogleAuthReturn() {
  const router = useRouter();
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
