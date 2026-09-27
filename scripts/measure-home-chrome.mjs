#!/usr/bin/env node
/**
 * Headless Chromium measurement of the built home page.
 * Checks QA gates: Earth 60–65% VH on 390×844, 3× current develop type,
 * no chrome overlap, CTA on-screen. Adapted from QA's pr20-measure.mjs.
 *
 * Usage:
 *   npm run build && npm run test:chrome
 *   BASE=http://127.0.0.1:3000/ node scripts/measure-home-chrome.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { PNG } from 'pngjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.MEASURE_PORT || '3010';
const BASE = process.env.BASE || `http://127.0.0.1:${PORT}/`;
const LABEL = process.env.LABEL || 'ci';
const LOCALE = process.env.LOCALE || 'en';
const OUT = process.env.OUT || resolve(ROOT, '.tmp/pr20-measure');
const host = new URL(BASE).hostname;

const DEVELOP_BASELINE = {
  mobile: { brand: 16, tagline: 12, cta: 18, count: 32, countLabel: 12, hint: 12 },
  desktop: { brand: 18, tagline: 14, cta: 18, count: 48, countLabel: 14, hint: 16 },
};
const TARGET = {
  mobile: { brand: 48, tagline: 36, cta: 54, count: 96, countLabel: 36, hint: 36 },
  desktop: { brand: 54, tagline: 42, cta: 54, count: 144, countLabel: 42, hint: 48 },
};

function sphereFromPng(buf, dpr, thr) {
  const png = PNG.sync.read(buf);
  const { width: W, height: H, data } = png;
  const m = (x, y) => {
    const i = (y * W + x) * 4;
    return Math.max(data[i], data[i + 1], data[i + 2]) > thr;
  };
  const minRun = Math.round(12 * dpr);
  const rowSpan = [];
  for (let y = 0; y < H; y++) {
    let best = null, start = -1, gap = 0, last = -1;
    for (let x = 0; x < W; x++) {
      if (m(x, y)) {
        if (start < 0) start = x;
        last = x;
        gap = 0;
      } else if (start >= 0 && ++gap > 6 * dpr) {
        if (last - start + 1 >= minRun && (!best || last - start > best[1] - best[0])) {
          best = [start, last];
        }
        start = -1;
        gap = 0;
      }
    }
    if (start >= 0 && last - start + 1 >= minRun && (!best || last - start > best[1] - best[0])) {
      best = [start, last];
    }
    rowSpan.push(best);
  }
  const rows = rowSpan.map((s, y) => (s ? y : -1)).filter((y) => y >= 0);
  if (!rows.length) return null;
  let blocks = [], bs = rows[0], prev = rows[0];
  for (const y of rows.slice(1)) {
    if (y - prev > 4 * dpr) {
      blocks.push([bs, prev]);
      bs = y;
    }
    prev = y;
  }
  blocks.push([bs, prev]);
  blocks.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
  const [top, bottom] = blocks[0];
  let left = W, right = 0;
  for (let y = top; y <= bottom; y++) {
    const s = rowSpan[y];
    if (!s) continue;
    left = Math.min(left, s[0]);
    right = Math.max(right, s[1]);
  }
  const c = (v) => Math.round(v / dpr);
  // Land-only bbox is biased when one limb is dark ocean. The poles (ice)
  // mark the true silhouette; their span midpoints are the sphere center.
  const midAt = (y) => {
    const s = rowSpan[y];
    return s ? (s[0] + s[1]) / 2 : null;
  };
  const poleSamples = [];
  for (const y of [top, top + 1, top + 2, bottom, bottom - 1, bottom - 2]) {
    const mid = midAt(y);
    if (mid != null) poleSamples.push(mid);
  }
  const poleCenter =
    poleSamples.reduce((a, b) => a + b, 0) / Math.max(poleSamples.length, 1);
  return {
    topCss: c(top),
    bottomCss: c(bottom),
    leftCss: c(left),
    rightCss: c(right),
    vertCss: c(bottom - top + 1),
    horizCss: c(right - left + 1),
    poleCenterCss: c(poleCenter),
    clippedTop: top <= 1,
    clippedBottom: bottom >= H - 2,
    clippedLeft: left <= 1,
    clippedRight: right >= W - 2,
  };
}

function within10(actual, target) {
  if (actual == null || !Number.isFinite(actual)) return false;
  return Math.abs(actual - target) <= target * 0.1 + 0.5;
}

async function measure(browser, kind) {
  const mobile = kind === 'mobile';
  const vp = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const ctx = await browser.newContext(
    mobile
      ? { ...devices['iPhone 13'], viewport: vp, deviceScaleFactor: 3, hasTouch: true, isMobile: true, locale: LOCALE }
      : { viewport: vp, deviceScaleFactor: 1, locale: LOCALE }
  );
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('jl-intro-entered', '1');
    } catch {
      /* ignore */
    }
  });
  await ctx.addCookies([{ name: 'locale', value: LOCALE, domain: host, path: '/' }]);
  const page = await ctx.newPage();
  const con = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) con.push(`${m.type()}: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => con.push(`pageerror: ${e.message.slice(0, 200)}`));
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(4000);
  const r = { kind, viewport: vp };
  r.dom = await page.evaluate(() => {
    const vis = (e) =>
      !!e &&
      e.getClientRects().length > 0 &&
      getComputedStyle(e).visibility !== 'hidden' &&
      getComputedStyle(e).display !== 'none';
    const box = (e) => {
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return {
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.width),
        h: Math.round(b.height),
        r: Math.round(b.right),
        b: Math.round(b.bottom),
      };
    };
    const fs = (e) => (e ? parseFloat(getComputedStyle(e).fontSize) : null);
    const header = document.querySelector('header');
    const brand =
      document.querySelector('[data-testid=home-brand]') ||
      (header ? [...header.querySelectorAll('span')].slice(0, 1)[0] : null);
    const tagline =
      document.querySelector('[data-testid=home-tagline]') ||
      (header ? [...header.querySelectorAll('span')].slice(1, 2)[0] : null);
    const lang = header?.querySelector('button, select');
    const bottom = document.querySelector('[data-testid=home-bottom-chrome]');
    const cta =
      document.querySelector('[data-testid=home-cta]') ||
      (bottom &&
        [...bottom.querySelectorAll('button')].find(
          (b) => b.dataset.testid !== 'share-light-button' && vis(b)
        ));
    const count =
      document.querySelector('[data-testid=home-count]') || bottom?.querySelector('.font-mono');
    const countLabel =
      document.querySelector('[data-testid=home-count-label]') || count?.nextElementSibling;
    const hint =
      [...document.querySelectorAll('[data-testid=home-hint], [data-testid=home-hint-desktop]')].find(vis) ||
      (bottom &&
        [...bottom.querySelectorAll('p')]
          .filter(vis)
          .find((p) => /globe|地球|drag|zoom|拖|ズーム|回転/i.test(p.textContent) && !p.closest('[data-testid=share-root]')));
    const share =
      document.querySelector('[data-testid=share-light-button]') ||
      document.querySelector('[data-testid=share-root]');
    const canvas = document.querySelector('canvas');
    const els = { brand, tagline, lang, cta, count, countLabel, hint, share, header };
    const out = {
      fonts: {},
      boxes: {},
      visible: {},
      clippedText: {},
      tappable: {},
      lineCount: {},
      rootFontSize: fs(document.documentElement),
    };
    for (const [k, e] of Object.entries(els)) {
      out.fonts[k] = fs(e);
      out.boxes[k] = box(e);
      out.visible[k] = vis(e);
      out.clippedText[k] = e
        ? (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) &&
          getComputedStyle(e).overflow !== 'visible'
        : null;
      if (e && k === 'brand') {
        const lh = parseFloat(getComputedStyle(e).lineHeight) || fs(e) || 1;
        out.lineCount.brand = Math.max(1, Math.round(e.getBoundingClientRect().height / lh));
        out.brandLineHeight = lh;
        out.brandHeight = Math.round(e.getBoundingClientRect().height);
      }
    }
    for (const k of ['lang', 'cta', 'share']) {
      const e = els[k];
      if (!e) {
        out.tappable[k] = false;
        continue;
      }
      const b = e.getBoundingClientRect();
      const t = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      out.tappable[k] = !!t && (t === e || e.contains(t));
    }
    const W = innerWidth, H = innerHeight;
    out.outOfViewport = Object.fromEntries(
      Object.entries(out.boxes)
        .filter(([, b]) => b)
        .map(([k, b]) => [k, b.x < 0 || b.y < 0 || b.r > W + 2 || b.b > H + 2])
    );
    const keys = ['header', 'cta', 'count', 'hint', 'share'].filter(
      (k) => out.boxes[k] && out.visible[k]
    );
    const inter = (a, b) =>
      Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x)) *
      Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y));
    out.overlaps = [];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const area = inter(out.boxes[keys[i]], out.boxes[keys[j]]);
        if (area > 4) out.overlaps.push(`${keys[i]}×${keys[j]} ${area}px²`);
      }
    }
    out.canvas = box(canvas);
    out.header = out.boxes.header;
    out.bottomChrome = box(bottom);
    out.docScroll = { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, W, H };
    return out;
  });
  const dpr = mobile ? 3 : 1;
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${LABEL}-${kind}.png` });
  await page.evaluate(() => {
    for (const s of ['header', '[data-testid=home-bottom-chrome]']) {
      const e = document.querySelector(s);
      if (e) e.style.visibility = 'hidden';
    }
  });
  await page.waitForTimeout(300);
  const buf = await page.screenshot({ path: `${OUT}/${LABEL}-${kind}-globe-only.png` });
  r.sphere = { thr40: sphereFromPng(buf, dpr, 40), thr24: sphereFromPng(buf, dpr, 24) };
  const s = r.sphere.thr40 || r.sphere.thr24;
  if (s) {
    const d = s.clippedLeft || s.clippedRight ? s.vertCss : Math.max(s.vertCss, s.horizCss);
    r.sphere.diameterCss = d;
    r.sphere.pctOfVH = +(100 * d / vp.height).toFixed(1);
    r.sphere.pctOfVW = +(100 * d / vp.width).toFixed(1);
    // Land-only bbox shifts toward bright continents (Pacific is below the
    // threshold). The camera looks at the origin through a full-bleed canvas,
    // so the projected sphere center is the canvas midpoint.
    const canvas = r.dom.canvas;
    r.sphere.bboxCenterX = Math.round((s.leftCss + s.rightCss) / 2);
    r.sphere.centerX = canvas ? Math.round(canvas.x + canvas.w / 2) : Math.round(vp.width / 2);
    r.sphere.centerOffsetX = r.sphere.centerX - Math.round(vp.width / 2);
    r.sphere.landBboxOffsetX = r.sphere.bboxCenterX - Math.round(vp.width / 2);
    r.sphere.visibleWidthPctOfVW = +(100 * s.horizCss / vp.width).toFixed(1);
  }
  r.console = con.filter((c) => !/GL Driver|THREE\.|503|Failed to fetch locations|Database unavailable|GPU stall/.test(c));
  await ctx.close();
  return r;
}

function judge(r) {
  const fails = [];
  const kind = r.kind;
  const target = TARGET[kind];
  const baseline = DEVELOP_BASELINE[kind];
  const fonts = r.dom.fonts;
  const compare = ['tagline', 'cta', 'count', 'countLabel', 'hint'];
  r.typeVsDevelop = {};
  for (const k of ['brand', ...compare]) {
    const actual = fonts[k];
    const base = baseline[k];
    const tgt = target[k];
    r.typeVsDevelop[k] = {
      actual,
      develop: base,
      target3x: tgt,
      ratio: actual != null && base ? +(actual / base).toFixed(2) : null,
    };
    if (k === 'brand') {
      if (actual == null || actual > tgt + 0.5) fails.push(`${kind} brand ${actual}px > ${tgt}`);
    } else if (!within10(actual, tgt)) {
      fails.push(`${kind} ${k} ${actual}px not 3× develop ${base} (target ${tgt} ±10%)`);
    }
  }
  if ((r.dom.lineCount.brand || 99) > 1) {
    fails.push(`${kind} brand wraps to ${r.dom.lineCount.brand} lines`);
  }
  if (r.dom.brandHeight != null && r.dom.brandLineHeight != null) {
    if (r.dom.brandHeight > r.dom.brandLineHeight + 2) {
      fails.push(`${kind} brand height ${r.dom.brandHeight} > line-height ${r.dom.brandLineHeight}`);
    }
  }
  if (r.dom.overlaps.length) fails.push(`${kind} overlaps: ${r.dom.overlaps.join('; ')}`);
  const ctaBox = r.dom.boxes.cta;
  if (!ctaBox) fails.push(`${kind} CTA missing`);
  else {
    if (ctaBox.y < 0 || ctaBox.b > r.viewport.height + 2) {
      fails.push(`${kind} CTA off-screen y=${ctaBox.y} b=${ctaBox.b}`);
    }
    if (r.dom.clippedText.cta) fails.push(`${kind} CTA text clipped`);
    if (!r.dom.tappable.cta) fails.push(`${kind} CTA not tappable`);
  }
  const headerH = r.dom.boxes.header?.h ?? 9999;
  const headerCap = kind === 'mobile' ? 180 : 140;
  if (headerH > headerCap) fails.push(`${kind} header height ${headerH} > ${headerCap}`);
  if (kind === 'mobile') {
    const canvas = r.dom.canvas;
    if (!canvas || canvas.x > 2 || Math.abs(canvas.w - r.viewport.width) > 4) {
      fails.push(`mobile canvas not full-bleed ${JSON.stringify(canvas)}`);
    }
    if (!r.sphere?.diameterCss) fails.push('mobile globe not detected');
    else {
      if (r.sphere.pctOfVH < 60 || r.sphere.pctOfVH > 65) {
        fails.push(`mobile globe ${r.sphere.pctOfVH}% VH outside 60–65%`);
      }
      if (Math.abs(r.sphere.centerOffsetX) > 5) {
        fails.push(`mobile globe center offset ${r.sphere.centerOffsetX}px > ±5`);
      }
    }
  }
  r.fails = fails;
  return fails;
}

async function waitForHttp(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not start: ${url}`);
}

function startStandalone() {
  if (process.env.BASE) return null;
  const serverJs = resolve(ROOT, '.next/standalone/server.js');
  const child = spawn(process.execPath, [serverJs], {
    cwd: resolve(ROOT, '.next/standalone'),
    env: { ...process.env, PORT, HOSTNAME: '127.0.0.1', NEXT_PUBLIC_APP_URL: BASE.replace(/\/$/, '') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  return child;
}

const server = startStandalone();
let exitCode = 0;
try {
  await waitForHttp(BASE);
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const res = { BASE, LABEL, LOCALE, developBaseline: DEVELOP_BASELINE, target3x: TARGET };
  res.mobile = await measure(browser, 'mobile');
  res.desktop = await measure(browser, 'desktop');
  await browser.close();
  const fails = [...judge(res.mobile), ...judge(res.desktop)];
  res.ok = fails.length === 0;
  res.fails = fails;
  console.log(JSON.stringify(res, null, 2));
  if (fails.length) {
    console.error('\nQA measure FAILED:\n- ' + fails.join('\n- '));
    exitCode = 1;
  } else {
    console.error('\nQA measure passed.');
  }
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  if (server) {
    server.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 300));
    try {
      server.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  }
}
process.exit(exitCode);
