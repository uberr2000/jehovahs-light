import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertSafeSharePayload,
  buildClipboardPayload,
  buildShareText,
  findNearbyPlace,
  formatPlaceLabel,
  pickPlaceFields,
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
      'One soul, one lamp, lighting the whole earth. Light a lamp with us.',
      'A lamp is shining in Taipei, Taiwan.'
    );
    const clipboard = buildClipboardPayload(text, url);
    assert.match(clipboard, /Taipei, Taiwan/);
    assert.match(clipboard, /https:\/\/jehovahs-light\.ink\.net\.tw\//);
    assert.equal(assertSafeSharePayload(clipboard), true);
    assert.equal(assertSafeSharePayload('text\nhttp://127.0.0.1:3000/'), true);
    assert.equal(assertSafeSharePayload('Meet at 25.0330, 121.5654'), false);
  });

  it('encodes text + url on LINE / Facebook / X deep links', () => {
    const text = 'Share the light';
    const url = 'https://jehovahs-light.ink.net.tw/';
    const social = socialShareUrls(text, url);
    assert.match(social.line, /lineit\/share/);
    assert.match(social.line, /url=https%3A%2F%2Fjehovahs-light/);
    assert.match(social.line, /text=Share/);
    assert.match(social.facebook, /sharer\.php/);
    assert.match(social.facebook, /u=https%3A%2F%2Fjehovahs-light/);
    assert.match(social.facebook, /quote=Share/);
    assert.match(social.x, /twitter\.com\/intent\/tweet/);
    assert.match(social.x, /text=Share/);
    assert.match(social.x, /url=https%3A%2F%2Fjehovahs-light/);
  });
});
