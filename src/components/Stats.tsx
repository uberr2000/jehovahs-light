'use client';

import { useTranslations } from 'next-intl';

interface StatsProps {
  total: number;
  today: number;
  countries: number;
  status?: 'ok' | 'error' | 'loading';
  onRetry?: () => void;
}

export default function Stats({
  total,
  today,
  countries,
  status = 'ok',
  onRetry,
}: StatsProps) {
  const t = useTranslations('stats');

  if (status === 'error') {
    return (
      <div className="w-full max-w-2xl mx-auto text-center px-2">
        <p className="text-base md:text-lg text-orange-300 mb-3">{t('loadError')}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 text-base rounded-lg bg-white/10 border border-white/20
              text-white hover:bg-white/20 transition-colors"
          >
            {t('retry')}
          </button>
        )}
      </div>
    );
  }

  const stats = [
    { label: t('totalLights'), value: total, icon: '💡' },
    { label: t('todayLights'), value: today, icon: '✨' },
    { label: t('countries'), value: countries, icon: '🌍' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-2xl mx-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 text-center border border-white/10"
        >
          <div className="text-3xl md:text-4xl mb-2">{stat.icon}</div>
          <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1 leading-tight">
            {stat.value.toLocaleString()}
          </div>
          <div className="text-sm md:text-base text-gray-400 leading-snug">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
