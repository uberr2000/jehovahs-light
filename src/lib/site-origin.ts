import { headers } from 'next/headers';
import { configuredShareUrl } from '@/lib/share';

/** Public site root. Prefers NEXT_PUBLIC_APP_URL, then the request host. */
export async function siteOrigin(): Promise<URL> {
  const configured = configuredShareUrl();
  if (configured) return new URL(configured);
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000';
  const proto = headerStore.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(`${proto}://${host}`);
}
