import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { runtime } from '@/config/runtime';
import { resources } from './resources';

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: runtime.isDemo ? 'en' : 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
