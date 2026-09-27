import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertSafeSharePayload,
  buildClipboardPayload,
  buildShareText,
  findNearbyPlace,
  formatPlaceLabel,
  pickPlaceFields,
  configuredShareUrl,
  resolveLitPlace,
  siteShareUrl,
  socialShareUrls,
} from './share.ts';

describe('share payload', () => {
  it('formats city/region phrases and drops coordinate-like strings', () => {
    assert.equal(formatPlaceLabel({ city: 'Taipei', country: 'Taiwan' }), 'Taipei, Taiwan');
    assert.equal(formatPlaceLabel({ city: 'Taipei', country: 'Taipei' }), 'Taipei');
    assert.equal(formatPlaceLabel({ city: '  Kyoto  ', country: null }), 'Kyoto');
    assert.equal(formatPlaceLabel({ city: '25.0330, 121.5654', country: 'Taiwan' }), 'Taiwan');
    assert.equal(formatPlaceLabel({ city: '25.0330123', country: '-121.565400' }), null);
    assert.equal(pickPlaceFields({ city: 'Osaka', latitude: 34.7, longitude: 135.5 })?.city, 'Osaka');
    assert.equal(pickPlaceFields({ latitude: 34.7, longitude: 135.5 }), null);
  });

  it('resolves a nearby lit place without exposing lat/lng', () => {
    const place = resolveLitPlace(
      null,
      { latitude: 25.033, longitude: 121.565 },
      [
        { latitude: 25.034, longitude: 121.566, city: 'Taipei', country: 'Taiwan' },
        { latitude: 35.68, longitude: 139.76, city: 'Tokyo', country: 'Japan' },
      ]
    );
    assert.deepEqual(place, { city: 'Taipei', country: 'Taiwan' });
    assert.equal(findNearbyPlace({ latitude: 1, longitude: 1 }, []), null);
  });

  it('builds invite copy + site URL and never keeps GPS in the payload', () => {
    const url = siteShareUrl('https://jehovahs-light.ink.net.tw/?lat=25.03&lng=121.56#x');
    assert.equal(url, 'https://jehovahs-light.ink.net.tw/');
    const text = buildShareText(
      "Let God's light begin right where you are. Light a lamp with us.",
      'A lamp is shining in Taipei, Taiwan.'
    );
    const clipboard = buildClipboardPayload(text, url);
    assert.match(clipboard, /Taipei, Taiwan/);
    assert.match(clipboard, /https:\/\/jehovahs-light\.ink\.net\.tw\//);
    assert.equal(assertSafeSharePayload(clipboard), true);
    assert.equal(assertSafeSharePayload('text\nhttp://127.0.0.1:3000/'), true);
    assert.equal(assertSafeSharePayload('Meet at 25.0330, 121.5654'), false);
  });

  it('prefers NEXT_PUBLIC_APP_URL as the share site root', () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://jehovahs-light.ink.net.tw/?utm=x#hash';
    try {
      assert.equal(configuredShareUrl(), 'https://jehovahs-light.ink.net.tw/');
      assert.equal(siteShareUrl(), 'https://jehovahs-light.ink.net.tw/');
    } finally {
      if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });

  it('initial social hrefs are the full encoded deep links', () => {
    const text = 'Share the light\nA lamp is shining in Taipei, Taiwan.';
    const url = 'https://jehovahs-light.ink.net.tw/';
    const title = 'Share the light';
    const social = socialShareUrls(text, url, title);
    assert.equal(
      social.line,
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    );
    assert.equal(
      social.facebook,
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    );
    assert.equal(
      social.x,
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    );
    assert.equal(
      social.whatsapp,
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
    );
    assert.equal(
      social.email,
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`
    );
    const joined = Object.values(social).join('\n');
    assert.match(decodeURIComponent(social.line), /Taipei, Taiwan/);
    assert.match(decodeURIComponent(social.whatsapp), /Taipei, Taiwan/);
    assert.doesNotMatch(joined, /25\.033|121\.56/);
    assert.equal(assertSafeSharePayload(`${text}\n${url}`), true);
  });
});
