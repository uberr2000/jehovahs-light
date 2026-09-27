'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Shrink font-size so `children` stay on one line inside the parent. */
export default function FitSingleLine({
  className,
  maxPx,
  maxPxLg,
  minPx = 16,
  testId,
  children,
}: {
  className?: string;
  maxPx: number;
  maxPxLg?: number;
  minPx?: number;
  testId?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const cap = () =>
      window.innerWidth >= 1024 && maxPxLg != null ? maxPxLg : maxPx;

    const fit = () => {
      const max = cap();
      el.style.setProperty('font-size', `${max}px`, 'important');
      const avail = parent.clientWidth;
      if (avail < 8 || el.scrollWidth <= avail) return;
      const next = Math.max(minPx, Math.floor((max * avail) / el.scrollWidth));
      el.style.setProperty('font-size', `${next}px`, 'important');
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [children, maxPx, maxPxLg, minPx]);

  return (
    <span ref={ref} data-testid={testId} className={className}>
      {children}
    </span>
  );
}
