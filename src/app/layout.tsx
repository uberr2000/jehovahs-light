import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jehovah's Light | 耶和華的光 | 耶和华的光",
  description: "Light up the world with Jehovah's guiding light - A global beacon of faith where users share their location to become part of a worldwide community of believers.",
  keywords: ["Jehovah", "Light", "Faith", "Global", "Christian", "Beacon", "Prayer"],
  authors: [{ name: "Jehovah's Light" }],
  openGraph: {
    title: "Jehovah's Light",
    description: "Light up the world with Jehovah's guiding light",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_TW", "zh_CN"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en') as 'en' | 'zh-TW' | 'zh-CN';
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
