import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/site-origin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  return [
    {
      url: origin.toString(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
