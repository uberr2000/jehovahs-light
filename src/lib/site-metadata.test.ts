import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { locales, type Locale } from '../i18n/config.ts';
import {
  OG_LOCALE,
  PWA_SHORT_NAME,
  metadataBaseUrl,
  metadataCanonicalUrl,
  ogAlternateLocales,
  ogLocaleFor,
} from './site-metadata.ts';

function withAppUrl(value: string | undefined, fn: () => void) {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = value;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
}

describe('site metadata URLs', () => {
  it('builds metadataBase and og:url from NEXT_PUBLIC_APP_URL only', () => {
    withAppUrl('https://jehovahs-light.ink.net.tw/?utm=x#hash', () => {
      assert.equal(metadataBaseUrl()?.toString(), 'https://jehovahs-light.ink.net.tw/');
      assert.equal(metadataCanonicalUrl('/'), 'https://jehovahs-light.ink.net.tw/');
      assert.equal(
        metadataCanonicalUrl('/opengraph-image'),
        'https://jehovahs-light.ink.net.tw/opengraph-image'
      );
    });
  });

  it('follows #22 placeholder rules and never invents a Host', () => {
    const unset = [
      undefined,
      '',
      'http://jehovahs-light.ink.net.tw/',
      'https://your-domain.com',
      'https://example.invalid',
      'https://example.com',
    ];
    for (const value of unset) {
      withAppUrl(value, () => {
        assert.equal(metadataBaseUrl(), undefined, String(value));
        assert.equal(metadataCanonicalUrl('/'), undefined, String(value));
      });
    }
  });

  it('maps every supported locale to an og:locale tag', () => {
    assert.equal(ogLocaleFor('zh-TW'), 'zh_TW');
    assert.equal(ogLocaleFor('en'), 'en_US');
    assert.equal(ogLocaleFor('ja'), 'ja_JP');
    for (const locale of locales) {
      assert.match(OG_LOCALE[locale], /^[a-z]{2}_[A-Z]{2}$/);
      const alts = ogAlternateLocales(locale as Locale);
      assert.equal(alts.length, locales.length - 1);
      assert.equal(alts.includes(OG_LOCALE[locale]), false);
    }
  });

  it('keeps the PWA short_name at or under 12 characters', () => {
    assert.equal(PWA_SHORT_NAME, '點亮地球');
    assert.ok([...PWA_SHORT_NAME].length <= 12);
  });
});
