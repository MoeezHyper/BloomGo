import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, TAB_BAR_SPACE } from '@/theme';
import { IconButton, T, Tap } from './ui';

type IconName = keyof typeof Ionicons.glyphMap;

// Scrollable page with safe-area padding and optional pull-to-refresh.
export function Page({
  children,
  tabBar,
  refreshing,
  onRefresh,
  contentStyle,
  edgeTop = true,
  keyboard,
  overlay,
  ...rest
}: ScrollViewProps & {
  children: ReactNode;
  tabBar?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  edgeTop?: boolean;
  keyboard?: boolean;
  overlay?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const scroll = (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        { paddingTop: edgeTop ? insets.top + 8 : 0, paddingBottom: (tabBar ? TAB_BAR_SPACE : 32) + insets.bottom },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.forest} colors={[colors.forest]} progressViewOffset={insets.top} /> : undefined}
      {...rest}
    >
      {children}
    </ScrollView>
  );
  // Keeps scrolled content from running under the transparent status bar.
  const scrim = edgeTop ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.bg, opacity: 0.96 }} /> : null;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={keyboard && Platform.OS === 'ios' ? 'padding' : undefined} enabled={!!keyboard}>
      {scroll}
      {scrim}
      {overlay}
    </KeyboardAvoidingView>
  );
}

export const Gutter = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ paddingHorizontal: space.gutter }, style]}>{children}</View>
);

// Stack screen header: round back button, optional centred title and right slot.
export function TopBar({ title, right, onBack, light }: { title?: string; right?: ReactNode; onBack?: () => void; light?: boolean }) {
  const router = useRouter();
  return (
    <View style={styles.topbar}>
      <IconButton
        icon="chevron-back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        bg={light ? 'rgba(255,255,255,0.92)' : colors.surface}
      />
      {title ? (
        <T variant="subheading" style={{ flex: 1, textAlign: 'center', fontSize: 17 }} numberOfLines={1}>
          {title}
        </T>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

// Bottom sheet built on Modal.
export function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,30,20,0.4)' }]} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          {title && (
            <View style={styles.sheetHead}>
              <T variant="heading">{title}</T>
              <IconButton icon="close" size={38} onPress={onClose} />
            </View>
          )}
          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer && <View style={{ paddingHorizontal: space.gutter, paddingTop: 12 }}>{footer}</View>}
        </View>
      </View>
    </Modal>
  );
}

// Row used in settings-style lists.
export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  tint = colors.sageSoft,
  danger,
  last,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  tint?: string;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Tap onPress={onPress} scaleTo={0.985} style={[styles.row, !last && styles.rowBorder]}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.dangerSoft : tint }]}>
        <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong" color={danger ? colors.danger : colors.ink}>{title}</T>
        {subtitle && <T variant="caption" numberOfLines={1}>{subtitle}</T>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.faint} />)}
    </Tap>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingBottom: 12, gap: 12 },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 10 },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
