import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.primary }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(consumer)" options={{ headerShown: false }} />
        <Stack.Screen name="agent" options={{ headerShown: false }} />
        <Stack.Screen name="institutional" options={{ headerShown: false }} />
        <Stack.Screen name="administration" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ title: 'AutoGuardian' }} />
        <Stack.Screen name="permission-denied" options={{ title: 'AutoGuardian' }} />
      </Stack>
    </AppProviders>
  );
}

