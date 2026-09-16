'use client';

import { useTranslations } from 'next-intl';

interface StatsProps {
  total: number;
  today: number;
  countries: number;
}

export default function Stats({ total, today, countries }: StatsProps) {
  const t = useTranslations('stats');

  const stats = [
    { label: t('totalLights'), value: total, icon: '💡' },
    { label: t('todayLights'), value: today, icon: '✨' },
    { label: t('countries'), value: countries, icon: '🌍' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
        >
          <div className="text-3xl mb-2">{stat.icon}</div>
          <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-1">
            {stat.value.toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
