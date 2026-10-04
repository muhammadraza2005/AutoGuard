import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { runtime } from '@/config/runtime';
import { sections, type AppSection } from '@/features/auth/access';
import { useSession } from '@/features/auth/SessionProvider';

const sectionRoutes = {
  consumer: '/(consumer)', agent: '/agent',
  institutional: '/institutional', administration: '/administration',
} as const;

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const { setPreviewSection } = useSession();
  function preview(section: AppSection) {
    setPreviewSection(section);
    router.push(sectionRoutes[section]);
  }
  return (
    <Screen>
      <AppText variant="heading">{t('account.title')}</AppText>
      <AppText variant="label">{t('common.language')}</AppText>
      <Button label={t('common.english')} variant="secondary" onPress={() => void i18n.changeLanguage('en')} />
      <Button label={t('common.french')} variant="secondary" onPress={() => void i18n.changeLanguage('fr')} />
      {runtime.isDemo && <>
        <AppText variant="subheading">{t('account.previewRole')}</AppText>
        <AppText>{t('account.previewHelp')}</AppText>
        {sections.map((section) => <Button key={section} label={t('navigation.' + section)} variant="secondary" onPress={() => preview(section)} />)}
      </>}
    </Screen>
  );
}

