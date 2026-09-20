'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSelector from '@/components/LanguageSelector';
import WelcomePanel from '@/components/WelcomePanel';
import { type Locale } from '@/i18n/config';
import { isLocale, localeCookieString } from '@/i18n/resolve-locale';
import {
  readCachedConsent,
  shouldSkipIntro,
  writeCachedConsent,
  normalizeConsent,
} from '@/lib/consent-cache';

const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => <GlobeLoadingSpinner />,
});

interface Location {
  id: number;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  country_code: string | null;
  created_at: string;
}

interface StatsData {
  total: number;
  today: number;
  countries: number;
}

interface UserConsent {
  consented: boolean;
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
}

type StatsStatus = 'loading' | 'ok' | 'error';

async function fetchLocationsPayload(): Promise<{
  locations: Location[];
  stats: StatsData;
  userConsent: UserConsent | null;
}> {
  const response = await fetch('/api/locations');
  let data: {
    error?: string;
    locations?: Location[];
    stats?: Partial<StatsData>;
    userConsent?: UserConsent | null;
  } = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch locations (${response.status})`);
  }
  return {
    locations: Array.isArray(data.locations) ? data.locations : [],
    stats: {
      total: Number(data.stats?.total) || 0,
      today: Number(data.stats?.today) || 0,
      countries: Number(data.stats?.countries) || 0,
    },
    userConsent: data.userConsent ?? null,
  };
}

function GlobeLoadingSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#04060e]">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-amber-300/20 border-t-amber-300" />
    </div>
  );
}

export default function Home() {
  const t = useTranslations('home');
  const locale = useLocale() as Locale;
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, today: 0, countries: 0 });
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [statsStatus, setStatsStatus] = useState<StatsStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedConsent();
    const cacheSkipsIntro = shouldSkipIntro(cached);
    if (cacheSkipsIntro && cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage consent hydrate
      setUserConsent(cached);
      if (cached.hasLocation && cached.latitude != null && cached.longitude != null) {
        setUserLocation({
          latitude: cached.latitude,
          longitude: cached.longitude,
        });
      }
    }

    async function fetchData(isPoll = false) {
      try {
        const data = await fetchLocationsPayload();
        if (cancelled) return;
        setLocations(data.locations);
        setStats(data.stats);
        setStatsStatus('ok');

        if (data.userConsent) {
          const fromApi = normalizeConsent(data.userConsent);
          if (shouldSkipIntro(fromApi)) {
            setUserConsent(fromApi);
            writeCachedConsent(fromApi);
            if (fromApi.hasLocation && fromApi.latitude != null && fromApi.longitude != null) {
              setUserLocation({
                latitude: fromApi.latitude,
                longitude: fromApi.longitude,
              });
            }
          } else if (!cacheSkipsIntro) {
            setUserConsent(fromApi);
          }
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        if (!cancelled && !isPoll) {
          setStatsStatus('error');
        }
      }
    }

    fetchData();
    const interval = window.setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    if (!isLocale(newLocale) || newLocale === locale) return;
    document.cookie = localeCookieString(newLocale);
    window.location.reload();
  };

  const handleLocationReceived = (lat: number, lng: number) => {
    const consent: UserConsent = {
      consented: true,
      hasLocation: true,
      latitude: lat,
      longitude: lng,
    };
    setUserLocation({ latitude: lat, longitude: lng });
    setUserConsent(consent);
    writeCachedConsent(consent);
    fetchLocationsPayload()
      .then((data) => {
        setLocations(data.locations);
        setStats(data.stats);
        setStatsStatus('ok');
      })
      .catch((error) => {
        console.error('Failed to refresh locations after share:', error);
        setStatsStatus((current) => (current === 'ok' ? current : 'error'));
      });
  };

  const handleRetryStats = () => {
    fetchLocationsPayload()
      .then((data) => {
        setLocations(data.locations);
        setStats(data.stats);
        setStatsStatus('ok');
        if (data.userConsent) {
          const fromApi = normalizeConsent(data.userConsent);
          if (shouldSkipIntro(fromApi)) {
            setUserConsent(fromApi);
            writeCachedConsent(fromApi);
            if (fromApi.hasLocation && fromApi.latitude != null && fromApi.longitude != null) {
              setUserLocation({
                latitude: fromApi.latitude,
                longitude: fromApi.longitude,
              });
            }
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch locations:', error);
        setStatsStatus('error');
      });
  };

  const hasLit = Boolean(userConsent?.hasLocation || userLocation);

  return (
    <main className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#04060e]">
      <header className="z-10 flex shrink-0 items-start justify-between gap-4 p-4 sm:p-6">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold tracking-wide text-amber-50">{t('brand')}</span>
          <span className="text-[0.7rem] text-amber-100/50">{t('tagline')}</span>
        </div>
        <LanguageSelector currentLocale={locale} onLocaleChange={handleLocaleChange} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 flex-1">
          <Globe3D lightPoints={locations} userLocation={userLocation} />
        </div>

        <div className="flex shrink-0 justify-center p-4 pt-0 sm:p-6 sm:pt-0 lg:w-[26rem] lg:items-center lg:p-8">
          <WelcomePanel
            count={stats.total}
            hasLit={hasLit}
            statsStatus={statsStatus}
            onRetry={handleRetryStats}
            onLocationReceived={handleLocationReceived}
          />
        </div>
      </div>
    </main>
  );
}
