'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { writeCachedConsent } from '@/lib/consent-cache';

interface GeoLocationButtonProps {
  onLocationReceived: (lat: number, lng: number) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error' | 'denied' | 'exists';

export default function GeoLocationButton({ onLocationReceived }: GeoLocationButtonProps) {
  const t = useTranslations('geolocation');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const recordDeclinedConsent = async () => {
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consented: false }),
      });
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage(t('error'));
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          const data = await response.json();

          if (data.alreadyExists) {
            setStatus('exists');
            setMessage(t('alreadyExists'));
          } else {
            setStatus('success');
            setMessage(t('success'));
          }
          onLocationReceived(latitude, longitude);
        } catch {
          setStatus('error');
          setMessage(t('error'));
        }
      },
      async (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setMessage(t('denied'));
          writeCachedConsent({
            consented: false,
            hasLocation: false,
            latitude: null,
            longitude: null,
          });
          await recordDeclinedConsent();
        } else {
          setStatus('error');
          setMessage(t('error'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const statusColors: Record<Status, string> = {
    idle: 'from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500',
    loading: 'from-gray-500 to-gray-600 cursor-wait',
    success: 'from-green-500 to-emerald-600',
    error: 'from-red-500 to-red-600',
    denied: 'from-orange-500 to-orange-600',
    exists: 'from-blue-500 to-blue-600',
  };

  const statusIcons: Record<Status, string> = {
    idle: '📍',
    loading: '⏳',
    success: '✨',
    error: '❌',
    denied: '⚠️',
    exists: '💡',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={status === 'loading'}
        className={`px-6 py-3 text-base md:text-lg bg-gradient-to-r ${statusColors[status]} text-white font-semibold rounded-full
          transition-all duration-300 shadow-lg shadow-yellow-500/20
          disabled:cursor-not-allowed flex items-center gap-2`}
      >
        <span>{statusIcons[status]}</span>
        {status === 'loading' ? t('loading') : t('button')}
      </button>

      {message && (
        <p
          className={`text-sm md:text-base text-center max-w-md ${
            status === 'success'
              ? 'text-green-400'
              : status === 'error'
                ? 'text-red-400'
                : status === 'denied'
                  ? 'text-orange-400'
                  : 'text-gray-300'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
