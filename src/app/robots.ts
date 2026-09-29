import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/site-origin';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/offline.html'],
    },
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
