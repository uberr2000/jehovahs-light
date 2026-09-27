import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import LocaleNavigatorFallback from '@/components/LocaleNavigatorFallback';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { LOCALE_COOKIE } from '@/i18n/config';
import { htmlDir, isLocale, resolveRequestLocale } from '@/i18n/resolve-locale';
import { configuredShareUrl } from '@/lib/share';
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
const OG_DESCRIPTION = "讓神的光，從你所在之處開始。 Let God's light begin right where you are.";

/** Crawlers need absolute og:image / og:url; fall back to the request host when the env is unset. */
async function siteOrigin(): Promise<URL> {
  const configured = configuredShareUrl();
  if (configured) return new URL(configured);
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
  const proto = headerStore.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(`${proto}://${host}`);
}

export async function generateMetadata(): Promise<Metadata> {
  const requested = await getLocale();
  const locale = isLocale(requested) ? requested : 'en';
  const brand = (await getTranslations('home'))('brand');

  return {
  metadataBase: await siteOrigin(),
  title: "點亮地球 · Light Up the Earth | Jehovah's Light",
  description:
    "讓神的光，從你所在之處開始。若你信靠耶和華，在互動地球上點一盞燈，與世界各地的信心之光連成星海。 Let God's light begin right where you are — light a lamp on the globe and join a sea of lights with believers around the world.",
  keywords: ['Jehovah', 'Light', 'Faith', 'Global', 'Christian', 'Beacon', 'Prayer', '點亮地球', 'Light Up the Earth'],
  authors: [{ name: "Jehovah's Light" }],
  applicationName: brand,
  manifest: `/app-manifest?locale=${locale}`,
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
    locale: 'en_US',
    alternateLocale: ['zh_TW', 'zh_CN'],
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
          <ServiceWorkerRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
