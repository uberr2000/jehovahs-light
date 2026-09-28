import { NextRequest, NextResponse } from 'next/server';
import { loadMessages } from '@/i18n/load-messages';
import { htmlDir, isLocale, resolveRequestLocale } from '@/i18n/resolve-locale';

// Served from /app-manifest, not the manifest.webmanifest file convention:
// Next treats that name as a metadata file and will not run a route handler.
// Locale comes from the page's manifest link (?locale=), which follows the
// language picker. A request without it falls back to the browser language.
// `id` stays "/" so every language installs as the same app.
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get('locale');
  const locale = isLocale(param)
    ? param
    : resolveRequestLocale(null, request.headers.get('accept-language')).locale;

  const { home: copy } = await loadMessages(locale);

  return NextResponse.json(
    {
      id: '/',
      name: copy.brand,
      short_name: copy.brand,
      description: copy.tagline,
      start_url: '/',
      scope: '/',
      display: 'fullscreen',
      background_color: '#04060e',
      theme_color: '#04060e',
      lang: locale,
      dir: htmlDir(locale),
      categories: ['lifestyle'],
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
