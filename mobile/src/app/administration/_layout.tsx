import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/features/auth/SessionProvider';
import { canAccessSection } from '@/features/auth/access';
import { colors } from '@/theme/tokens';

export default function SectionLayout() {
  const { session } = useSession();
  if (!canAccessSection(session, 'administration')) return <Redirect href="/permission-denied" />;
  return <Stack screenOptions={{ headerTitle: 'AutoGuardian', headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.background } }} />;
}

