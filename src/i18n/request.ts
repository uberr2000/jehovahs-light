import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE } from './config';
import { loadMessages } from './load-messages';
import { resolveRequestLocale } from './resolve-locale';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { locale } = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language')
  );

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
