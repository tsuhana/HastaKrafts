import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import neTranslation from './locales/ne/translation.json';
import hiTranslation from './locales/hi/translation.json';
import zhTranslation from './locales/zh/translation.json';
import jaTranslation from './locales/ja/translation.json';
import koTranslation from './locales/ko/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import arTranslation from './locales/ar/translation.json';

i18n
  .use(LanguageDetector) // Detect user language automatically
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: enTranslation }, // English (default)
      ne: { translation: neTranslation }, // Nepali
      hi: { translation: hiTranslation }, // Hindi
      zh: { translation: zhTranslation }, // Chinese
      ja: { translation: jaTranslation }, // Japanese
      ko: { translation: koTranslation }, // Korean
      es: { translation: esTranslation }, // Spanish
      fr: { translation: frTranslation }, // French
      de: { translation: deTranslation }, // German
      ar: { translation: arTranslation }, // Arabic
    },
    fallbackLng: 'en', // Default language if detection fails
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
      caches: ['localStorage'],             // Save selected language to localStorage
      lookupLocalStorage: 'i18nextLng',     // Key used in localStorage
    },
  });

export default i18n;