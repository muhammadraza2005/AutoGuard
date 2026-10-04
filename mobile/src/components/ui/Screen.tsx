import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { runtime } from '@/config/runtime';
import { colors, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export function Screen({ children }: ViewProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {runtime.isDemo && (
          <View style={styles.preview}>
            <AppText variant="caption" style={{ color: colors.warning }}>{t('common.preview')}</AppText>
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg, flexGrow: 1 },
  preview: { backgroundColor: colors.warningBackground, padding: spacing.sm, borderRadius: 6 },
});

