import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { JSDOM } from 'jsdom';
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
  return href
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function expectedSocial() {
  const url = siteShareUrl();
  const place = formatPlaceLabel({ city: 'Taipei', country: 'Taiwan' });
  const locationLine = en.home.shareLocation.replace('{place}', place ?? '');
  const text = buildShareText(en.home.shareText, locationLine);
  return socialShareUrls(text, url, en.home.shareTitle);
}

function shareTree() {
  return createElement(
    NextIntlClientProvider,
    { locale: 'en', messages: en, timeZone: 'UTC' },
    createElement(ShareLightButton, {
      hasLit: true,
      place: { city: 'Taipei', country: 'Taiwan' },
    })
  );
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

  it('SSR markup emits full LINE/FB/X/WhatsApp hrefs and no mailto', () => {
    const html = renderToString(shareTree());
    const expected = expectedSocial();

    assert.doesNotMatch(html, /mailto:/i);
    assert.doesNotMatch(html, /cdn-cgi\/l\/email-protection/);
    assert.equal(hrefOf(html, 'share-via-email'), '#');

    const cases = [
      ['share-via-line', expected.line],
      ['share-via-facebook', expected.facebook],
      ['share-via-x', expected.x],
      ['share-via-whatsapp', expected.whatsapp],
    ] as const;

    for (const [testId, href] of cases) {
      const rendered = hrefOf(html, testId);
      assert.notEqual(rendered, '#');
      assert.equal(rendered, href);
      assert.doesNotMatch(rendered, /25\.033|121\.56/);
    }
  });

  it('after mount, all five hrefs are the full share URLs', async () => {
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      url: `${APP_URL}/`,
      pretendToBeVisual: true,
    });
    const { window } = dom;
    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      HTMLElement: globalThis.HTMLElement,
      Node: globalThis.Node,
      Element: globalThis.Element,
    };
    const previousAct = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    globalThis.window = window as unknown as typeof globalThis.window;
    globalThis.document = window.document;
    globalThis.HTMLElement = window.HTMLElement;
    globalThis.Node = window.Node;
    globalThis.Element = window.Element;
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const expected = expectedSocial();
    const container = window.document.getElementById('root');
    assert.ok(container);
    let root: Root | undefined;
    try {
      await act(async () => {
        root = createRoot(container);
        root.render(shareTree());
      });

      const hrefById = (testId: string) =>
        container.querySelector(`[data-testid="${testId}"]`)?.getAttribute('href') ?? '';

      const cases = [
        ['share-via-line', expected.line],
        ['share-via-facebook', expected.facebook],
        ['share-via-x', expected.x],
        ['share-via-whatsapp', expected.whatsapp],
        ['share-via-email', expected.email],
      ] as const;

      for (const [testId, href] of cases) {
        const rendered = hrefById(testId);
        assert.notEqual(rendered, '#');
        assert.equal(rendered, href);
        assert.doesNotMatch(rendered, /25\.033|121\.56/);
      }
      assert.match(hrefById('share-via-email'), /^mailto:\?subject=/);
    } finally {
      await act(async () => {
        root?.unmount();
      });
      globalThis.window = previous.window;
      globalThis.document = previous.document;
      globalThis.HTMLElement = previous.HTMLElement;
      globalThis.Node = previous.Node;
      globalThis.Element = previous.Element;
      (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previousAct;
    }
  });
});
