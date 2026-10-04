import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui/AppText';
import { Button } from './ui/Button';
import { Screen } from './ui/Screen';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = { titleKey: string; descriptionKey?: string; showBack?: boolean };

export function FoundationScreen({ titleKey, descriptionKey, showBack = false }: Props) {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="heading" accessibilityRole="header">{t(titleKey)}</AppText>
      {descriptionKey && <AppText>{t(descriptionKey)}</AppText>}
      <View style={styles.card}>
        <AppText variant="label">{t('common.foundation')}</AppText>
        <AppText style={{ color: colors.textMuted }}>{t('common.pending')}</AppText>
      </View>
      {showBack && <Link href="/(consumer)" asChild><Button label={t('common.back')} variant="secondary" /></Link>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, gap: spacing.sm },
});

