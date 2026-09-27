import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_PUBLIC_URL,
  EXPECTED_TITLE_BRAND,
  checkPublicUrl,
  evaluateHomePage,
  evaluateManifest,
  evaluateOgImage,
  extractOgImage,
  extractTitle,
  normalizePublicUrl,
} from './check-public-url.mjs';

const OUR_HTML = `<!doctype html><html><head>
<title>點亮地球 · Light Up the Earth | Jehovah's Light</title>
<meta property="og:image" content="https://jehovahs-light.ink.net.tw/opengraph-image?123" />
</head><body></body></html>`;

const OTHER_HTML = `<!doctype html><html><head>
<title>Laravel — Some Other App</title>
<meta property="og:image" content="https://example.com/logo.png" />
</head><body></body></html>`;

describe('check-public-url', () => {
  it('normalizes the configured public origin', () => {
    assert.equal(
      normalizePublicUrl('https://jehovahs-light.ink.net.tw'),
      'https://jehovahs-light.ink.net.tw/'
    );
    assert.equal(normalizePublicUrl(''), DEFAULT_PUBLIC_URL);
  });

  it('requires GET / 200 and the 點亮地球 title', () => {
    assert.deepEqual(evaluateHomePage(200, OUR_HTML, DEFAULT_PUBLIC_URL), []);
    const wrongTitle = evaluateHomePage(200, OTHER_HTML, DEFAULT_PUBLIC_URL);
    assert.equal(wrongTitle.length, 1);
    assert.match(wrongTitle[0], /Laravel/);
    assert.match(wrongTitle[0], /mis-routed/);
    assert.match(wrongTitle[0], new RegExp(EXPECTED_TITLE_BRAND));
    const notOk = evaluateHomePage(502, '', DEFAULT_PUBLIC_URL);
    assert.match(notOk[0], /HTTP 502/);
  });

  it('parses title and og:image', () => {
    assert.equal(extractTitle(OUR_HTML), "點亮地球 · Light Up the Earth | Jehovah's Light");
    assert.equal(
      extractOgImage(OUR_HTML),
      'https://jehovahs-light.ink.net.tw/opengraph-image?123'
    );
    assert.equal(extractOgImage(OTHER_HTML), 'https://example.com/logo.png');
  });

  it('requires the manifest and og:image to be the right types', () => {
    assert.deepEqual(evaluateManifest(200, 'application/manifest+json'), []);
    assert.match(evaluateManifest(404, null)[0], /HTTP 404/);
    assert.deepEqual(evaluateOgImage(200, 'image/png', 'https://x/og.png'), []);
    assert.match(evaluateOgImage(200, 'text/html', 'https://x/og.png')[0], /not an image/);
  });

  it('checkPublicUrl fails closed on a foreign 200 HTML page', async () => {
    const fetchFn = async (input: string) => {
      if (String(input).endsWith('/app-manifest')) {
        return {
          status: 200,
          headers: { get: () => 'application/manifest+json' },
          text: async () => '{}',
        };
      }
      if (String(input).includes('logo.png')) {
        return {
          status: 200,
          headers: { get: () => 'image/png' },
          text: async () => '',
        };
      }
      return {
        status: 200,
        headers: { get: () => 'text/html' },
        text: async () => OTHER_HTML,
      };
    };
    await assert.rejects(() => checkPublicUrl(DEFAULT_PUBLIC_URL, fetchFn), /mis-routed/);
  });

  it('checkPublicUrl passes when title, manifest, and og:image match', async () => {
    const fetchFn = async (input: string) => {
      if (String(input).includes('app-manifest')) {
        return {
          status: 200,
          headers: { get: () => 'application/manifest+json; charset=utf-8' },
          text: async () => '{}',
        };
      }
      if (String(input).includes('opengraph-image')) {
        return {
          status: 200,
          headers: { get: () => 'image/png' },
          text: async () => '',
        };
      }
      return {
        status: 200,
        headers: { get: () => 'text/html' },
        text: async () => OUR_HTML,
      };
    };
    await checkPublicUrl(DEFAULT_PUBLIC_URL, fetchFn);
  });
});
