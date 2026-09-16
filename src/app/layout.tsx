import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import LocaleNavigatorFallback from '@/components/LocaleNavigatorFallback';
import { LOCALE_COOKIE } from '@/i18n/config';
import { htmlDir, resolveRequestLocale } from '@/i18n/resolve-locale';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Jehovah's Light | 耶和華的光 | 耶和华的光",
  description:
    "Light up the world with Jehovah's guiding light - A global beacon of faith where users share their location to become part of a worldwide community of believers.",
  keywords: ['Jehovah', 'Light', 'Faith', 'Global', 'Christian', 'Beacon', 'Prayer'],
  authors: [{ name: "Jehovah's Light" }],
  openGraph: {
    title: "Jehovah's Light",
    description: "Light up the world with Jehovah's guiding light",
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_TW', 'zh_CN'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const { locale, source } = resolveRequestLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get('accept-language')
  );
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={htmlDir(locale)}
      data-locale-source={source}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleNavigatorFallback />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
