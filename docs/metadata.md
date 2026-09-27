# Metadata, Open Graph, and the public URL

Site brand: **點亮地球**. Terry’s OG artwork (glowing light point) and
wording stay as-is. This page records how absolute share URLs are built
and how develop deploy proves the public hostname is this app.

## Absolute URLs

`og:url`, `metadataBase`, and the file-convention `og:image` /
`twitter:image` URLs all come from `NEXT_PUBLIC_APP_URL` via the same
helper as Share v1 (`configuredShareUrl` in `src/lib/share.ts`, wrapped
by `metadataBaseUrl` / `metadataCanonicalUrl` in
`src/lib/site-metadata.ts`).

Rules (same as PR #22):

- A real `https://` host is used (query/hash stripped).
- Empty, non-https, and placeholder hosts (`your-domain.com`,
  `example.invalid`, `example.com`) are **unset**.
- `localhost` / `127.0.0.1` stay allowed for local dev.
- There is **no** fallback to the request `Host` /
  `x-forwarded-host` header. When the env is unset, `metadataBase` and
  `og:url` are omitted so the build does not invent a host.

With `NEXT_PUBLIC_APP_URL=https://jehovahs-light.ink.net.tw` a production
build emits absolute `og:image` and `og:url` on that origin.

## Tags that stay on every page

`src/app/layout.tsx` `generateMetadata` (Terry’s title/description):

- `og:title` / `og:description` / `og:site_name` — 點亮地球 wording
- `og:type` — `website`
- `og:locale` — the **active** language (`zh_TW`, `en_US`, …), not a
  hard-coded `en_US`. Other supported locales are `og:locale:alternate`.
- `twitter:card` — `summary_large_image`
- File conventions `src/app/opengraph-image.png` and
  `twitter-image.png` (real PNG, 1024×537) plus matching `.alt.txt`
- `rel=manifest` → `/app-manifest?locale=`

Default language when there is no `locale` cookie and no
`Accept-Language` is **zh-TW**. See [i18n-viewport.md](i18n-viewport.md).

## PWA

`GET /app-manifest` (`src/app/app-manifest/route.ts`):

- `name` follows the localized `home.brand`
- `short_name` is **點亮地球** (≤ 12 characters) for every locale
- Icons: 192 / 512 `any`, plus `icon-512-maskable.png` (`maskable`)
- Icon PNGs have C2PA (`caBX`) chunks stripped

## Post-deploy public URL check

After the develop SSH deploy succeeds, `.github/workflows/ci.yml` job
`deploy-develop` curls the public origin
(`https://jehovahs-light.ink.net.tw/`, same host as
`NEXT_PUBLIC_APP_URL` / `deploy/check-app-url.sh`) and **fails** unless:

1. `GET /` is HTTP 200 **and** the HTML `<title>` contains `點亮地球`
   (a 200 from an unrelated Laravel page is a failure)
2. `GET /app-manifest` is HTTP 200
3. The `og:image` URL found in that HTML is HTTP 200 with an
   `image/*` Content-Type

Checker: `scripts/check-public-url.mjs` (`npm run test:public-url`).
Unit fixtures live in `scripts/check-public-url.test.ts`.

This is expected to stay red on live until DNS / Nginx / Cloudflare
point the hostname at this Next.js app. The failure message says so.
The existing host `.env` guard (`deploy/check-app-url.sh`) and
`needs: lint-and-build` are unchanged. `deploy/` server config is not
edited by this check.
