'use client';

import { useTranslations } from 'next-intl';
import LampCounter from '@/components/LampCounter';
import LightLampButton from '@/components/LightLampButton';

export default function WelcomePanel({
  count,
  hasLit,
  statsStatus,
  onRetry,
  onLocationReceived,
}: {
  count: number;
  hasLit: boolean;
  statsStatus: 'loading' | 'ok' | 'error';
  onRetry: () => void;
  onLocationReceived: (lat: number, lng: number) => void;
}) {
  const t = useTranslations('home');

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-amber-200/12 bg-neutral-950/55 p-6 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-7">
      {hasLit ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-balance text-xl font-semibold text-amber-50">{t('litTitle')}</h2>
            <p className="text-pretty text-sm leading-relaxed text-amber-100/70">{t('litMessage')}</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />
          <LampCounter count={count} />
          <StatsError status={statsStatus} onRetry={onRetry} />
          <p className="text-xs text-amber-100/45">{t('rotateHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-amber-50 sm:text-3xl">
              {t('heroTitle')}
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-amber-100/70">{t('heroSubtitle')}</p>
          </div>
          <LightLampButton onLocationReceived={onLocationReceived} />
          <div className="h-px bg-gradient-to-r from-transparent via-amber-200/15 to-transparent" />
          <LampCounter count={count} />
          <StatsError status={statsStatus} onRetry={onRetry} />
        </div>
      )}
    </div>
  );
}

function StatsError({
  status,
  onRetry,
}: {
  status: 'loading' | 'ok' | 'error';
  onRetry: () => void;
}) {
  const t = useTranslations('home');
  if (status !== 'error') return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-amber-200/80">{t('loadError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-full border border-amber-200/20 bg-white/5 px-3 py-1.5 text-xs text-amber-50 hover:bg-white/10"
      >
        {t('retry')}
      </button>
    </div>
  );
}
