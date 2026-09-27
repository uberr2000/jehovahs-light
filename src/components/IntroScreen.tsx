'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Noto_Serif_TC } from 'next/font/google';
import { useTranslations } from 'next-intl';
import styles from './IntroScreen.module.css';

const serif = Noto_Serif_TC({
  variable: '--font-intro-serif',
  display: 'swap',
  preload: false,
});

const ENTERED_KEY = 'jl-intro-entered';
const LEAVE_MS = 1000;

function readEntered(): boolean {
  try {
    return window.sessionStorage.getItem(ENTERED_KEY) === '1';
  } catch {
    return false;
  }
}

function markEntered() {
  try {
    window.sessionStorage.setItem(ENTERED_KEY, '1');
  } catch {
    // Storage disabled: the intro simply shows again on reload.
  }
}

const noopSubscribe = () => () => {};

/** True once this tab has passed the intro, so locale reloads skip it. */
export function useIntroEntered(): boolean {
  return useSyncExternalStore(noopSubscribe, readEntered, () => false);
}

interface IntroScreenProps {
  onEnter: () => void;
  toolbar?: ReactNode;
}

export default function IntroScreen({ onEnter, toolbar }: IntroScreenProps) {
  const t = useTranslations('intro');
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const handleEnter = () => {
    if (leaving) return;
    setLeaving(true);
    timerRef.current = window.setTimeout(() => {
      markEntered();
      onEnter();
    }, LEAVE_MS);
  };

  return (
    <div
      data-testid="intro-screen"
      className={`${styles.stage} ${serif.variable} ${leaving ? styles.leaving : ''}`}
    >
      <div className={styles.stars} aria-hidden="true" />
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      <div className={styles.lightWrap} aria-hidden="true">
        <div className={styles.rays} />
        <div className={styles.glow} />
        <div className={styles.core} />
      </div>

      <div className={styles.textBlock}>
        <p className={styles.tagline}>{t('tagline')}</p>
        <h1 className={styles.title}>{t('title')}</h1>
      </div>

      <button
        type="button"
        data-testid="intro-enter"
        className={styles.enter}
        onClick={handleEnter}
        disabled={leaving}
      >
        {t('enter')}
      </button>
    </div>
  );
}
