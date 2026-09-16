'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { LOCALE_COOKIE, type Locale } from '@/i18n/config';
import {
  isLocale,
  localeCookieString,
  matchNavigatorLanguages,
} from '@/i18n/resolve-locale';

function readLocaleCookie(): string | undefined {
  const row = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
  return row?.split('=')[1];
}

/**
 * Cookie → Accept-Language are applied on the server.
 * navigator.language only runs when neither resolved a locale (html
 * data-locale-source="default"), then persists via cookie + reload so SSR matches.
 */
export default function LocaleNavigatorFallback() {
  const locale = useLocale() as Locale;

  useEffect(() => {
    if (isLocale(readLocaleCookie())) return;

    const source = document.documentElement.dataset.localeSource;
    if (source === 'cookie' || source === 'accept-language') return;

    const languages =
      navigator.languages?.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];

    const fromNavigator = matchNavigatorLanguages(languages);
    if (fromNavigator && fromNavigator !== locale) {
      document.cookie = localeCookieString(fromNavigator);
      window.location.reload();
    }
  }, [locale]);

  return null;
}
