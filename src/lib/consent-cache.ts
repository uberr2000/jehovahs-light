export const CONSENT_STORAGE_KEY = 'jehovahs-light:user-consent';

export interface CachedUserConsent {
  consented: boolean;
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
}

export function shouldSkipIntro(
  consent: { consented?: unknown; hasLocation?: unknown } | null | undefined
): boolean {
  if (!consent) return false;
  return Boolean(consent.consented) || Boolean(consent.hasLocation);
}

function toCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeConsent(
  consent: {
    consented?: unknown;
    hasLocation?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  }
): CachedUserConsent {
  const latitude = toCoord(consent.latitude);
  const longitude = toCoord(consent.longitude);
  const hasLocation =
    Boolean(consent.hasLocation) || (latitude != null && longitude != null);
  return {
    consented: Boolean(consent.consented),
    hasLocation,
    latitude,
    longitude,
  };
}

export function readCachedConsent(): CachedUserConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return normalizeConsent(parsed as CachedUserConsent);
  } catch {
    return null;
  }
}

export function writeCachedConsent(consent: CachedUserConsent): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(normalizeConsent(consent))
    );
  } catch {
    // Private mode / quota: IP-based GET /api/locations userConsent still applies.
  }
}
