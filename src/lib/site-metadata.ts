import { locales, type Locale } from '../i18n/config';
import { configuredShareUrl } from './share';

/** Home-screen short name. Must stay ≤ 12 characters. */
export const PWA_SHORT_NAME = '點亮地球';

/** Facebook / Open Graph locale tags for each supported UI locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  'zh-TW': 'zh_TW',
  'zh-CN': 'zh_CN',
  es: 'es_ES',
  pt: 'pt_BR',
  fr: 'fr_FR',
  de: 'de_DE',
  ja: 'ja_JP',
  ko: 'ko_KR',
  ru: 'ru_RU',
  ar: 'ar_SA',
  id: 'id_ID',
  th: 'th_TH',
  vi: 'vi_VN',
};

/**
 * Absolute origin for metadataBase / og:image / og:url / twitter:image.
 * Env-only via the #22 share helper — never the request Host header.
 * Empty / non-https / placeholder hosts are unset (same rules as share hrefs).
 */
export function metadataBaseUrl(): URL | undefined {
  const configured = configuredShareUrl();
  return configured ? new URL(configured) : undefined;
}

/** Absolute page URL, or undefined when NEXT_PUBLIC_APP_URL is unset/placeholder. */
export function metadataCanonicalUrl(pathname = '/'): string | undefined {
  const base = configuredShareUrl();
  if (!base) return undefined;
  return new URL(pathname, base).toString();
}

export function ogLocaleFor(locale: Locale): string {
  return OG_LOCALE[locale];
}

export function ogAlternateLocales(active: Locale): string[] {
  return locales.filter((locale) => locale !== active).map((locale) => OG_LOCALE[locale]);
}
