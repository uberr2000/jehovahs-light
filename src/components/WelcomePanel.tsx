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
    <div className="pointer-events-auto w-full max-w-md rounded-[1.75rem] border border-amber-200/12 bg-neutral-950/45 px-6 py-7 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-8 sm:py-8">
      {hasLit ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-balance text-[1.65rem] font-semibold leading-tight tracking-tight text-amber-50 sm:text-3xl">
              {t('litTitle')}
            </h2>
            <p className="text-pretty text-base leading-relaxed text-amber-100/75 sm:text-lg">
              {t('litMessage')}
            </p>
          </div>
          <LampCounter count={count} />
          <StatsError status={statsStatus} onRetry={onRetry} />
          <p className="text-[1.75rem] text-amber-100/50 sm:text-[2rem]">{t('rotateHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <LightLampButton onLocationReceived={onLocationReceived} />
          <LampCounter count={count} />
          <StatsError status={statsStatus} onRetry={onRetry} />
          <p className="text-[1.75rem] text-amber-100/50 sm:text-[2rem]">{t('rotateHint')}</p>
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
      <p className="text-sm text-amber-200/80">{t('loadError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-full border border-amber-200/20 bg-white/5 px-4 py-2 text-sm text-amber-50 hover:bg-white/10"
      >
        {t('retry')}
      </button>
    </div>
  );
}
