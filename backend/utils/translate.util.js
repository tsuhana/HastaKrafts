const axios = require('axios');

// Your local LibreTranslate instance
const LIBRETRANSLATE_URL = 'http://localhost:5001';

// LibreTranslate language codes
const LANGUAGE_CODE_MAP = {
  'en': 'en',
  'ne': 'ne',
  'hi': 'hi',
  'es': 'es',
  'zh': 'zh',  
  'fr': 'fr',
  'ja': 'ja',
  'de': 'de',
  'ko': 'ko',
  'ar': 'ar',
  'pt': 'pt',
  'ru': 'ru',
  'it': 'it',
  'tr': 'tr',
  'bn': 'bn',
  'id': 'id',
  'vi': 'vi',
  'th': 'th',
  'ur': 'ur',
  'tl': 'tl',
};

async function translateText(text, targetLang, sourceLang = 'en') {
  try {
    if (targetLang === sourceLang) return text;

    const targetCode = LANGUAGE_CODE_MAP[targetLang] || targetLang;
    const sourceCode = LANGUAGE_CODE_MAP[sourceLang] || sourceLang;

    console.log(`Translating from ${sourceCode} to ${targetCode}...`);

    const response = await axios.post(
      `${LIBRETRANSLATE_URL}/translate`,
      {
        q: text,
        source: sourceCode,
        target: targetCode,
        format: 'text'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      }
    );

    const translated = response.data?.translatedText;
    if (!translated) throw new Error('No translation returned');

    console.log(` Translation successful: ${targetCode}`);
    return translated;

  } catch (error) {
    console.error(`Translation error (${sourceLang} -> ${targetLang}):`, error.message);
    return text; // fallback to original
  }
}

const SUPPORTED_LANGUAGES = {
  en: { name: 'English',     flag: '🇬🇧', native: 'English' },
  ne: { name: 'Nepali',      flag: '🇳🇵', native: 'नेपाली' },
  hi: { name: 'Hindi',       flag: '🇮🇳', native: 'हिन्दी' },
  es: { name: 'Spanish',     flag: '🇪🇸', native: 'Español' },
  fr: { name: 'French',      flag: '🇫🇷', native: 'Français' },
  de: { name: 'German',      flag: '🇩🇪', native: 'Deutsch' },
  zh: { name: 'Chinese',     flag: '🇨🇳', native: '中文' },
  ja: { name: 'Japanese',    flag: '🇯🇵', native: '日本語' },
  ko: { name: 'Korean',      flag: '🇰🇷', native: '한국어' },
  ar: { name: 'Arabic',      flag: '🇸🇦', native: 'العربية' },
  pt: { name: 'Portuguese',  flag: '🇵🇹', native: 'Português' },
  ru: { name: 'Russian',     flag: '🇷🇺', native: 'Русский' },
  it: { name: 'Italian',     flag: '🇮🇹', native: 'Italiano' },
  tr: { name: 'Turkish',     flag: '🇹🇷', native: 'Türkçe' },
  bn: { name: 'Bengali',     flag: '🇧🇩', native: 'বাংলা' },
  id: { name: 'Indonesian',  flag: '🇮🇩', native: 'Bahasa Indonesia' },
  vi: { name: 'Vietnamese',  flag: '🇻🇳', native: 'Tiếng Việt' },
  th: { name: 'Thai',        flag: '🇹🇭', native: 'ภาษาไทย' },
  ur: { name: 'Urdu',        flag: '🇵🇰', native: 'اردو' },
  tl: { name: 'Filipino',    flag: '🇵🇭', native: 'Filipino' },
};

module.exports = { translateText, SUPPORTED_LANGUAGES };