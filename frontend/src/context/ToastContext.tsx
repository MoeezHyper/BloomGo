import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '@/theme';

type Tone = 'success' | 'error' | 'info';
type ToastFn = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ToastFn>(() => {});

const TONES: Record<Tone, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  success: { bg: colors.forest, fg: colors.white, icon: 'checkmark-circle' },
  error: { bg: colors.danger, fg: colors.white, icon: 'alert-circle' },
  info: { bg: colors.ink, fg: colors.white, icon: 'information-circle' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; tone: Tone } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ToastFn>(
    (message, tone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, tone });
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 16 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, Math.min(6000, 2200 + message.length * 35));
    },
    [anim]
  );

  const t = toast ? TONES[toast.tone] : null;
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && t && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              top: insets.top + 10,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
            },
          ]}
        >
          <View style={[styles.toast, { backgroundColor: t.bg }]}>
            <Ionicons name={t.icon} size={20} color={t.fg} />
            <Text style={[styles.text, { color: t.fg }]}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    maxWidth: 480,
    ...shadow,
  },
  text: { fontFamily: fonts.medium, fontSize: 14, flexShrink: 1, lineHeight: 20 },
});
