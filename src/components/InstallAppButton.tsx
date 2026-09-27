'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import {
  hasInstallPrompt,
  isIosDevice,
  isStandaloneDisplay,
  promptInstall,
  subscribeDisplayMode,
  subscribeInstallPrompt,
} from '@/lib/install-prompt';

const noopSubscribe = () => () => {};
const serverFalse = () => false;

export default function InstallAppButton() {
  const t = useTranslations('home');
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, hasInstallPrompt, serverFalse);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandaloneDisplay, serverFalse);
  const ios = useSyncExternalStore(noopSubscribe, isIosDevice, serverFalse);
  const [hintOpen, setHintOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hintOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setHintOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hintOpen]);

  if (standalone || (!canPrompt && !ios)) return null;

  const handleClick = () => {
    if (canPrompt) {
      void promptInstall();
      return;
    }
    setHintOpen((open) => !open);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        data-testid="install-app-button"
        onClick={handleClick}
        aria-label={t('installApp')}
        aria-expanded={ios && !canPrompt ? hintOpen : undefined}
        title={t('installApp')}
        className="flex h-9 items-center gap-1.5 rounded-full border border-amber-200/15 bg-black/20 px-2.5 text-sm font-medium text-amber-50 backdrop-blur-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
      >
        <InstallGlyph />
        <span className="hidden sm:inline">{t('installApp')}</span>
      </button>
      {hintOpen ? (
        <p
          role="status"
          data-testid="install-ios-hint"
          className="absolute end-0 top-full z-50 mt-2 w-56 rounded-2xl border border-amber-200/12 bg-neutral-950/90 px-3 py-2 text-xs leading-snug text-amber-50/85 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          {t('installIosHint')}
        </p>
      ) : null}
    </div>
  );
}

function InstallGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}
