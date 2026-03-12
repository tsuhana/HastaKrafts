import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import neTranslation from './locales/ne/translation.json';
import hiTranslation from './locales/hi/translation.json';
import zhTranslation from './locales/zh/translation.json';

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: { translation: enTranslation },
      ne: { translation: neTranslation },
      hi: { translation: hiTranslation },
      zh: { translation: zhTranslation },
    },
    fallbackLng: 'en', // Default language
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;