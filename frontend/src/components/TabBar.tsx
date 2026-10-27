import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { colors, fonts, shadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;
export type TabIcons = Record<string, [IconName, IconName]>;

function TabItem({ focused, label, icons, onPress }: { focused: boolean; label: string; icons: [IconName, IconName]; onPress: () => void }) {
  const v = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: focused ? 1 : 0, useNativeDriver: false, speed: 18, bounciness: 6 }).start();
  }, [focused, v]);
  return (
    <Pressable onPress={onPress} style={[styles.item, { flex: focused ? 2.2 : 1 }]} hitSlop={4}>
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: v.interpolate({ inputRange: [0, 1], outputRange: ['rgba(31,61,43,0)', colors.forest] }),
            paddingHorizontal: v.interpolate({ inputRange: [0, 1], outputRange: [10, 16] }),
          },
        ]}
      >
        <Ionicons name={focused ? icons[1] : icons[0]} size={21} color={focused ? colors.white : colors.muted} />
        {focused && (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Floating, frosted tab bar used by every role's tab layout.
export function makeTabBar(icons: TabIcons) {
  return function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const keyboard = useKeyboardVisible();
    if (keyboard) return null;
    return (
      <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 4 }]} pointerEvents="box-none">
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key]?.options;
            if (!icons[route.name] || (options as any)?.href === null) return null;
            const focused = state.index === index;
            const label = (options?.title as string) ?? route.name;
            return (
              <TabItem
                key={route.key}
                focused={focused}
                label={label}
                icons={icons[route.name]!}
                onPress={() => {
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) {
                    Haptics.selectionAsync().catch(() => {});
                    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'scaleX'));
                    navigateToTab(route.key);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 66,
    borderRadius: 33,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(31,61,43,0.08)',
    ...shadow,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 46, borderRadius: 23 },
  label: { color: colors.white, fontFamily: fonts.semibold, fontSize: 13 },
});
