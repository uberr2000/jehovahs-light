import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import LocaleNavigatorFallback from '@/components/LocaleNavigatorFallback';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { LOCALE_COOKIE } from '@/i18n/config';
import { htmlDir, isLocale, resolveRequestLocale } from '@/i18n/resolve-locale';
import { siteOrigin } from '@/lib/site-origin';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const OG_TITLE = '點亮地球 · Light Up the Earth';
const OG_DESCRIPTION =
  '這是一盞為你而燃的燈，也是一盞等你傳下去的燈。願神的光，由你手中開始，照耀地球每一個角落。 A lamp lit for you, waiting to be passed on.';

const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  'zh-TW': 'zh_TW',
  'zh-CN': 'zh_CN',
  es: 'es_ES',
  pt: 'pt_PT',
  fr: 'fr_FR',
  de: 'de_DE',
  ja: 'ja_JP',
  ko: 'ko_KR',
  ru: 'ru_RU',
  ar: 'ar_AR',
  id: 'id_ID',
  th: 'th_TH',
  vi: 'vi_VN',
};

export async function generateMetadata(): Promise<Metadata> {
  const requested = await getLocale();
  const locale = isLocale(requested) ? requested : 'en';
  const brand = (await getTranslations('home'))('brand');
  const ogLocale = OG_LOCALE[locale] ?? 'en_US';

  return {
  metadataBase: await siteOrigin(),
  title: "點亮地球 · Light Up the Earth | Jehovah's Light",
  description: OG_DESCRIPTION,
  keywords: ['Jehovah', 'Light', 'Faith', 'Global', 'Christian', 'Beacon', 'Prayer', '點亮地球', 'Light Up the Earth'],
  authors: [{ name: "Jehovah's Light" }],
  applicationName: brand,
  manifest: `/app-manifest?locale=${locale}`,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: '/' },
  appleWebApp: {
    capable: true,
    title: brand,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/',
    siteName: OG_TITLE,
    type: 'website',
    locale: ogLocale,
    alternateLocale: Object.values(OG_LOCALE).filter((value) => value !== ogLocale),
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
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
}

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
  const origin = await siteOrigin();
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: OG_TITLE,
    alternateName: "Jehovah's Light",
    url: origin.toString(),
    description: OG_DESCRIPTION,
    inLanguage: locale,
  }).replace(/</g, '\\u003c');

  return (
    <html
      lang={locale}
      dir={htmlDir(locale)}
      data-locale-source={source}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#04060e] text-amber-50">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleNavigatorFallback />
          <ServiceWorkerRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
