'use client';

import { useState } from 'react';

interface GeoLocationButtonProps {
  onLocationReceived: (lat: number, lng: number) => void;
  language: 'en' | 'zh-TW' | 'zh-CN';
}

const translations = {
  en: {
    button: 'Share My Location',
    loading: 'Locating you...',
    denied: 'Location access denied. You can still view the lights from around the world.',
    error: 'Unable to get your location. Please try again.',
    success: 'Your light has been added to the world!',
    alreadyExists: 'Your location has already been lit!',
  },
  'zh-TW': {
    button: '分享我的位置',
    loading: '正在定位您...',
    denied: '位置存取被拒絕。您仍然可以觀看來自世界各地的光。',
    error: '無法獲取您的位置。請重試。',
    success: '您的光已經被添加到世界上！',
    alreadyExists: '您的位置已經被點亮了！',
  },
  'zh-CN': {
    button: '分享我的位置',
    loading: '正在定位您...',
    denied: '位置访问被拒绝。您仍然可以观看来自世界各地的光。',
    error: '无法获取您的位置。请重试。',
    success: '您的光已经被添加到世界上！',
    alreadyExists: '您的位置已经被点亮了！',
  },
};

type Status = 'idle' | 'loading' | 'success' | 'error' | 'denied' | 'exists';

export default function GeoLocationButton({ onLocationReceived, language }: GeoLocationButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const t = translations[language];

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
      setMessage(t.error);
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
            setMessage(t.alreadyExists);
          } else {
            setStatus('success');
            setMessage(t.success);
            onLocationReceived(latitude, longitude);
          }
        } catch {
          setStatus('error');
          setMessage(t.error);
        }
      },
      async (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setMessage(t.denied);
          // Record that user declined
          await recordDeclinedConsent();
        } else {
          setStatus('error');
          setMessage(t.error);
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
        onClick={handleGetLocation}
        disabled={status === 'loading'}
        className={`px-6 py-3 bg-gradient-to-r ${statusColors[status]} text-white font-semibold rounded-full 
          transition-all duration-300 shadow-lg shadow-yellow-500/20
          disabled:cursor-not-allowed flex items-center gap-2`}
      >
        <span>{statusIcons[status]}</span>
        {status === 'loading' ? t.loading : t.button}
      </button>

      {message && (
        <p className={`text-sm text-center max-w-md ${
          status === 'success' ? 'text-green-400' : 
          status === 'error' ? 'text-red-400' : 
          status === 'denied' ? 'text-orange-400' : 
          'text-gray-300'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
