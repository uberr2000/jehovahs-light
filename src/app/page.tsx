'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import LighthouseIntro from '@/components/LighthouseIntro';
import GeoLocationButton from '@/components/GeoLocationButton';
import LanguageSelector from '@/components/LanguageSelector';
import Stats from '@/components/Stats';
import { type Locale } from '@/i18n/config';
import { isLocale, localeCookieString } from '@/i18n/resolve-locale';
import {
  readCachedConsent,
  shouldSkipIntro,
  writeCachedConsent,
  normalizeConsent,
  readIntroDismissed,
  writeIntroDismissed,
} from '@/lib/consent-cache';

const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500" />
    </div>
  ),
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
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500" />
    </div>
  );
}

export default function Home() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [showIntro, setShowIntro] = useState(true);
  const [introResolved, setIntroResolved] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, today: 0, countries: 0 });
  const [userConsent, setUserConsent] = useState<UserConsent | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statsStatus, setStatsStatus] = useState<StatsStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedConsent();
    const cacheSkipsIntro = shouldSkipIntro(cached);
    const dismissedThisSession = readIntroDismissed();
    if ((cacheSkipsIntro && cached) || dismissedThisSession) {
      if (cacheSkipsIntro && cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage/session intro gate
        setUserConsent(cached);
        if (cached.hasLocation && cached.latitude != null && cached.longitude != null) {
          setUserLocation({
            latitude: cached.latitude,
            longitude: cached.longitude,
          });
        }
      }
      setShowIntro(false);
      if (cacheSkipsIntro && cached) {
        setIntroResolved(true);
      }
    }

    async function fetchData() {
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
            setShowIntro(false);
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
        if (!cancelled) {
          setStatsStatus('error');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIntroResolved(true);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
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
        setStatsStatus('error');
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

  if (!introResolved) {
    return <GlobeLoadingSpinner />;
  }

  if (showIntro) {
    return <LighthouseIntro onComplete={() => {
      writeIntroDismissed();
      setShowIntro(false);
    }} />;
  }

  const hasSharedLocation = userConsent?.hasLocation;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-black/30 backdrop-blur-sm">
        <h1
          className="text-2xl md:text-3xl font-bold text-yellow-400 leading-tight min-w-0 pe-3"
          style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}
        >
          {t('hero.title')}
        </h1>
        <LanguageSelector currentLocale={locale} onLocaleChange={handleLocaleChange} />
      </header>

      <div className="h-[60vh] md:h-[70vh] relative">
        {isLoading ? (
          <GlobeLoadingSpinner />
        ) : (
          <Globe3D lightPoints={locations} userLocation={userLocation} />
        )}
      </div>

      <div className="relative z-10 px-4 py-8 bg-gradient-to-t from-black via-gray-900/90 to-transparent">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white leading-tight">{t('hero.subtitle')}</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            {t('hero.description')}
          </p>
        </div>

        <div className="mb-8">
          <Stats {...stats} status={statsStatus === 'error' ? 'error' : 'ok'} onRetry={handleRetryStats} />
        </div>

        <div className="text-center mb-8">
          {hasSharedLocation ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-2xl">✨</span>
                <span className="text-xl font-semibold">{t('hero.alreadyShared')}</span>
              </div>
              <p className="text-base text-gray-400">{t('hero.welcomeBack')}</p>
            </div>
          ) : (
            <>
              <h3 className="text-xl md:text-2xl font-semibold text-yellow-400 mb-4">
                {t('hero.shareTitle')}
              </h3>
              <GeoLocationButton onLocationReceived={handleLocationReceived} />
            </>
          )}
        </div>

        <footer className="text-center text-gray-500 text-base py-8 border-t border-white/10">
          <p className="italic mb-2 text-gray-400 text-base md:text-base leading-relaxed">{t('footer.verse')}</p>
          <p>
            © {new Date().getFullYear()} Jehovah&apos;s Light. {t('footer.rights')}.
          </p>
        </footer>
      </div>
    </main>
  );
}
