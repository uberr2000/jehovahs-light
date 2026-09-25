export type PlaceFields = {
  city?: string | null;
  country?: string | null;
};

export type NearbyLocation = PlaceFields & {
  latitude: number;
  longitude: number;
};

const MAX_PLACE_LEN = 80;
const NEARBY_KM = 2;

/** Decimal degrees / lat-lng pairs — never allow these into share copy. */
const LAT_LNG_PAIR = /[-+]?\d{1,3}\.\d+\s*[,/]\s*[-+]?\d{1,3}\.\d+/;
const COORD_LIKE = /[-+]?\d{1,3}\.\d{3,}/;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

export function sanitizePlacePart(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  if (LAT_LNG_PAIR.test(trimmed) || COORD_LIKE.test(trimmed) || IPV4.test(trimmed)) {
    return null;
  }
  return trimmed.length > MAX_PLACE_LEN ? trimmed.slice(0, MAX_PLACE_LEN) : trimmed;
}

export function formatPlaceLabel(place: PlaceFields | null | undefined): string | null {
  if (!place) return null;
  const city = sanitizePlacePart(place.city);
  const country = sanitizePlacePart(place.country);
  if (city && country && city !== country) return `${city}, ${country}`;
  return city || country || null;
}

export function pickPlaceFields(value: unknown): PlaceFields | null {
  if (typeof value !== 'object' || value === null) return null;
  const rec = value as Record<string, unknown>;
  const city = sanitizePlacePart(rec.city);
  const country = sanitizePlacePart(rec.country);
  if (!city && !country) return null;
  return { city, country };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearbyPlace(
  user: { latitude: number; longitude: number } | null | undefined,
  locations: NearbyLocation[],
  maxKm = NEARBY_KM
): PlaceFields | null {
  if (!user || !Number.isFinite(user.latitude) || !Number.isFinite(user.longitude)) {
    return null;
  }
  let best: { dist: number; place: PlaceFields } | null = null;
  for (const loc of locations) {
    if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) continue;
    const dist = haversineKm(user.latitude, user.longitude, loc.latitude, loc.longitude);
    if (dist > maxKm) continue;
    const place = pickPlaceFields(loc);
    if (!place) continue;
    if (!best || dist < best.dist) best = { dist, place };
  }
  return best?.place ?? null;
}

export function resolveLitPlace(
  explicit: PlaceFields | null | undefined,
  userLocation: { latitude: number; longitude: number } | null | undefined,
  locations: NearbyLocation[]
): PlaceFields | null {
  const fromExplicit = pickPlaceFields(explicit ?? null);
  if (fromExplicit) return fromExplicit;
  return findNearbyPlace(userLocation, locations);
}

function stripTracking(url: URL): URL {
  url.search = '';
  url.hash = '';
  url.pathname = '/';
  return url;
}

/** Canonical site origin only — no query, hash, GPS, or PII. */
export function siteShareUrl(origin?: string): string {
  const raw =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    '';
  try {
    return stripTracking(new URL(raw)).toString();
  } catch {
    return raw.split('?')[0].split('#')[0] || '';
  }
}

export function buildShareText(body: string, locationLine?: string | null): string {
  const parts = [body.trim()];
  if (locationLine?.trim()) parts.push(locationLine.trim());
  return parts.filter(Boolean).join('\n');
}

export function buildClipboardPayload(text: string, url: string): string {
  return `${text}\n${url}`;
}

export function assertSafeSharePayload(value: string): boolean {
  return !LAT_LNG_PAIR.test(value) && !COORD_LIKE.test(value);
}

export function socialShareUrls(text: string, url: string): {
  line: string;
  facebook: string;
  x: string;
} {
  return {
    line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  };
}

export function canUseWebShare(data: ShareData): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (typeof navigator.canShare === 'function') {
    try {
      return navigator.canShare(data);
    } catch {
      return false;
    }
  }
  return true;
}

export function prefersNativeShare(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const narrow = window.matchMedia?.('(max-width: 1023px)').matches;
  return Boolean(coarse || narrow);
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  );
}

export async function copyToClipboard(payload: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(payload);
      return true;
    } catch {
      // Permissions / non-gesture: fall through to execCommand.
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = payload;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '1px';
  textarea.style.height = '1px';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, payload.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
