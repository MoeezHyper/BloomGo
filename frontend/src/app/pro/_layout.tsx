import { Tabs } from 'expo-router/js-tabs';
import { makeTabBar } from '@/components/TabBar';
import { colors } from '@/theme';

const TabBar = makeTabBar({
  index: ['grid-outline', 'grid'],
  explore: ['search-outline', 'search'],
  assistant: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  profile: ['person-outline', 'person'],
});

export default function ProTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="explore" options={{ title: 'Library' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Ask' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
