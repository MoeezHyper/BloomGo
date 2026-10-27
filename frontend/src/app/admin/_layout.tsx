import { Tabs } from 'expo-router/js-tabs';
import { makeTabBar } from '@/components/TabBar';
import { colors } from '@/theme';

const TabBar = makeTabBar({
  index: ['stats-chart-outline', 'stats-chart'],
  users: ['people-outline', 'people'],
  explore: ['flower-outline', 'flower'],
  profile: ['person-outline', 'person'],
});

export default function AdminTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="users" options={{ title: 'Users' }} />
      <Tabs.Screen name="explore" options={{ title: 'Flowers' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
