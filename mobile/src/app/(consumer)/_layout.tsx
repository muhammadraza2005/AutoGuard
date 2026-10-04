import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/SessionProvider';
import { canAccessSection } from '@/features/auth/access';
import { colors } from '@/theme/tokens';

export default function ConsumerLayout() {
  const { t } = useTranslation();
  const { session } = useSession();
  if (!canAccessSection(session, 'consumer')) return <Redirect href="/welcome" />;
  return (
    <Tabs screenOptions={{
      headerTitle: t('brand'),
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarActiveBackgroundColor: colors.warningBackground,
      tabBarStyle: { backgroundColor: colors.background },
      tabBarItemStyle: { minHeight: 48 },
      tabBarLabelStyle: { fontSize: 12 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('navigation.check'), tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="my-vehicles" options={{ title: t('navigation.vehicles'), tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="alerts" options={{ title: t('navigation.alerts'), tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: t('navigation.account'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
