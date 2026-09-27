import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import ShareLightButton from './ShareLightButton.tsx';
import en from '../i18n/messages/en.json' with { type: 'json' };
import {
  buildShareText,
  formatPlaceLabel,
  siteShareUrl,
  socialShareUrls,
} from '../lib/share.ts';

const APP_URL = 'https://jehovahs-light.ink.net.tw';

function hrefOf(html: string, testId: string): string {
  const tags = html.match(/<a\b[^>]*>/g) ?? [];
  const tag = tags.find((item) => item.includes(`data-testid="${testId}"`));
  const href = tag?.match(/href="([^"]*)"/)?.[1] ?? '';
  return href.replace(/&amp;/g, '&');
}

describe('ShareLightButton rendered hrefs', () => {
  const previousUrl = process.env.NEXT_PUBLIC_APP_URL;

  before(() => {
    process.env.NEXT_PUBLIC_APP_URL = APP_URL;
  });

  after(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousUrl;
  });

  it('SSR markup emits full LINE/FB/X/WhatsApp/email hrefs, not #', () => {
    const html = renderToString(
      createElement(
        NextIntlClientProvider,
        { locale: 'en', messages: en, timeZone: 'UTC' },
        createElement(ShareLightButton, {
          hasLit: true,
          place: { city: 'Taipei', country: 'Taiwan' },
        })
      )
    );

    const url = siteShareUrl();
    const place = formatPlaceLabel({ city: 'Taipei', country: 'Taiwan' });
    const locationLine = en.home.shareLocation.replace('{place}', place ?? '');
    const text = buildShareText(en.home.shareText, locationLine);
    const expected = socialShareUrls(text, url, en.home.shareTitle);

    const cases = [
      ['share-via-line', expected.line],
      ['share-via-facebook', expected.facebook],
      ['share-via-x', expected.x],
      ['share-via-whatsapp', expected.whatsapp],
      ['share-via-email', expected.email],
    ] as const;

    for (const [testId, href] of cases) {
      const rendered = hrefOf(html, testId);
      assert.notEqual(rendered, '#');
      assert.equal(rendered, href);
      assert.doesNotMatch(rendered, /25\.033|121\.56/);
    }
  });
});
