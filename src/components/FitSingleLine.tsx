'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

const SAFETY_PX = 8;

/** Shrink font-size so `children` stay on one line with a safety margin. */
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
      const avail = Math.min(parent.clientWidth, el.clientWidth || parent.clientWidth);
      const budget = Math.max(8, avail - SAFETY_PX);
      let next = max;
      if (el.scrollWidth > budget) {
        next = Math.max(minPx, Math.floor((max * budget) / el.scrollWidth));
        el.style.setProperty('font-size', `${next}px`, 'important');
      }
      let guard = 24;
      while (
        guard-- > 0 &&
        next > minPx &&
        (el.scrollWidth > el.clientWidth + 1 || el.scrollWidth > budget)
      ) {
        next -= 1;
        el.style.setProperty('font-size', `${next}px`, 'important');
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [children, maxPx, maxPxLg, minPx]);

  return (
    <span
      ref={ref}
      data-testid={testId}
      className={className}
      style={{ overflow: 'visible', whiteSpace: 'nowrap' }}
    >
      {children}
    </span>
  );
}
