'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { writeCachedConsent } from '@/lib/consent-cache';

interface LightLampButtonProps {
  onLocationReceived: (lat: number, lng: number) => void;
}

type Status = 'idle' | 'locating' | 'saving';

export default function LightLampButton({ onLocationReceived }: LightLampButtonProps) {
  const t = useTranslations('home');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const busy = status !== 'idle';

  const recordDeclinedConsent = async () => {
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consented: false }),
      });
    } catch (err) {
      console.error('Failed to record consent:', err);
    }
  };

  const handleClick = () => {
    setError(null);

    if (!('geolocation' in navigator)) {
      setError(t('errorUnsupported'));
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatus('saving');
        try {
          const response = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });
          if (!response.ok) {
            setError(t('errorGeneric'));
            return;
          }
          await response.json().catch(() => ({}));
          onLocationReceived(latitude, longitude);
        } catch {
          setError(t('errorGeneric'));
        } finally {
          setStatus('idle');
        }
      },
      async (geoError) => {
        setStatus('idle');
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(t('errorDenied'));
          writeCachedConsent({
            consented: false,
            hasLocation: false,
            latitude: null,
            longitude: null,
          });
          await recordDeclinedConsent();
        } else {
          setError(t('errorGeneric'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="flex flex-col items-stretch gap-1.5 md:gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="group relative inline-flex min-h-[2.625rem] items-center justify-center gap-[0.5625rem] overflow-hidden rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-3 text-[0.84375rem] font-semibold text-neutral-900 shadow-[0_0_36px_-4px_rgba(245,180,90,0.75)] transition-all hover:shadow-[0_0_48px_-2px_rgba(245,180,90,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-80 md:min-h-14 md:gap-3 md:px-8 md:py-4 md:text-lg"
      >
        <LampGlyph busy={busy} />
        <span>{status === 'saving' ? t('saving') : busy ? t('locating') : t('lightButton')}</span>
      </button>
      {error ? (
        <p role="alert" className="px-1 text-center text-[0.65625rem] text-amber-200/80 md:text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LampGlyph({ busy }: { busy: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-[0.9375rem] w-[0.9375rem] items-center justify-center md:h-5 md:w-5 ${busy ? 'animate-pulse' : ''}`}
    >
      <span className="absolute h-[0.9375rem] w-[0.9375rem] rounded-full bg-amber-100 blur-[3px] md:h-5 md:w-5" />
      <span className="relative h-[0.5625rem] w-[0.5625rem] rounded-full bg-neutral-900/80 md:h-3 md:w-3" />
    </span>
  );
}
