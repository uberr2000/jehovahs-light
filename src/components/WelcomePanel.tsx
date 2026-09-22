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
    <p className="text-[5.25rem] leading-none text-amber-100/50 sm:text-[6rem]">{t('rotateHint')}</p>
  );

  return (
    <div className="flex w-full max-w-lg flex-col gap-1 lg:max-w-md lg:gap-0">
      <div className="pointer-events-auto w-full rounded-none border-0 bg-transparent px-1 py-0 shadow-none backdrop-blur-none lg:rounded-[1.75rem] lg:border lg:border-amber-200/12 lg:bg-neutral-950/45 lg:px-8 lg:py-8 lg:shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] lg:backdrop-blur-xl">
        {hasLit ? (
          <div className="flex flex-col gap-1.5 lg:gap-6">
            <div className="flex flex-col gap-0.5 lg:gap-2.5">
              <h2 className="text-balance text-[3.75rem] font-semibold leading-none tracking-tight text-amber-50 lg:text-[5.625rem]">
                {t('litTitle')}
              </h2>
              <p className="text-pretty text-[2.625rem] leading-none text-amber-100/75 lg:text-[3.375rem] lg:leading-tight">
                {t('litMessage')}
              </p>
            </div>
            <LampCounter count={count} />
            <StatsError status={statsStatus} onRetry={onRetry} />
            <div className="hidden lg:block">{hint}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 lg:gap-6">
            <LightLampButton onLocationReceived={onLocationReceived} />
            <LampCounter count={count} />
            <StatsError status={statsStatus} onRetry={onRetry} />
            <div className="hidden lg:block">{hint}</div>
          </div>
        )}
      </div>
      <p className="px-1 text-center text-[3rem] leading-none text-amber-100/50 lg:hidden">
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
    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start lg:gap-2">
      <p className="text-xs text-amber-200/80 lg:text-sm">{t('loadError')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-full border border-amber-200/20 bg-white/5 px-3 py-1 text-xs text-amber-50 hover:bg-white/10 lg:px-4 lg:py-2 lg:text-sm"
      >
        {t('retry')}
      </button>
    </div>
  );
}
