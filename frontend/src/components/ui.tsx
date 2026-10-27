// Core building blocks shared across every screen.
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts, radius, softShadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// ---------- Typography ----------
type Variant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'caption' | 'eyebrow' | 'label';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 44, color: colors.ink, letterSpacing: -0.5 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.ink, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 29, color: colors.ink },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.text },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.ink },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.forestSoft, letterSpacing: 2.2, textTransform: 'uppercase' },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.text },
};

export function T({ variant = 'body', style, color, center, ...rest }: TextProps & { variant?: Variant; color?: string; center?: boolean }) {
  return <Text {...rest} style={[variantStyle[variant], color && { color }, center && { textAlign: 'center' }, style]} />;
}

// ---------- Pressable with scale feedback ----------
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Tap({ children, style, onPress, haptic = true, scaleTo = 0.97, disabled, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; haptic?: boolean; scaleTo?: number; children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------- Button ----------
type ButtonKind = 'primary' | 'secondary' | 'outline' | 'ghost' | 'light' | 'outlineLight' | 'danger';

const btnColors: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.forest, fg: colors.white },
  secondary: { bg: colors.sage, fg: colors.forest },
  outline: { bg: 'transparent', fg: colors.forest, border: colors.forest },
  ghost: { bg: 'transparent', fg: colors.forest },
  light: { bg: colors.white, fg: colors.forest },
  outlineLight: { bg: 'rgba(255,255,255,0.08)', fg: colors.white, border: 'rgba(255,255,255,0.7)' },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = btnColors[kind];
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: c.bg, borderColor: c.border ?? 'transparent', borderWidth: c.border ? 1.2 : 0, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={c.fg} />}
          <Text style={[styles.btnText, small && { fontSize: 14 }, { color: c.fg }]}>{title}</Text>
          {iconRight && <Ionicons name={iconRight} size={small ? 15 : 17} color={c.fg} />}
        </>
      )}
    </Tap>
  );
}

// ---------- Icon button ----------
export function IconButton({
  icon,
  onPress,
  size = 44,
  color = colors.ink,
  bg = colors.surface,
  style,
  bordered = true,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  bordered?: boolean;
}) {
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.9}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        bordered && { borderWidth: 1, borderColor: colors.line },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </Tap>
  );
}

// ---------- Text input ----------
export function Input({
  label,
  icon,
  error,
  secure,
  style,
  right,
  ...rest
}: TextInputProps & { label?: string; icon?: IconName; error?: string | null; secure?: boolean; right?: ReactNode }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={style}>
      {label && <T variant="label" style={{ marginBottom: 8 }}>{label}</T>}
      <View style={[styles.input, focused && styles.inputFocused, !!error && { borderColor: colors.danger }, rest.multiline && { height: undefined, minHeight: 104, alignItems: 'flex-start', paddingVertical: 14 }]}>
        {icon && <Ionicons name={icon} size={19} color={focused ? colors.forest : colors.faint} style={rest.multiline ? { marginTop: 2 } : undefined} />}
        <TextInput
          placeholderTextColor={colors.faint}
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.inputText, rest.multiline && { textAlignVertical: 'top' }]}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={19} color={colors.muted} />
          </Pressable>
        )}
        {right}
      </View>
      {!!error && <T variant="caption" color={colors.danger} style={{ marginTop: 6 }}>{error}</T>}
    </View>
  );
}

// ---------- Chip ----------
export function Chip({
  label,
  active,
  onPress,
  icon,
  swatch,
  style,
  tone = 'forest',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  swatch?: string;
  style?: StyleProp<ViewStyle>;
  tone?: 'forest' | 'sage';
}) {
  const activeBg = tone === 'forest' ? colors.forest : colors.sage;
  const activeFg = tone === 'forest' ? colors.white : colors.forest;
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.chip,
        { backgroundColor: active ? activeBg : colors.surface, borderColor: active ? activeBg : colors.line },
        style,
      ]}
    >
      {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
      {icon && <Ionicons name={icon} size={15} color={active ? activeFg : colors.text} />}
      <Text style={[styles.chipText, { color: active ? activeFg : colors.text }]}>{label}</Text>
    </Tap>
  );
}

// ---------- Pill / badge ----------
export function Pill({ label, icon, bg = colors.sageSoft, fg = colors.forest, style }: { label: string; icon?: IconName; bg?: string; fg?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ---------- Card ----------
export function Card({ children, style, onPress, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean }) {
  const s = [styles.card, padded && { padding: 18 }, style];
  return onPress ? (
    <Tap onPress={onPress} style={s} scaleTo={0.98}>
      {children}
    </Tap>
  ) : (
    <View style={s}>{children}</View>
  );
}

// ---------- Section header ----------
export function SectionHeader({ eyebrow, title, action, onAction, style }: { eyebrow?: string; title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }, style]}>
      <View style={{ flex: 1 }}>
        {eyebrow && <T variant="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</T>}
        <T variant="heading">{title}</T>
      </View>
      {action && (
        <Pressable onPress={onAction} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 3 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.forest }}>{action}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.forest} style={{ transform: [{ rotate: '-45deg' }] }} />
        </Pressable>
      )}
    </View>
  );
}

// ---------- Avatar ----------
export function Avatar({ name, color = colors.blush, size = 44 }: { name: string; color?: string; size?: number }) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.34, color: colors.forest }}>{letters}</Text>
    </View>
  );
}

// ---------- Fade-in on mount ----------
export function FadeIn({ children, delay = 0, style, distance = 14 }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle>; distance?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 480, delay, useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// ---------- States ----------
export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
      <ActivityIndicator color={colors.forest} size="large" />
      {label && <T variant="caption">{label}</T>}
    </View>
  );
}

export function EmptyState({ icon = 'leaf-outline', title, text, action, onAction }: { icon?: IconName; title: string; text?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Ionicons name={icon} size={30} color={colors.forest} />
      </View>
      <T variant="heading" center>{title}</T>
      {text && <T variant="body" center color={colors.muted} style={{ marginTop: 6 }}>{text}</T>}
      {action && <Button title={action} onPress={onAction} small style={{ marginTop: 18 }} />}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <EmptyState icon="cloud-offline-outline" title="Couldn’t load this" text={message} action={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}

const styles = StyleSheet.create({
  btn: {
    height: 54,
    borderRadius: radius.md,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSmall: { height: 42, paddingHorizontal: 16, borderRadius: 12 },
  btnText: { fontFamily: fonts.semibold, fontSize: 16 },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputFocused: { borderColor: colors.forest, backgroundColor: '#FFFFFF' },
  inputText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  chip: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 14 },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.medium, fontSize: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, ...softShadow },
});
