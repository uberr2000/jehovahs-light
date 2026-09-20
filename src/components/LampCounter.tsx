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
    <div className="flex items-center gap-3.5">
      <span className="relative flex h-3.5 w-3.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300/60" />
        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_16px_3px_rgba(245,180,90,0.85)]" />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="font-mono text-[4.5rem] font-semibold tabular-nums tracking-tight text-amber-50 sm:text-[6rem]">
          {display.toLocaleString()}
        </span>
        <span className="text-[1.5rem] uppercase tracking-[0.22em] text-amber-100/55 sm:text-[1.75rem]">
          {t('counterLabel')}
        </span>
      </div>
    </div>
  );
}
