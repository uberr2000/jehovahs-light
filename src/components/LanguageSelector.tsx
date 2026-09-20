'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

interface LanguageSelectorProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export default function LanguageSelector({
  currentLocale,
  onLocaleChange,
}: LanguageSelectorProps) {
  const t = useTranslations('language');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 rounded-full border border-amber-200/15 bg-black/20 p-0.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t('select')}
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 rounded-full bg-amber-300/90 px-3 py-1 text-xs font-medium text-neutral-900 transition-colors"
        >
          <span aria-hidden="true">{localeFlags[currentLocale]}</span>
          <span>{localeNames[currentLocale]}</span>
          <svg
            className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 max-h-[min(70vh,24rem)] min-w-[180px] overflow-y-auto rounded-2xl border border-amber-200/12 bg-neutral-950/90 p-1 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl end-0">
          {locales.map((locale) => {
            const active = currentLocale === locale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => {
                  onLocaleChange(locale);
                  setIsOpen(false);
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-full px-3 py-2 text-start text-xs font-medium transition-colors ${
                  active
                    ? 'bg-amber-300/90 text-neutral-900'
                    : 'text-amber-50/70 hover:bg-white/5 hover:text-amber-50'
                }`}
              >
                <span className="text-sm" aria-hidden="true">
                  {localeFlags[locale]}
                </span>
                <span>{localeNames[locale]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
