import { Tabs } from 'expo-router/js-tabs';
import { makeTabBar } from '@/components/TabBar';
import { colors } from '@/theme';

const TabBar = makeTabBar({
  index: ['home-outline', 'home'],
  explore: ['search-outline', 'search'],
  seasonal: ['sunny-outline', 'sunny'],
  assistant: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  profile: ['person-outline', 'person'],
});

export default function CustomerTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="seasonal" options={{ title: 'Seasons' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Ask' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
