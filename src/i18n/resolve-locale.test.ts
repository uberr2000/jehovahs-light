import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_LOCALE } from './config.ts';
import { resolveRequestLocale } from './resolve-locale.ts';

describe('resolveRequestLocale', () => {
  it('(a) none -> zh-TW', () => {
    assert.equal(DEFAULT_LOCALE, 'zh-TW');
    assert.deepEqual(resolveRequestLocale(null, null), {
      locale: 'zh-TW',
      source: 'default',
    });
    assert.deepEqual(resolveRequestLocale(undefined, ''), {
      locale: 'zh-TW',
      source: 'default',
    });
  });

  it('(b) Accept-Language en -> en', () => {
    assert.deepEqual(resolveRequestLocale(null, 'en'), {
      locale: 'en',
      source: 'accept-language',
    });
    assert.deepEqual(resolveRequestLocale(null, 'en-US,en;q=0.9'), {
      locale: 'en',
      source: 'accept-language',
    });
  });

  it('(c) locale cookie wins over Accept-Language', () => {
    assert.deepEqual(resolveRequestLocale('ja', 'en'), {
      locale: 'ja',
      source: 'cookie',
    });
    assert.deepEqual(resolveRequestLocale('en', 'zh-TW,zh;q=0.8'), {
      locale: 'en',
      source: 'cookie',
    });
  });

  it('(d) unsupported language -> zh-TW', () => {
    assert.deepEqual(resolveRequestLocale(null, 'xx'), {
      locale: 'zh-TW',
      source: 'accept-language',
    });
    assert.deepEqual(resolveRequestLocale(null, 'zh-HK,zh;q=0.8'), {
      locale: 'zh-TW',
      source: 'accept-language',
    });
  });
});
