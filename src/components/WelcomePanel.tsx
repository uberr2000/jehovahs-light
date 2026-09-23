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

  const hint = (
    <p className="text-[0.875rem] leading-none text-amber-100/50 sm:text-[1rem]">{t('rotateHint')}</p>
  );

  return (
    <div className="flex w-full max-w-lg flex-col gap-1.5 lg:max-w-md lg:gap-0">
      <div className="pointer-events-auto w-full rounded-none border-0 bg-transparent px-1 py-0 shadow-none backdrop-blur-none lg:rounded-[0.875rem] lg:border lg:border-amber-200/12 lg:bg-neutral-950/45 lg:px-4 lg:py-4 lg:shadow-[0_4px_30px_-6px_rgba(0,0,0,0.8)] lg:backdrop-blur-xl">
        {hasLit ? (
          <div className="flex flex-col gap-2 lg:gap-3">
            <div className="flex flex-col gap-1 lg:gap-1.5">
              <h2 className="text-balance text-base font-semibold leading-snug tracking-tight text-amber-50 lg:text-[0.9375rem] lg:leading-none">
                {t('litTitle')}
              </h2>
              <p className="text-pretty text-sm leading-snug text-amber-100/75 lg:text-[0.5625rem] lg:leading-tight">
                {t('litMessage')}
              </p>
            </div>
            <LampCounter count={count} />
            <StatsError status={statsStatus} onRetry={onRetry} />
            <div className="hidden lg:block">{hint}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 lg:gap-3">
            <LightLampButton onLocationReceived={onLocationReceived} />
            <LampCounter count={count} />
            <StatsError status={statsStatus} onRetry={onRetry} />
            <div className="hidden lg:block">{hint}</div>
          </div>
        )}
      </div>
      <p className="px-1 text-center text-xs leading-snug text-amber-100/50 lg:hidden">
        {t('rotateHint')}
      </p>
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
    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start lg:gap-1">
      <p className="text-xs text-amber-200/80 lg:text-xs">{t('loadError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-full border border-amber-200/20 bg-white/5 px-3 py-1.5 text-xs text-amber-50 hover:bg-white/10 lg:px-2 lg:py-1"
      >
        {t('retry')}
      </button>
    </div>
  );
}
