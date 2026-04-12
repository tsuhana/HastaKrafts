import React from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../api/axios';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isLoggedIn = !!localStorage.getItem('token') || sessionStorage.getItem('token');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const handleChange = async (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);

    if (isLoggedIn) {
      try {
        await userAPI.updateLanguagePreference({ preferred_language: code });
      } catch (err) {
        console.error('Failed to save language preference:', err);
      }
    }
  };

  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        className="lang-select"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;