import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  locales,
  type Locale,
} from './config';

export type LocaleSource = 'cookie' | 'accept-language' | 'default';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Match a BCP 47 tag against supported locales.
 *
 * Exact tags win (zh-TW, zh-CN). Language-only locales (es, pt, ja, …)
 * also accept regional variants (es-MX → es, ja-JP → ja, en-US → en).
 * Unmatched region variants of a region-specific locale do not fuzzy-map
 * (zh-HK / zh / zh-Hant → null → caller falls back to en).
 */
export function matchLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null;

  const normalized = normalizeTag(tag);
  if (!normalized) return null;

  const exact = locales.find(
    (locale) => locale.toLowerCase() === normalized.toLowerCase()
  );
  if (exact) return exact;

  const language = normalized.split('-')[0]?.toLowerCase();
  if (!language) return null;

  const languageOnly = locales.find(
    (locale) => locale.toLowerCase() === language
  );
  return languageOnly ?? null;
}

export function parseAcceptLanguage(
  header: string | undefined | null
): Locale | null {
  if (!header?.trim()) return null;

  const entries = header
    .split(',')
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(';');
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split('=');
        if (key === 'q' && value) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { tag: rawTag?.trim() ?? '', q };
    })
    .filter((entry) => entry.tag && entry.tag !== '*')
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const matched = matchLocale(tag);
    if (matched) return matched;
  }

  return null;
}

export function matchNavigatorLanguages(
  languages: readonly string[] | undefined | null
): Locale | null {
  if (!languages?.length) return null;
  for (const language of languages) {
    const matched = matchLocale(language);
    if (matched) return matched;
  }
  return null;
}

export function resolveRequestLocale(
  cookieValue: string | undefined | null,
  acceptLanguage: string | undefined | null
): { locale: Locale; source: LocaleSource } {
  if (isLocale(cookieValue)) {
    return { locale: cookieValue, source: 'cookie' };
  }

  if (acceptLanguage?.trim()) {
    return {
      locale: parseAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE,
      source: 'accept-language',
    };
  }

  return { locale: DEFAULT_LOCALE, source: 'default' };
}

export function htmlDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function localeCookieString(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
}

function normalizeTag(tag: string): string {
  const cleaned = tag.trim().replace(/_/g, '-');
  if (!cleaned) return '';

  const parts = cleaned.split('-').filter(Boolean);
  if (parts.length === 0) return '';

  const language = parts[0].toLowerCase();
  const rest = parts.slice(1).map((part) => {
    if (part.length === 2) return part.toUpperCase();
    if (part.length === 4) {
      return part[0].toUpperCase() + part.slice(1).toLowerCase();
    }
    return part;
  });

  return [language, ...rest].join('-');
}
