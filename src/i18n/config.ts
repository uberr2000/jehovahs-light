export const locales = [
  'en',
  'zh-TW',
  'zh-CN',
  'es',
  'pt',
  'fr',
  'de',
  'ja',
  'ko',
  'ru',
  'ar',
  'id',
  'th',
  'vi',
] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  'zh-TW': '🇹🇼',
  'zh-CN': '🇨🇳',
  es: '🇪🇸',
  pt: '🇵🇹',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ru: '🇷🇺',
  ar: '🇸🇦',
  id: '🇮🇩',
  th: '🇹🇭',
  vi: '🇻🇳',
};

export const LOCALE_COOKIE = 'locale';
export const LOCALE_COOKIE_MAX_AGE = 31536000;
