import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

const VALID_APP_URL = 'https://jehovahs-light.ink.net.tw';
const SOCIAL_IDS = [
  'share-via-line',
  'share-via-facebook',
  'share-via-x',
  'share-via-whatsapp',
] as const;

const PLACEHOLDER_ENVS = [
  ['empty', ''],
  ['non-https', 'http://jehovahs-light.ink.net.tw/'],
  ['your-domain.com', 'https://your-domain.com'],
  ['example.invalid', 'https://example.invalid'],
  ['example.com', 'https://example.com'],
] as const;

async function withAppUrl<T>(value: string, fn: () => T | Promise<T>): Promise<T> {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = value;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
}

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

function expectedSocial(origin: string) {
  const url = siteShareUrl(origin);
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

async function renderMounted(pageUrl: string) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: pageUrl,
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

  const container = window.document.getElementById('root');
  assert.ok(container);
  let root: Root | undefined;
  await act(async () => {
    root = createRoot(container);
    root.render(shareTree());
  });

  return {
    container,
    hrefById: (testId: string) =>
      container.querySelector(`[data-testid="${testId}"]`)?.getAttribute('href') ?? '',
    cleanup: async () => {
      await act(async () => {
        root?.unmount();
      });
      globalThis.window = previous.window;
      globalThis.document = previous.document;
      globalThis.HTMLElement = previous.HTMLElement;
      globalThis.Node = previous.Node;
      globalThis.Element = previous.Element;
      (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previousAct;
    },
  };
}

describe('ShareLightButton rendered hrefs', () => {
  it('SSR markup emits full LINE/FB/X/WhatsApp hrefs when the test sets a valid APP_URL', async () => {
    await withAppUrl(VALID_APP_URL, () => {
      const html = renderToString(shareTree());
      const expected = expectedSocial(VALID_APP_URL);

      assert.doesNotMatch(html, /mailto:/i);
      assert.doesNotMatch(html, /cdn-cgi\/l\/email-protection/);
      assert.equal(hrefOf(html, 'share-via-email'), '#');

      for (const testId of SOCIAL_IDS) {
        const key = testId.replace('share-via-', '') as 'line' | 'facebook' | 'x' | 'whatsapp';
        const rendered = hrefOf(html, testId);
        assert.notEqual(rendered, '#');
        assert.equal(rendered, expected[key]);
        assert.doesNotMatch(rendered, /25\.033|121\.56/);
      }
    });
  });

  it('after mount with a valid APP_URL, all five hrefs are the full share URLs', async () => {
    await withAppUrl(VALID_APP_URL, async () => {
      const mounted = await renderMounted(`${VALID_APP_URL}/`);
      try {
        const expected = expectedSocial(VALID_APP_URL);
        const cases = [
          ['share-via-line', expected.line],
          ['share-via-facebook', expected.facebook],
          ['share-via-x', expected.x],
          ['share-via-whatsapp', expected.whatsapp],
          ['share-via-email', expected.email],
        ] as const;
        for (const [testId, href] of cases) {
          const rendered = mounted.hrefById(testId);
          assert.notEqual(rendered, '#');
          assert.equal(rendered, href);
          assert.doesNotMatch(rendered, /25\.033|121\.56/);
        }
        assert.match(mounted.hrefById('share-via-email'), /^mailto:\?subject=/);
      } finally {
        await mounted.cleanup();
      }
    });
  });

  it('placeholder / empty / non-https APP_URL: SSR social hrefs stay # and mount uses window.origin', async () => {
    const expected = expectedSocial(VALID_APP_URL);
    for (const [name, env] of PLACEHOLDER_ENVS) {
      await withAppUrl(env, async () => {
        const html = renderToString(shareTree());
        assert.doesNotMatch(html, /mailto:/i, `${name} SSR has no mailto`);
        for (const testId of SOCIAL_IDS) {
          assert.equal(hrefOf(html, testId), '#', `${name} SSR ${testId}`);
        }
        assert.equal(hrefOf(html, 'share-via-email'), '#', `${name} SSR email`);

        const mounted = await renderMounted(`${VALID_APP_URL}/`);
        try {
          for (const testId of SOCIAL_IDS) {
            const key = testId.replace('share-via-', '') as 'line' | 'facebook' | 'x' | 'whatsapp';
            assert.equal(mounted.hrefById(testId), expected[key], `${name} mount ${testId}`);
          }
          assert.equal(mounted.hrefById('share-via-email'), expected.email, `${name} mount email`);
        } finally {
          await mounted.cleanup();
        }
      });
    }
  });
});
