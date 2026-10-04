import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/features/auth/SessionProvider';
import { canAccessSection } from '@/features/auth/access';
import { colors } from '@/theme/tokens';
import { AppHeader } from '@/components/ui/Stitch';
import { StitchTabBar } from '@/components/ui/StitchTabBar';

export default function SectionLayout() {
  const { t } = useTranslation();
  const { session } = useSession();
  if (!canAccessSection(session, 'institutional')) return <Redirect href="/permission-denied" />;

  return (
    <Tabs tabBar={(props) => <StitchTabBar {...props} accent />} screenOptions={{
      header: () => <AppHeader subtitle={t('stitch.registryMode')} />, headerTitle: 'AutoGuardian (Registry)',
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarActiveBackgroundColor: colors.surface,
      tabBarStyle: { backgroundColor: colors.background },
      tabBarItemStyle: { minHeight: 48 },
      tabBarLabelStyle: { fontSize: 12 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('stitch.lookup'), tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="clearance" options={{ title: t('stitch.clearanceRequest'), tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: t('navigation.account'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}

