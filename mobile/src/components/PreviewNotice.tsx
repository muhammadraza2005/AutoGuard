import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './ui/AppText';
import { colors, spacing } from '@/theme/tokens';
import { runtime } from '@/config/runtime';

export function PreviewNotice() {
  const { t } = useTranslation();
  if (!runtime.isDemo) return null;
  return (
    <View style={{ backgroundColor: colors.warningBackground, padding: spacing.sm }}>
      <AppText variant="caption" style={{ color: colors.warning }}>{t('common.preview')}</AppText>
    </View>
  );
}
