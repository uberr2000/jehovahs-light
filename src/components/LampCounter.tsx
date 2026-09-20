'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

function useAnimatedCount(target: number) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      setDisplay(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target]);

  return display;
}

export default function LampCounter({ count }: { count: number }) {
  const t = useTranslations('home');
  const display = useAnimatedCount(count);

  return (
    <div className="flex items-center gap-2.5 lg:gap-3.5">
      <span className="relative flex h-2.5 w-2.5 shrink-0 lg:h-3.5 lg:w-3.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_16px_3px_rgba(245,180,90,0.85)] lg:h-3.5 lg:w-3.5" />
      </span>
      <div className="flex flex-row flex-wrap items-baseline gap-x-2 gap-y-0 leading-none lg:flex-col lg:leading-tight">
        <span className="font-mono text-[2.75rem] font-semibold tabular-nums tracking-tight text-amber-50 lg:text-[6rem]">
          {display.toLocaleString()}
        </span>
        <span className="text-sm uppercase tracking-[0.18em] text-amber-100/55 lg:text-[1.75rem] lg:tracking-[0.22em]">
          {t('counterLabel')}
        </span>
      </div>
    </div>
  );
}
