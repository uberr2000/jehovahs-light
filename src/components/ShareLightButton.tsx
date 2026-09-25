'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  assertSafeSharePayload,
  buildClipboardPayload,
  buildShareText,
  canUseWebShare,
  copyToClipboard,
  formatPlaceLabel,
  prefersNativeShare,
  siteShareUrl,
  socialShareUrls,
  type PlaceFields,
} from '@/lib/share';

export default function ShareLightButton({
  hasLit,
  place,
}: {
  hasLit: boolean;
  place?: PlaceFields | null;
}) {
  const t = useTranslations('home');
  const [copied, setCopied] = useState(false);

  const placeLabel = formatPlaceLabel(place);
  const locationLine =
    hasLit && placeLabel ? t('shareLocation', { place: placeLabel }) : null;

  const getPayload = () => {
    const url = siteShareUrl();
    const text = buildShareText(t('shareText'), locationLine);
    const title = t('shareTitle');
    const clipboard = buildClipboardPayload(text, url);
    return { url, text, title, clipboard };
  };

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyPayload = async (clipboard: string) => {
    if (!assertSafeSharePayload(clipboard)) return;
    const ok = await copyToClipboard(clipboard);
    if (ok) setCopied(true);
  };

  const handleShare = async () => {
    const payload = getPayload();
    if (!assertSafeSharePayload(payload.clipboard)) return;

    const shareData: ShareData = {
      title: payload.title,
      text: payload.text,
      url: payload.url,
    };

    if (prefersNativeShare() && canUseWebShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // cancel or unavailable → clipboard
      }
    }

    await copyPayload(payload.clipboard);
  };

  const openSocial = (network: 'line' | 'facebook' | 'x') => {
    const payload = getPayload();
    if (!assertSafeSharePayload(payload.clipboard)) return;
    const href = socialShareUrls(payload.text, payload.url)[network];
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          data-testid="share-light-button"
          onClick={handleShare}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-200/25 bg-white/5 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 lg:min-h-7 lg:flex-none lg:px-3 lg:py-1 lg:text-[0.75rem]"
        >
          <ShareGlyph />
          <span>{t('shareButton')}</span>
        </button>
        <div
          data-testid="share-social-links"
          className="hidden items-center gap-1 lg:flex"
        >
          <SocialButton
            label={t('shareViaLine')}
            testId="share-via-line"
            onClick={() => openSocial('line')}
          >
            <LineGlyph />
          </SocialButton>
          <SocialButton
            label={t('shareViaFacebook')}
            testId="share-via-facebook"
            onClick={() => openSocial('facebook')}
          >
            <FacebookGlyph />
          </SocialButton>
          <SocialButton
            label={t('shareViaX')}
            testId="share-via-x"
            onClick={() => openSocial('x')}
          >
            <XGlyph />
          </SocialButton>
        </div>
      </div>
      {copied ? (
        <p
          role="status"
          aria-live="polite"
          data-testid="share-copied"
          className="px-1 text-center text-[0.6875rem] leading-none text-amber-100/70 lg:text-start lg:text-[0.625rem]"
        >
          {t('shareCopied')}
        </p>
      ) : null}
    </div>
  );
}

function SocialButton({
  label,
  testId,
  onClick,
  children,
}: {
  label: string;
  testId: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 bg-white/5 text-amber-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {children}
    </button>
  );
}

function ShareGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 lg:h-3 lg:w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

function LineGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M12 3C6.9 3 2.8 6.6 2.8 11c0 4 3.5 7.4 8.3 8 .3 0 .8.2.9.5l.6 2c.1.3.5.2.6 0l1.7-2.3c.1-.1.3-.2.5-.2 4.6-.3 8-3.8 8-7.9C23.4 6.6 19.1 3 12 3zm-4.2 9.3H6.2c-.3 0-.5-.2-.5-.5V8.6c0-.3.2-.5.5-.5s.5.2.5.5v3.2h1.6c.3 0 .5.2.5.5s-.2.5-.5.5zm2.3-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V8.6c0-.3.2-.5.5-.5s.5.2.5.5zm4.4.5h-2.3c-.3 0-.5-.2-.5-.5V8.6c0-.3.2-.5.5-.5s.5.2.5.5v3.2h1.8c.3 0 .5.2.5.5s-.2.5-.5.5zm3.5 0h-1.6c-.3 0-.5-.2-.5-.5V8.6c0-.3.2-.5.5-.5h1.6c.3 0 .5.2.5.5s-.2.5-.5.5h-1.1v.6h1.1c.3 0 .5.2.5.5s-.2.5-.5.5h-1.1v.6h1.1c.3 0 .5.2.5.5s-.2.5-.5.5z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1h1.3V3h-2.3C12.3 3 11 4.4 11 6.6v1.9H9v3h2V21h3.5v-9.5h2.3l.4-3z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
      <path d="M17.6 3h3l-6.6 7.5L21.8 21h-5.5l-4.3-6.3L7 21H4l7-8L2.4 3h5.6l3.9 5.8zm-1 16.2h1.7L7.5 4.7H5.7z" />
    </svg>
  );
}
