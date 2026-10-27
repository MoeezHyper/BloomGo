import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { Gutter, Page, TopBar } from '@/components/layout';
import { Button, Card, EmptyState, FadeIn, IconButton, Pill, T } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { cityName } from '@/lib/constants';
import type { Address } from '@/lib/types';
import { colors } from '@/theme';

const LABEL_ICON: Record<string, keyof typeof Ionicons.glyphMap> = { Home: 'home-outline', Work: 'briefcase-outline', Event: 'sparkles-outline' };

export default function Addresses() {
  const router = useRouter();
  const toast = useToast();
  const { user, setUser } = useAuth();
  const addresses = user?.addresses ?? [];

  const update = (list: Address[]) => user && setUser({ ...user, addresses: list });

  async function makeDefault(a: Address) {
    try {
      const r = await api<{ addresses: Address[] }>(`/profile/addresses/${a.id}`, { method: 'PUT', body: { ...a, isDefault: true } });
      update(r.addresses);
      toast(`${a.label} is now your default address`);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  }

  function remove(a: Address) {
    Alert.alert('Delete address?', `${a.label} — ${a.line1}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const r = await api<{ addresses: Address[] }>(`/profile/addresses/${a.id}`, { method: 'DELETE' });
            update(r.addresses);
            toast('Address deleted');
          } catch (e: any) {
            toast(e.message, 'error');
          }
        },
      },
    ]);
  }

  return (
    <Page>
      <TopBar title="Saved addresses" />
      <Gutter>
        <T variant="body" color={colors.muted} style={{ marginBottom: 18 }}>
          Where gardeners, decorators and deliveries should come. Your default is used automatically.
        </T>
        {addresses.length === 0 ? (
          <EmptyState icon="location-outline" title="No addresses yet" text="Add your home, office or an event venue." />
        ) : (
          <View style={{ gap: 12 }}>
            {addresses.map((a, i) => (
              <FadeIn key={a.id} delay={i * 50}>
                <Card style={[a.isDefault && { borderColor: colors.forest }]}>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <View style={styles.icon}>
                      <Ionicons name={LABEL_ICON[a.label] ?? 'location-outline'} size={20} color={colors.forest} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <T variant="subheading">{a.label}</T>
                        {a.isDefault && <Pill label="Default" bg={colors.sage} />}
                      </View>
                      <T variant="body" style={{ marginTop: 2 }}>{a.line1}</T>
                      <T variant="caption">{[a.area, cityName(a.city)].filter(Boolean).join(', ')}</T>
                      {!!a.notes && <T variant="caption" style={{ marginTop: 4, fontStyle: 'italic' }}>“{a.notes}”</T>}
                    </View>
                    <View style={{ gap: 8 }}>
                      <IconButton icon="create-outline" size={36} onPress={() => router.push({ pathname: '/settings/address-form', params: { id: a.id } })} />
                      <IconButton icon="trash-outline" size={36} color={colors.danger} onPress={() => remove(a)} />
                    </View>
                  </View>
                  {!a.isDefault && <Button title="Set as default" kind="ghost" small onPress={() => makeDefault(a)} style={{ alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 0 }} />}
                </Card>
              </FadeIn>
            ))}
          </View>
        )}
        <Button title="Add new address" icon="add" kind="outline" onPress={() => router.push('/settings/address-form')} style={{ marginTop: 20 }} />
      </Gutter>
    </Page>
  );
}

const styles = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
});
