import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { Gutter, ListRow, Page } from '@/components/layout';
import { Avatar, Card, FadeIn, Pill, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { APP_NAME, cityName, ROLE_META, SPACE_META } from '@/lib/constants';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user, signOut } = useAuth();
  if (!user) return null;
  const role = ROLE_META[user.role];
  const isPro = user.role === 'gardener' || user.role === 'decorator';
  const defaultAddress = user.addresses.find((a) => a.isDefault);

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
          toast('Signed out. See you soon!', 'info');
        },
      },
    ]);

  return (
    <Page tabBar>
      <Gutter>
        <FadeIn>
          <View style={styles.hero}>
            <Avatar name={user.name} color={user.avatarColor} size={84} />
            <T variant="title" style={{ marginTop: 14 }} center>{user.name}</T>
            <T variant="caption" center>{user.email}</T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' }}>
              <Pill label={role.label} icon={role.icon} bg={role.tint} />
              <Pill label={cityName(user.city)} icon="location-outline" bg={colors.surface} />
            </View>
          </View>
        </FadeIn>

        <T variant="eyebrow" style={styles.group}>Account</T>
        <Card padded={false}>
          <ListRow icon="person-outline" title="Personal details" subtitle={user.phone || 'Name, phone & city'} onPress={() => router.push('/settings/edit-profile')} />
          <ListRow
            icon="location-outline"
            title="Saved addresses"
            subtitle={defaultAddress ? `${defaultAddress.label} · ${defaultAddress.line1}` : 'Add a home or event address'}
            onPress={() => router.push('/settings/addresses')}
          />
          <ListRow icon="lock-closed-outline" title="Change password" onPress={() => router.push('/settings/password')} last />
        </Card>

        {user.role === 'customer' && (
          <>
            <T variant="eyebrow" style={styles.group}>My garden</T>
            <Card padded={false}>
              <ListRow
                icon="leaf-outline"
                title="Garden profile"
                subtitle={user.garden ? `${SPACE_META[user.garden.spaceType].label} · ${cityName(user.garden.city)}` : 'Not set up yet'}
                onPress={() => router.push('/settings/garden')}
                right={!user.garden ? <Pill label="Set up" bg={colors.blush} /> : undefined}
              />
              <ListRow icon="heart-outline" title="Favourite flowers" subtitle={`${user.favorites.length} saved`} onPress={() => router.push('/favorites')} tint={colors.blush} />
              <ListRow icon="calendar-outline" title="Seasonal calendar" onPress={() => router.push('/calendar')} tint={colors.goldSoft} last />
            </Card>
          </>
        )}

        {isPro && (
          <>
            <T variant="eyebrow" style={styles.group}>Work</T>
            <Card padded={false}>
              <ListRow
                icon="briefcase-outline"
                title="Professional profile"
                subtitle={user.professional?.skills.length ? user.professional.skills.slice(0, 3).join(' · ') : 'Add skills & availability'}
                onPress={() => router.push('/settings/professional')}
              />
              <ListRow icon="heart-outline" title="Saved flowers" subtitle={`${user.favorites.length} saved`} onPress={() => router.push('/favorites')} tint={colors.blush} last />
            </Card>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <T variant="eyebrow" style={styles.group}>Administration</T>
            <Card padded={false}>
              <ListRow icon="people-outline" title="Manage users" onPress={() => router.push('/admin/users')} last />
            </Card>
          </>
        )}

        <Card padded={false} style={{ marginTop: 26 }}>
          <ListRow icon="log-out-outline" title="Sign out" onPress={confirmSignOut} danger last />
        </Card>

        <View style={styles.footer}>
          <Ionicons name="leaf" size={16} color={colors.faint} />
          <T variant="caption" center style={{ marginTop: 6 }}>{APP_NAME}</T>
          <T variant="caption" center style={{ fontSize: 11 }}>Version 1.0 · Final Year Project</T>
        </View>
      </Gutter>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 22, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, marginTop: 6 },
  group: { marginTop: 26, marginBottom: 10, marginLeft: 4 },
  footer: { alignItems: 'center', marginTop: 30 },
});
