'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LighthouseIntro from '@/components/LighthouseIntro';
import GeoLocationButton from '@/components/GeoLocationButton';
import LanguageSelector from '@/components/LanguageSelector';
import Stats from '@/components/Stats';
import { type Locale } from '@/i18n/config';

// Dynamic import for 3D globe (no SSR)
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

const translations = {
  en: {
    title: "Jehovah's Light",
    subtitle: 'Beacon of Hope for the World',
    description: 'Each light represents a soul touched by Jehovah\'s love. Share your location and become part of this global beacon of faith.',
    shareTitle: 'Share Your Light',
    footerVerse: '"For with you is the fountain of life; in your light we see light." — Psalm 36:9',
    rights: 'All rights reserved',
  },
  'zh-TW': {
    title: '耶和華的光',
    subtitle: '世界的希望燈塔',
    description: '每一道光都代表一個被耶和華的愛觸摸的靈魂。分享您的位置，成為這個全球信仰燈塔的一部分。',
    shareTitle: '分享您的光',
    footerVerse: '「因為，在你那裡有生命的源頭；在你的光中，我們必得見光。」— 詩篇 36:9',
    rights: '版權所有',
  },
  'zh-CN': {
    title: '耶和華的光',
    subtitle: '世界的希望燈塔',
    description: '每一道光都代表一个被耶和华的爱触摸的灵魂。分享您的位置，成为这个全球信仰灯塔的一部分。',
    shareTitle: '分享您的光',
    footerVerse: '「因为，在你那里有生命的源头；在你的光中，我们必得见光。」— 诗篇 36:9',
    rights: '版权所有',
  },
};

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, today: 0, countries: 0 });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[locale];

  // Load locale from cookie
  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined;
    if (savedLocale && ['en', 'zh-TW', 'zh-CN'].includes(savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  // Fetch locations on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        setLocations(data.locations || []);
        setStats(data.stats || { total: 0, today: 0, countries: 0 });
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
  };

  const handleLocationReceived = (lat: number, lng: number) => {
    setUserLocation({ latitude: lat, longitude: lng });
    // Refresh locations
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data.locations || []);
        setStats(data.stats || { total: 0, today: 0, countries: 0 });
      });
  };

  if (showIntro) {
    return <LighthouseIntro onComplete={() => setShowIntro(false)} language={locale} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-black/30 backdrop-blur-sm">
        <h1 className="text-xl md:text-2xl font-bold text-yellow-400" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>
          {t.title}
        </h1>
        <LanguageSelector currentLocale={locale} onLocaleChange={handleLocaleChange} />
      </header>

      {/* 3D Globe Section */}
      <div className="h-[60vh] md:h-[70vh] relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500" />
          </div>
        ) : (
          <Globe3D 
            lightPoints={locations} 
            userLocation={userLocation}
          />
        )}
      </div>

      {/* Content Section */}
      <div className="relative z-10 px-4 py-8 bg-gradient-to-t from-black via-gray-900/90 to-transparent">
        {/* Title & Description */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white">
            {t.subtitle}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            {t.description}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <Stats {...stats} language={locale} />
        </div>

        {/* Geolocation Button */}
        <div className="text-center mb-8">
          <h3 className="text-lg md:text-xl font-semibold text-yellow-400 mb-4">
            {t.shareTitle}
          </h3>
          <GeoLocationButton 
            onLocationReceived={handleLocationReceived}
            language={locale}
          />
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-8 border-t border-white/10">
          <p className="italic mb-2 text-gray-400">{t.footerVerse}</p>
          <p>© {new Date().getFullYear()} Jehovah&apos;s Light. {t.rights}.</p>
        </footer>
      </div>
    </main>
  );
}
