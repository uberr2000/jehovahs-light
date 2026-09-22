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
  title: "萬國之光 · Light of the Nations | Jehovah's Light",
  description:
    '一人一燈，照亮全地。若你信靠耶和華，在互動地球上點一盞燈，與世界各地的信心之光連成星海。 Light a lamp on the globe and join a sea of lights with believers around the world.',
  keywords: ['Jehovah', 'Light', 'Faith', 'Global', 'Christian', 'Beacon', 'Prayer', '萬國之光'],
  authors: [{ name: "Jehovah's Light" }],
  openGraph: {
    title: '萬國之光 · Light of the Nations',
    description: 'One soul, one lamp, lighting the whole earth.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_TW', 'zh_CN'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'dark',
  themeColor: '#04060e',
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
      <body className="flex min-h-full flex-col bg-[#04060e] text-amber-50">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleNavigatorFallback />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
