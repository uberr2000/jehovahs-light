'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

const SAFETY_PX = 8;

function inkWidth(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  let w = 0;
  for (const rect of range.getClientRects()) {
    if (rect.width > w) w = rect.width;
  }
  return w;
}

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
      const box = el.clientWidth || parent.clientWidth;
      const budget = Math.max(minPx, box - SAFETY_PX);
      let next = max;
      let ink = inkWidth(el);
      if (ink > budget && ink > 0) {
        next = Math.max(minPx, Math.floor((max * budget) / ink));
        el.style.setProperty('font-size', `${next}px`, 'important');
        ink = inkWidth(el);
      }
      let guard = 48;
      while (
        guard-- > 0 &&
        next > minPx &&
        (el.scrollWidth > el.clientWidth + 1 || inkWidth(el) > budget)
      ) {
        next -= 1;
        el.style.setProperty('font-size', `${next}px`, 'important');
      }
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
