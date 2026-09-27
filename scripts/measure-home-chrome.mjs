#!/usr/bin/env node
/**
 * Headless Chromium QA gates for the built home page.
 * Passes the intro splash by clicking Enter, then measures Earth + chrome
 * at en and zh-TW for 390×844 and 1440×900. Adapted from QA pr20-measure.mjs.
 *
 *   npm run build && npm run test:chrome
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
const LOCALES = (process.env.LOCALES || 'en,zh-TW').split(',');
const OUT = process.env.OUT || resolve(ROOT, '.tmp/pr20-measure');
const host = new URL(BASE).hostname;

const DEVELOP_BASELINE = {
  mobile: { brand: 16, tagline: 12, cta: 18, count: 32, countLabel: 12, hint: 12 },
  desktop: { brand: 18, tagline: 14, cta: 18, count: 48, countLabel: 14, hint: 16 },
};
const TARGET = {
  mobile: { brand: 48, tagline: 36, cta: 54, count: 96, countLabel: 36, hint: 36 },
  desktop: { brand: 48, tagline: 42, cta: 54, count: 144, countLabel: 42, hint: 48 },
};

function analyse(buf, dpr) {
  const png = PNG.sync.read(buf);
  const { width: W, height: H, data } = png;
  const sum = (x, y) => {
    const i = (y * W + x) * 4;
    return data[i] + data[i + 1] + data[i + 2];
  };
  const spans = (thr, minRunCss) => {
    const minRun = Math.round(minRunCss * dpr);
    const out = [];
    for (let y = 0; y < H; y++) {
      let best = null, start = -1, last = -1, gap = 0;
      const close = () => {
        if (start >= 0 && last - start + 1 >= minRun && (!best || last - start > best[1] - best[0])) {
          best = [start, last];
        }
      };
      for (let x = 0; x < W; x++) {
        if (sum(x, y) > thr) {
          if (start < 0) start = x;
          last = x;
          gap = 0;
        } else if (start >= 0 && ++gap > 6 * dpr) {
          close();
          start = -1;
          gap = 0;
        }
      }
      close();
      out.push(best);
    }
    return out;
  };
  const block = (sp) => {
    const rows = sp.map((s, y) => (s ? y : -1)).filter((y) => y >= 0);
    if (!rows.length) return null;
    const blocks = [];
    let bs = rows[0], prev = rows[0];
    for (const y of rows.slice(1)) {
      if (y - prev > 4 * dpr) {
        blocks.push([bs, prev]);
        bs = y;
      }
      prev = y;
    }
    blocks.push([bs, prev]);
    blocks.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
    return blocks[0];
  };
  const c = (v) => +(v / dpr).toFixed(1);
  const land = spans(120, 12);
  const lb = block(land);
  const atm = spans(32, 40);
  const ab = block(atm);
  const res = { W: c(W), H: c(H) };
  if (lb) {
    const [t, b] = lb;
    const mids = [];
    for (const y of [t, t + 1, t + 2, t + 3, b, b - 1, b - 2, b - 3]) {
      const s = land[y];
      if (s) mids.push((s[0] + s[1]) / 2);
    }
    let left = Infinity;
    let right = -Infinity;
    for (let y = t; y <= b; y++) {
      const s = land[y];
      if (!s) continue;
      if (s[0] < left) left = s[0];
      if (s[1] > right) right = s[1];
    }
    res.earth = {
      top: c(t),
      bottom: c(b),
      left: Number.isFinite(left) ? c(left) : null,
      right: Number.isFinite(right) ? c(right) : null,
      diameter: c(b - t + 1),
      poleCenterX: c(mids.reduce((a, v) => a + v, 0) / mids.length),
    };
  }
  if (ab) {
    const [t, b] = ab;
    const mids = [];
    for (let y = t; y <= b; y++) {
      const s = atm[y];
      if (s && s[0] > 1 && s[1] < W - 2) mids.push((s[0] + s[1]) / 2);
    }
    mids.sort((a, b2) => a - b2);
    let left = Infinity;
    let right = -Infinity;
    for (let y = t; y <= b; y++) {
      const s = atm[y];
      if (!s) continue;
      if (s[0] < left) left = s[0];
      if (s[1] > right) right = s[1];
    }
    res.atmosphere = {
      top: c(t),
      bottom: c(b),
      left: Number.isFinite(left) ? c(left) : null,
      right: Number.isFinite(right) ? c(right) : null,
      diameter: c(b - t + 1),
      rowsBothEdgesVisible: mids.length,
      medianCenterX: mids.length ? c(mids[mids.length >> 1]) : null,
      clippedLeft: atm.slice(t, b + 1).some((s) => s && s[0] <= 1),
      clippedRight: atm.slice(t, b + 1).some((s) => s && s[1] >= W - 2),
    };
  }
  return res;
}

async function passSplash(page) {
  const intro = await page.$('[data-testid=intro-screen]');
  if (!intro) return { shown: false };
  const t0 = Date.now();
  await page.click('[data-testid=intro-enter]');
  await page.waitForSelector('[data-testid=intro-screen]', { state: 'detached', timeout: 15000 });
  return { shown: true, dismissMsAfterEnter: Date.now() - t0 };
}

function within10(actual, target) {
  if (actual == null || !Number.isFinite(actual)) return false;
  return Math.abs(actual - target) <= target * 0.1 + 0.5;
}

async function measure(browser, kind, locale) {
  const mobile = kind === 'mobile';
  const vp = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const dpr = mobile ? 3 : 1;
  const ctx = await browser.newContext(
    mobile
      ? { ...devices['iPhone 13'], viewport: vp, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, locale }
      : { viewport: vp, deviceScaleFactor: dpr, locale }
  );
  await ctx.addCookies([{ name: 'locale', value: locale, domain: host, path: '/' }]);
  const page = await ctx.newPage();
  const con = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) con.push(`${m.type()}: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => con.push(`pageerror: ${e.message.slice(0, 200)}`));
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);
  const r = { kind, locale, viewport: vp, splash: await passSplash(page) };
  await page.waitForSelector('canvas', { timeout: 30000 });
  await page.waitForTimeout(4000);
  r.dom = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
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
    const isClipValue = (v) =>
      v === 'hidden' || v === 'clip' || v === 'auto' || v === 'scroll';
    const clipAxes = (cs) => ({
      x: isClipValue(cs.overflowX) || isClipValue(cs.overflow),
      y: isClipValue(cs.overflowY) || isClipValue(cs.overflow),
    });
    const cls = (a) =>
      `${a.tagName.toLowerCase()}.${String(a.className || '')
        .split(' ')
        .find(Boolean) || ''}`;
    const overflowOf = (node) => ({
      dW: +(node.scrollWidth - node.clientWidth).toFixed(2),
      dH: +(node.scrollHeight - node.clientHeight).toFixed(2),
    });
    const overflow = (e) => {
      if (!e) return [];
      const items = [{ target: 'self', ...overflowOf(e) }];
      for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        const axes = clipAxes(cs);
        if (!axes.x && !axes.y) continue;
        items.push({ target: cls(a), ...overflowOf(a) });
      }
      return items;
    };
    const maxOverflowPx = (items) =>
      items.reduce((m, it) => Math.max(m, it.dW, it.dH), 0);
    const clipped = (items) => {
      const hits = (items || [])
        .filter((it) => it.dW > 1 || it.dH > 1)
        .map((it) => `${it.target} dW=${it.dW} dH=${it.dH}`);
      return hits.length ? hits.join('; ') : false;
    };
    const header = q('header');
    const bottom = q('[data-testid=home-bottom-chrome]');
    const hs = header ? [...header.querySelectorAll('span')] : [];
    const brand = q('[data-testid=home-brand]') || hs[0];
    const tagline = q('[data-testid=home-tagline]') || hs[1];
    const lang = header?.querySelector('button, select');
    const cta =
      q('[data-testid=home-cta]') ||
      (bottom &&
        [...bottom.querySelectorAll('button')].find(
          (b) => b.dataset.testid !== 'share-light-button' && vis(b)
        ));
    const count = q('[data-testid=home-count]') || bottom?.querySelector('.font-mono');
    const countLabel = q('[data-testid=home-count-label]') || count?.nextElementSibling;
    const hint =
      [...document.querySelectorAll('[data-testid=home-hint],[data-testid=home-hint-desktop]')].find(vis) ||
      (bottom &&
        [...bottom.querySelectorAll('p')]
          .filter(vis)
          .find(
            (p) =>
              /globe|地球|drag|zoom|拖|ズーム/i.test(p.textContent) &&
              !p.closest('[data-testid=share-root]')
          ));
    const shareRow = q('[data-testid=share-root]');
    const els = { brand, tagline, lang, cta, count, countLabel, hint, share: shareRow, header };
    const lines = (e) => {
      if (!e) return null;
      const rg = document.createRange();
      rg.selectNodeContents(e);
      const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
      return tops.size;
    };
    const out = {
      fonts: {},
      boxes: {},
      visible: {},
      overflow: {},
      maxOverflowPx: {},
      clipped: {},
      tappable: {},
      lines: {},
      text: {},
    };
    for (const [k, e] of Object.entries(els)) {
      const ov = overflow(e);
      out.fonts[k] = fs(e);
      out.boxes[k] = box(e);
      out.visible[k] = vis(e);
      out.overflow[k] = ov;
      out.maxOverflowPx[k] = +maxOverflowPx(ov).toFixed(2);
      out.clipped[k] = clipped(ov);
      out.lines[k] = lines(e);
      out.text[k] = e?.textContent?.trim().slice(0, 80);
    }
    out.boxes.panel = box(bottom);
    out.boxes.globePane = box(q('[data-testid=home-globe]'));
    for (const k of ['lang', 'cta', 'share']) {
      const e = k === 'share' ? q('[data-testid=share-light-button]') : els[k];
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
    const inter = (a, b) =>
      Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x)) *
      Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y));
    const keys = ['header', 'cta', 'count', 'hint', 'share'].filter((k) => out.boxes[k] && out.visible[k]);
    out.overlaps = [];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = inter(out.boxes[keys[i]], out.boxes[keys[j]]);
        if (a > 4) out.overlaps.push(`${keys[i]}×${keys[j]} ${a}px²`);
      }
    }
    out.canvas = box(q('canvas'));
    return out;
  });
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${LABEL}-${kind}-${locale}.png` });
  await page.evaluate(() => {
    for (const s of ['header', '[data-testid=home-bottom-chrome]']) {
      const e = document.querySelector(s);
      if (e) e.style.visibility = 'hidden';
    }
  });
  await page.waitForTimeout(300);
  const buf = await page.screenshot({ path: `${OUT}/${LABEL}-${kind}-${locale}-globe-only.png` });
  const a = analyse(buf, dpr);
  r.sphere = a;
  if (a.earth) {
    r.sphere.pctOfVH = +(100 * a.earth.diameter / vp.height).toFixed(1);
    r.sphere.pctOfVW = +(100 * a.earth.diameter / vp.width).toFixed(1);
    r.sphere.centerOffsetX_poles = +(a.earth.poleCenterX - vp.width / 2).toFixed(1);
  }
  if (a.atmosphere?.medianCenterX != null) {
    r.sphere.centerOffsetX_atmosphere = +(a.atmosphere.medianCenterX - vp.width / 2).toFixed(1);
  }
  if (a.atmosphere && a.atmosphere.top != null && a.atmosphere.bottom != null) {
    const atmosphereCenterY = (a.atmosphere.top + a.atmosphere.bottom) / 2;
    r.sphere.centerY_atmosphere = +atmosphereCenterY.toFixed(1);
    r.sphere.centerOffsetY_atmosphere = +(atmosphereCenterY - vp.height / 2).toFixed(1);
  }
  const pane = r.dom.boxes.globePane || r.dom.boxes.canvas;
  if (pane && a.atmosphere?.medianCenterX != null) {
    const paneCenterX = pane.x + pane.w / 2;
    r.sphere.pane = { x: pane.x, y: pane.y, w: pane.w, h: pane.h, centerX: +paneCenterX.toFixed(1) };
    r.sphere.centerOffsetX_pane = +(a.atmosphere.medianCenterX - paneCenterX).toFixed(1);
  }
  if (pane && a.atmosphere && a.atmosphere.top != null && a.atmosphere.bottom != null) {
    const paneCenterY = pane.y + pane.h / 2;
    const atmosphereCenterY = (a.atmosphere.top + a.atmosphere.bottom) / 2;
    if (r.sphere.pane) r.sphere.pane.centerY = +paneCenterY.toFixed(1);
    r.sphere.centerOffsetY_pane = +(atmosphereCenterY - paneCenterY).toFixed(1);
  }
  const globeBox = (() => {
    const src = a.atmosphere || a.earth;
    if (!src || src.left == null || src.right == null) return null;
    return { x: src.left, y: src.top, r: src.right, b: src.bottom, w: +(src.right - src.left).toFixed(1), h: +(src.bottom - src.top).toFixed(1) };
  })();
  r.sphere.globeBox = globeBox;
  const panel = r.dom.boxes.panel;
  if (globeBox && panel) {
    const overlapW = Math.max(0, Math.min(globeBox.r, panel.r) - Math.max(globeBox.x, panel.x));
    const overlapH = Math.max(0, Math.min(globeBox.b, panel.b) - Math.max(globeBox.y, panel.y));
    r.sphere.panelOverlapPx2 = +(overlapW * overlapH).toFixed(1);
  } else {
    r.sphere.panelOverlapPx2 = null;
  }
  r.console = con.filter((c) => !/GL Driver|THREE\.|503|Failed to fetch locations|Database unavailable|GPU stall/.test(c));
  await ctx.close();
  return r;
}

function judge(r) {
  const fails = [];
  const label = `${r.kind}/${r.locale}`;
  const target = TARGET[r.kind];
  const baseline = DEVELOP_BASELINE[r.kind];
  const fonts = r.dom.fonts;
  r.typeVsDevelop = {};
  for (const k of ['brand', 'tagline', 'cta', 'count', 'countLabel', 'hint']) {
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
      if (actual == null || actual > tgt + 0.5) fails.push(`${label} brand ${actual}px > ${tgt}`);
    } else if (k === 'tagline' || k === 'hint') {
      if (!within10(actual, tgt)) {
        fails.push(`${label} ${k} ${actual}px is not 3× develop (${tgt} ±10%); tagline/hint must not shrink`);
      }
    } else if (!within10(actual, tgt)) {
      fails.push(`${label} ${k} ${actual}px is not 3× develop (${tgt} ±10%)`);
    }
  }
  if ((r.dom.lines.brand || 99) > 1) fails.push(`${label} brand wraps to ${r.dom.lines.brand} lines`);
  const textKeys = ['brand', 'tagline', 'cta', 'count', 'countLabel', 'hint'];
  for (const k of textKeys) {
    const clip = r.dom.clipped[k];
    if (clip) fails.push(`${label} ${k} overflow > 1px: ${clip}`);
  }
  if (r.dom.overlaps.length) fails.push(`${label} overlaps: ${r.dom.overlaps.join('; ')}`);
  const ctaBox = r.dom.boxes.cta;
  if (!ctaBox) fails.push(`${label} CTA missing`);
  else {
    if (ctaBox.y < 0 || ctaBox.b > r.viewport.height + 2) {
      fails.push(`${label} CTA off-screen y=${ctaBox.y} b=${ctaBox.b}`);
    }
    if (!r.dom.tappable.cta) fails.push(`${label} CTA not tappable`);
  }
  if (!r.sphere?.earth) fails.push(`${label} globe not detected`);
  else if (r.kind === 'mobile') {
    if (r.sphere.pctOfVH < 60 || r.sphere.pctOfVH > 65) {
      fails.push(`${label} globe ${r.sphere.pctOfVH}% VH outside 60–65%`);
    }
    const off = r.sphere.centerOffsetX_atmosphere;
    if (off == null || Math.abs(off) > 5) {
      fails.push(`${label} globe atmosphere center offset ${off}px > ±5`);
    }
    const offY = r.sphere.centerOffsetY_atmosphere;
    if (offY == null || Math.abs(offY) > 5) {
      fails.push(`${label} globe atmosphere vertical center offset ${offY}px > ±5`);
    }
  } else {
    const paneOff = r.sphere.centerOffsetX_pane;
    if (paneOff == null || Math.abs(paneOff) > 5) {
      fails.push(`${label} globe pane center offset ${paneOff}px > ±5`);
    }
    const paneOffY = r.sphere.centerOffsetY_pane;
    if (paneOffY == null || Math.abs(paneOffY) > 5) {
      fails.push(`${label} globe pane vertical center offset ${paneOffY}px > ±5`);
    }
    if ((r.sphere.panelOverlapPx2 || 0) > 4) {
      fails.push(`${label} globe overlaps side panel ${r.sphere.panelOverlapPx2}px²`);
    }
  }
  if (!r.splash?.shown) {
    fails.push(`${label} splash was not shown — must click Enter (no sessionStorage bypass)`);
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
      /* not up */
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
  return child;
}

const server = startStandalone();
let exitCode = 0;
try {
  await waitForHttp(BASE);
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const res = { BASE, LABEL, locales: LOCALES, developBaseline: DEVELOP_BASELINE, target3x: TARGET, runs: [] };
  for (const loc of LOCALES) {
    res.runs.push(await measure(browser, 'mobile', loc));
    res.runs.push(await measure(browser, 'desktop', loc));
  }
  await browser.close();
  const fails = res.runs.flatMap((run) => judge(run));
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
      /* gone */
    }
  }
}
process.exit(exitCode);
