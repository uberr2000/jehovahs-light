#!/usr/bin/env node
/**
 * Post-deploy public URL check. The live host must serve THIS Next.js app,
 * not an unrelated site (the domain has been mis-routed before).
 *
 *   node scripts/check-public-url.mjs
 *   PUBLIC_CHECK_URL=https://jehovahs-light.ink.net.tw/ node scripts/check-public-url.mjs
 *
 * Fail closed with a clear message. Do not treat “HTTP 200 from some other
 * HTML page” as success.
 */

export const DEFAULT_PUBLIC_URL = 'https://jehovahs-light.ink.net.tw/';
export const EXPECTED_TITLE_BRAND = '點亮地球';
export const MANIFEST_PATH = '/app-manifest';

export function normalizePublicUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return DEFAULT_PUBLIC_URL;
  try {
    const url = new URL(trimmed);
    url.hash = '';
    url.search = '';
    url.pathname = '/';
    return url.toString();
  } catch {
    return DEFAULT_PUBLIC_URL;
  }
}

export function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  return match[1].replace(/\s+/g, ' ').trim();
}

export function extractOgImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function hostMisrouteHint(publicUrl) {
  return (
    `The public host is likely serving a different site (mis-routed), not 點亮地球. ` +
    `Fix DNS / Nginx / Cloudflare so ${publicUrl} points at this Next.js app, then re-run.`
  );
}

export function evaluateHomePage(status, html, publicUrl) {
  const errors = [];
  if (status !== 200) {
    errors.push(
      `GET / returned HTTP ${status} (expected 200). ${hostMisrouteHint(publicUrl)}`
    );
    return errors;
  }
  const title = extractTitle(html);
  if (!title) {
    errors.push(`GET / returned 200 but had no <title>. ${hostMisrouteHint(publicUrl)}`);
    return errors;
  }
  if (!title.includes(EXPECTED_TITLE_BRAND)) {
    errors.push(
      `GET / returned 200 but <title> was "${title}" — expected it to contain "${EXPECTED_TITLE_BRAND}". ${hostMisrouteHint(publicUrl)}`
    );
  }
  return errors;
}

export function evaluateManifest(status, contentType, publicUrl = DEFAULT_PUBLIC_URL) {
  if (status !== 200) {
    return [
      `GET ${MANIFEST_PATH} returned HTTP ${status} (expected 200). ${hostMisrouteHint(publicUrl)}`,
    ];
  }
  const type = (contentType || '').toLowerCase();
  if (type && !/json|manifest/.test(type)) {
    return [
      `GET ${MANIFEST_PATH} returned 200 but Content-Type "${contentType}" is not a manifest. ${hostMisrouteHint(publicUrl)}`,
    ];
  }
  return [];
}

export function evaluateOgImage(status, contentType, imageUrl, publicUrl = DEFAULT_PUBLIC_URL) {
  if (!imageUrl) {
    return [`GET / HTML had no og:image URL. ${hostMisrouteHint(publicUrl)}`];
  }
  if (status !== 200) {
    return [
      `GET og:image ${imageUrl} returned HTTP ${status} (expected 200). ${hostMisrouteHint(publicUrl)}`,
    ];
  }
  const type = (contentType || '').toLowerCase();
  if (!type.startsWith('image/')) {
    return [
      `GET og:image ${imageUrl} returned 200 but Content-Type "${contentType || '(missing)'}" is not an image. ${hostMisrouteHint(publicUrl)}`,
    ];
  }
  return [];
}

export async function checkPublicUrl(
  rawUrl = process.env.PUBLIC_CHECK_URL || DEFAULT_PUBLIC_URL,
  fetchFn = fetch
) {
  const publicUrl = normalizePublicUrl(rawUrl);
  const errors = [];

  let homeStatus = 0;
  let html = '';
  try {
    const home = await fetchFn(publicUrl, { redirect: 'follow' });
    homeStatus = home.status;
    html = await home.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Public URL check failed: could not GET ${publicUrl} (${reason}). ${hostMisrouteHint(publicUrl)}`
    );
  }
  errors.push(...evaluateHomePage(homeStatus, html, publicUrl));

  const manifestUrl = new URL(MANIFEST_PATH, publicUrl).toString();
  try {
    const manifest = await fetchFn(manifestUrl, { redirect: 'follow' });
    errors.push(
      ...evaluateManifest(manifest.status, manifest.headers.get('content-type'), publicUrl)
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    errors.push(`GET ${MANIFEST_PATH} failed (${reason}). ${hostMisrouteHint(publicUrl)}`);
  }

  const ogImage = extractOgImage(html);
  if (!ogImage) {
    errors.push(...evaluateOgImage(0, null, null, publicUrl));
  } else {
    const imageHref = new URL(ogImage, publicUrl).toString();
    try {
      const image = await fetchFn(imageHref, { redirect: 'follow' });
      errors.push(
        ...evaluateOgImage(image.status, image.headers.get('content-type'), imageHref, publicUrl)
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      errors.push(`GET og:image ${imageHref} failed (${reason}). ${hostMisrouteHint(publicUrl)}`);
    }
  }

  if (errors.length) {
    throw new Error(
      `Public URL check failed for ${publicUrl}. This job is supposed to stay red until the live host serves 點亮地球.\n- ${errors.join('\n- ')}`
    );
  }
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('check-public-url.mjs');

if (invokedDirectly) {
  checkPublicUrl().then(
    () => {
      console.log(
        `Public URL check passed: ${normalizePublicUrl(process.env.PUBLIC_CHECK_URL || DEFAULT_PUBLIC_URL)} is 點亮地球 (title, /app-manifest, og:image).`
      );
    },
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  );
}
