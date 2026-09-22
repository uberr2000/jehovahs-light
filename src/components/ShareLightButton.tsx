'use client';

import { useEffect, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  assertSafeSharePayload,
  buildClipboardPayload,
  buildShareText,
  canUseWebShare,
  copyToClipboard,
  configuredShareUrl,
  formatPlaceLabel,
  prefersNativeShare,
  siteShareUrl,
  socialShareUrls,
  type PlaceFields,
} from '@/lib/share';

function subscribeShareUrl() {
  return () => {};
}

export default function ShareLightButton({
  hasLit,
  place,
}: {
  hasLit: boolean;
  place?: PlaceFields | null;
}) {
  const t = useTranslations('home');
  const [copied, setCopied] = useState(false);
  const [manualText, setManualText] = useState<string | null>(null);
  const [shareState, setShareState] = useState('idle');
  const shareUrl = useSyncExternalStore(
    subscribeShareUrl,
    siteShareUrl,
    configuredShareUrl
  );

  const placeLabel = formatPlaceLabel(place);
  const locationLine =
    hasLit && placeLabel ? t('shareLocation', { place: placeLabel }) : null;

  const getPayload = () => {
    const url = siteShareUrl() || shareUrl;
    const text = buildShareText(t('shareText'), locationLine);
    const title = t('shareTitle');
    const clipboard = buildClipboardPayload(text, url);
    return { url, text, title, clipboard };
  };

  const text = buildShareText(t('shareText'), locationLine);
  const title = t('shareTitle');
  const clipboard = buildClipboardPayload(text, shareUrl);
  const socialSafe = Boolean(shareUrl) && assertSafeSharePayload(clipboard);
  const social = socialSafe
    ? socialShareUrls(text, shareUrl, title)
    : { line: '#', facebook: '#', x: '#', whatsapp: '#', email: '#' };
  // Neutral until mount — Cloudflare Email Obfuscation rewrites any SSR `mailto:`.
  const [emailHref, setEmailHref] = useState('#');

  useEffect(() => {
    // Cloudflare must not see `mailto:` in the first HTML. Assign after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-mount email href
    setEmailHref(socialSafe ? social.email : '#');
  }, [social.email, socialSafe]);

  useEffect(() => {
    if (!copied && !manualText) return;
    const timer = window.setTimeout(() => {
      setCopied(false);
      setManualText(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [copied, manualText]);

  const copyPayload = async (clipboard: string) => {
    if (!assertSafeSharePayload(clipboard)) {
      setShareState('unsafe');
      return;
    }
    const ok = await copyToClipboard(clipboard);
    if (ok) {
      setManualText(null);
      setCopied(true);
      setShareState('copied');
      return;
    }
    setCopied(false);
    setManualText(clipboard);
    setShareState('manual');
  };

  const handleShare = async () => {
    setShareState('clicked');
    const payload = getPayload();
    if (!payload.url) {
      setShareState('nourl');
      return;
    }
    if (!assertSafeSharePayload(payload.clipboard)) {
      setShareState('unsafe');
      return;
    }

    const shareData: ShareData = {
      title: payload.title,
      text: payload.text,
      url: payload.url,
    };

    if (prefersNativeShare() && canUseWebShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareState('shared');
        return;
      } catch {
        // cancel or unavailable → clipboard
      }
    }

    await copyPayload(payload.clipboard);
  };

  const handleSocialClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href') ?? '';
    if (!socialSafe || href === '#' || href === '') event.preventDefault();
  };

  return (
    <div className="home-share flex flex-col gap-1" data-testid="share-root" data-share-state={shareState}>
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
          <SocialLink
            href={social.line}
            label={t('shareViaLine')}
            testId="share-via-line"
            onClick={handleSocialClick}
          >
            <LineGlyph />
          </SocialLink>
          <SocialLink
            href={social.facebook}
            label={t('shareViaFacebook')}
            testId="share-via-facebook"
            onClick={handleSocialClick}
          >
            <FacebookGlyph />
          </SocialLink>
          <SocialLink
            href={social.x}
            label={t('shareViaX')}
            testId="share-via-x"
            onClick={handleSocialClick}
          >
            <XGlyph />
          </SocialLink>
          <SocialLink
            href={social.whatsapp}
            label={t('shareViaWhatsApp')}
            testId="share-via-whatsapp"
            onClick={handleSocialClick}
          >
            <WhatsAppGlyph />
          </SocialLink>
          <SocialLink
            href={emailHref}
            label={t('shareViaEmail')}
            testId="share-via-email"
            newTab={false}
            onClick={handleSocialClick}
          >
            <EmailGlyph />
          </SocialLink>
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
      {manualText ? (
        <div className="flex flex-col gap-1" data-testid="share-manual">
          <p className="px-1 text-center text-[0.6875rem] leading-none text-amber-100/70 lg:text-start lg:text-[0.625rem]">
            {t('shareSelect')}
          </p>
          <textarea
            readOnly
            data-testid="share-manual-payload"
            value={manualText}
            onFocus={(event) => event.currentTarget.select()}
            className="max-h-16 w-full resize-none rounded-md border border-amber-200/20 bg-black/40 px-2 py-1 text-[0.625rem] leading-snug text-amber-50"
          />
        </div>
      ) : null}
    </div>
  );
}

function SocialLink({
  href,
  label,
  testId,
  newTab = true,
  onClick,
  children,
}: {
  href: string;
  label: string;
  testId: string;
  newTab?: boolean;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      data-testid={testId}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200/20 bg-white/5 text-amber-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    >
      {children}
    </a>
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
      <path d="M19.2 4.6H4.8A2.3 2.3 0 0 0 2.5 6.9v8.2c0 1.3 1 2.3 2.3 2.3h.9v2.4c0 .4.5.6.8.4l3.3-2.8h9.4c1.3 0 2.3-1 2.3-2.3V6.9c0-1.3-1-2.3-2.3-2.3z" />
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

function WhatsAppGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.3 21.8l5.1-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3z" />
    </svg>
  );
}

function EmailGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}
