# project_state

_Last updated: 2026-09-23 (chrome ÷3; header brand/tagline ×0.5)

## Project name & stack summary

Jehovah's Light — Next.js 16 (App Router) + React 19 + Three.js globe,
MySQL via Drizzle ORM + `mysql2` (no Prisma), next-intl. Deployed with
PM2 + Nginx. Production path `/var/www/html/jehovahs-light.ink.net.tw/`.

## Features Done

- 3D globe, GPS consent, i18n (14 locales), locations API
- Home UI ported from v0 “Light of the Nations / 萬國之光”: full-viewport
  dark layout (`#04060e`), glass welcome panel (light / lit states),
  instanced amber beacons + own beacon, animated lamp counter, pill
  language switcher chrome. Still `GET/POST /api/locations` + `/api/consent`
  (no `/api/lamps`, no zip Postgres). v0 `zh-Hant` copy is `zh-TW`.
- `package.json` `start` kept as `next start` (Next reads `PORT`; no `--port`)
- `.env.example` documents `PORT` (must be set on the server `.env`)
- `deploy/with-env.sh` sources `.env` then execs the start command
- `deploy/ecosystem.config.cjs` loads `.env`; app name `jehovahs-light`
  (not numeric id 14); standalone `node .next/standalone/server.js`
- `docs/deploy.md` — path, PM2 name `jehovahs-light`, PORT from `.env`,
  never edit `package.json` start; `pm2 reload 14` is not enough;
  one-time migration if old name `jehovahs-light.ink.net.tw`
- `.github/workflows/ci.yml` — `pull_request` + `push` to `develop`;
  Node 22, `npm ci`, `npm run lint`, `npm run build` (dummy `DB_*` /
  `NEXT_PUBLIC_APP_URL` / `PORT` in the job env); verifies
  `.next/standalone/public/globe/earth-blue-marble.jpg` after postbuild;
  then `npm run db:check` and `npm run db:migrate` twice against ephemeral
  MySQL 8 (`DB_HOST=127.0.0.1`)
- `.github/workflows/deploy-develop.yml` — SSH deploy on `push` to
  `develop`; secrets `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`;
  dirty-tree fail (no `git reset --hard`); `git pull --ff-only`;
  standalone `public` + `.next/static` copy (belt-and-suspenders after
  `postbuild`); `npm run db:migrate` after pull/build (sources host `.env`
  for `DB_*`) before `pm2 startOrReload`
  `deploy/ecosystem.config.cjs --update-env` (delete-by-name fallback);
  verify script is standalone/`with-env.sh` (fail if still `next start`);
  no `script_stop` on `appleboy/ssh-action` (`set -euo pipefail` in the
  remote script instead)
- Drizzle-only ORM: `drizzle-orm` + `mysql2` + `drizzle-kit`. Schema
  tables `lit_locations` / `gps_consent` with the same column names as
  the previous raw SQL. Scripts: `db:generate`, `db:migrate`, `db:studio`,
  `db:check`. Migrations under `drizzle/` use `CREATE TABLE IF NOT EXISTS`.
  Canonical SQL: `docs/schema.sql`. Runtime: `src/lib/db/` (Drizzle queries,
  `toJsonSafe` / `toJsonNumber` kept). API logs real DB errors; connection
  failures return 503 `Database unavailable` (no secrets in the body).
- `deploy/pm2-sync.sh` / `deploy/pm2-inspect.cjs` — name-based PM2 apply
  + sibling-path safety
- `docs/ci-cd.md` — CI steps, secret names, path, PM2 name
  `jehovahs-light`, no `package.json` port hacks, Production untouched
- ESLint: ignore `deploy/**` (PM2 CJS) so `npm run lint` is green on CI
- Earth land luminance is half the v0/develop contrast-lifted look
  (`LAND_LUMINANCE_FACTOR = 0.5` in `Earth.tsx`); ocean, beacons,
  and camera framing are unchanged
- Globe3D uses a local NASA Blue Marble equirectangular satellite
  texture (`public/globe/earth-blue-marble.jpg` via drei `useTexture`);
  procedural canvas continents removed; unlit map (no clouds / day-night)
  with a land/sea contrast boost so land reads brighter than ocean,
  then land RGB scaled by `LAND_LUMINANCE_FACTOR` (`0.5` vs the v0 lift);
  OrbitControls drag-rotate + zoom; auto-rotation via OrbitControls;
  starfield denser/brighter (count 8000, factor 7, closer radius)
- Globe light points / LightGlow (and user marker glow) are ~1/4 of the
  previous visual size (`pointsMaterial` 0.015; glow pulse 0.01–0.015)
- Returning GPS-accepted visitors open the glass panel in the lit state:
  localStorage cache `jehovahs-light:user-consent` plus existing
  `GET /api/locations` `userConsent` (IP). No new consent endpoint.
- Mobile **page** zoom locked (`viewport` initial-scale=1, maximum-scale=1,
  user-scalable=no). Globe pinch/scroll zoom is on (`enableZoom`, canvas
  `touch-action: none`); compact camera frames the Earth disk at ~72% of
  canvas height (camera `z` / vertical FOV, not width-limited fit), then
  the user can zoom. Hint is “Drag or zoom…”.
  Layout is column on mobile (globe above panel) and row on desktop.
- Home chrome matches v10 type scale: larger header title/tagline,
  unlit panel is a large CTA (“Let your light shine”) + prominent
  LAMPS LIT count (no packed tiny-text card); lit title/body/count
  are larger. 14-locale detection unchanged.
- Header title/tagline, bottom CTA, lamp count / LAMPS LIT, and hint
  copy were 2× the previous develop sizes on both mobile and desktop
  (later raised to 3× current develop; overlay padding tightened).
- Below `lg`, header and bottom CTA/count/hint overlay the globe canvas
  (`absolute`) so ×2 type no longer consumes flex height. Overlay
  padding/gaps are tighter; the rotate hint sits on the globe’s bottom
  edge. Desktop (`lg` row) stays in-flow. Zoom, stars, land brightness,
  APIs, consent, and i18n strings are unchanged.
- Narrow home is a true `100dvh` canvas (`absolute inset-0` of `main`,
  not a flex-column child). Bottom CTA / lamp count / hint is a **short
  translucent overlay** (no solid glass card, low-opacity gradient,
  tight padding). Overlay type is slightly reduced so the bar stays
  short; desktop (`lg`) keeps the glass card and ×2 sizes. Zoom, stars,
  land, APIs, and consent are unchanged.
- Home chrome type (header title/tagline, bottom CTA, lamp count /
  LAMPS LIT, hint, lit title/message) was briefly **3× develop**, then
  **÷3** back toward readable sizes (`page.tsx` + WelcomePanel /
  LampCounter / LightLampButton). Overlay chrome, Earth ≥60%, zoom,
  stars, land, APIs, and consent are unchanged.
- Site favicon / apple-touch / PNG icons use the glossy blue plus/cross
  artwork (alpha kept). `public/favicon.ico` (16/32/48),
  `icon-32.png` / `icon-192.png` / `icon-512.png`,
  `apple-touch-icon.png` (180), plus Next file conventions
  `src/app/favicon.ico`, `icon.png`, `apple-icon.png`. `layout`
  `metadata.icons` points at the public files.
- Compact globe camera no longer width-fits atmosphere + margin (that
  left a ~34% / tinier disk on 390×844). Default `position.z` uses
  vertical FOV so the Earth disk is ~72% of canvas height (≥60% gate).
  Zoom-out still reaches the full-sphere fit; desktop stays at distance 6.
- Stats no longer treat a failed `GET /api/locations` as zeros; error + retry.
  Live `/api/locations` 500 is documented in `docs/locations-api.md`
  (likely host MySQL/.env; BigInt JSON serialize is also guarded in code).
- Mobile typography bumped (header, hero, stats values/labels, footer,
  intro, language selector) so Chinese/English stay readable.
- 14 locales via next-intl messages: en, zh-TW, zh-CN, es, pt, fr, de,
  ja, ko, ru, ar, id, th, vi. Detection: locale cookie → SSR
  Accept-Language → navigator.language → en. Unmatched (including
  unmatched region variants like zh-HK) → en. `html dir=rtl` only for ar.
- Language cookie reload keeps the main page in the same tab (sessionStorage
  intro-dismissed); first visit still shows the lighthouse intro.
- `npm run build` `postbuild` copies `public` + `.next/static` into
  `.next/standalone` so `/globe/earth-blue-marble.jpg` works under
  `node .next/standalone/server.js` without a manual `cp`. Deploy
  workflow keeps an explicit `cp -a` as belt-and-suspenders.

## In Progress

- First live SSH deploy may wait on repository secrets
- Production CD out of scope
- Host may still be running historical PM2 id 14 as `npm start` /
  `next start` until this workflow lands and (if needed) the one-time
  old-name migration is done on the host

## File Structure (key files)

- `package.json` — `"start": "next start"`; `"postbuild"` copies standalone
  assets; `db:generate` / `db:migrate` / `db:studio` / `db:check`
- `scripts/copy-standalone-assets.mjs` — `public` + `.next/static` → standalone
- `drizzle.config.ts` — dialect mysql; `DB_HOST` / `DB_USER` / `DB_PASSWORD` /
  `DB_NAME`
- `src/lib/db/schema.ts` — `lit_locations`, `gps_consent`
- `src/lib/db/index.ts` — Drizzle queries (same `@/lib/db` exports)
- `src/lib/db/errors.ts` — connection error → 503
- `drizzle/` — SQL migrations + meta journal
- `docs/schema.sql` — canonical CREATE IF NOT EXISTS
- `next.config.ts` — `output: 'standalone'`
- `.env.example` — `PORT` + DB vars
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-develop.yml`
- `deploy/with-env.sh`
- `deploy/ecosystem.config.cjs`
- `deploy/pm2-sync.sh` — startOrReload ecosystem by name + verify
- `deploy/pm2-inspect.cjs` — parse `pm2 jlist` for sync/safety checks
- `docs/deploy.md`
- `docs/ci-cd.md`
- `docs/globe-texture.md` — NASA Blue Marble source, credit, license
- `public/globe/earth-blue-marble.jpg` — local 2048×1024 satellite map
- `public/globe/SOURCE.txt` — asset provenance next to the JPEG
- `src/components/Globe3D.tsx` — R3F scene: Earth + beacons + own beacon,
  OrbitControls rotate + zoom, compact height-fill framing (Earth disk
  ≥60% of viewport height) then zoom, brighter Stars
- `src/components/globe/Earth.tsx` — Blue Marble + land/sea contrast shader;
  `LAND_LUMINANCE_FACTOR` (0.5 vs v0/develop land lift; sea unchanged)
- `src/components/globe/Beacons.tsx` / `OwnBeacon.tsx` / `lat-lng.ts`
- `src/components/WelcomePanel.tsx` / `LightLampButton.tsx` / `LampCounter.tsx`
  — CTA / count / hint / lit copy at ÷3 of the prior ×3 scale (readable
  rem sizes). Below `lg` the bottom chrome stays a short translucent
  overlay so the globe stays ≥60% of the viewport
- `src/components/LanguageSelector.tsx` — v0 pill chrome, all 14 locales
- `src/lib/consent-cache.ts` — localStorage cache for intro skip
- `docs/consent-memory.md` — IP + localStorage limitations
- `eslint.config.mjs` — ignores `deploy/**`
- `public/favicon.ico` / `icon-32.png` / `icon-192.png` / `icon-512.png`
  / `apple-touch-icon.png` — glossy blue plus (alpha); also
  `src/app/favicon.ico`, `icon.png`, `apple-icon.png`
- `public/icon-SOURCE.txt` — icon artwork provenance
- `src/app/layout.tsx` — `metadata.icons` for ico / 32 / 192 / 512 / apple 180
- `src/app/page.tsx` — header brand `1rem` / `1.125rem` (÷3 then ×0.5),
  tagline `0.75rem` / `0.875rem` (÷3 then ×0.5); `main` is `h-[100dvh]`
  with the globe `absolute inset-0` below `lg`; header + short bottom
  bar overlay; `lg` stays header + row sidebar in-flow with the glass card
- `src/app/` — pages and API routes
- `src/i18n/config.ts` — 14 locales + native names
- `src/i18n/resolve-locale.ts` — cookie / Accept-Language / navigator match
- `src/i18n/messages/*.json` — en, zh-TW, zh-CN, es, pt, fr, de, ja, ko, ru, ar, id, th, vi
- `src/components/LocaleNavigatorFallback.tsx` — navigator fallback when SSR defaulted
- `src/app/layout.tsx` — viewport lock, html lang/dir, locale source
- `docs/i18n-viewport.md` — page viewport lock + globe zoom + locale list
- `src/lib/json-safe.ts` — BigInt-safe JSON for mysql2 COUNT / insertId
- `docs/locations-api.md` — GET /api/locations 500 diagnosis

## API Routes Summary

- `GET/POST /api/locations` — lit locations; GET also returns `userConsent`
  (IP) used to skip intro. Connection failures: 503 `Database unavailable`.
- `POST /api/consent` — GPS consent by IP (decline path; no new routes)

## Known Issues

- Server must have `.env` with `PORT` before PM2 apply of `jehovahs-light`
- First `deploy-develop.yml` run fails until `DEPLOY_HOST`,
  `DEPLOY_USER`, and `DEPLOY_SSH_KEY` are set — workflow is still shipped
- Dirty host working tree aborts deploy (no `git reset --hard`)
- If PM2 id 14 is still named `jehovahs-light.ink.net.tw`, CI aborts and
  asks for one-time `pm2 delete` + `pm2 start ecosystem` + `pm2 save`
- GPS intro skip is IP + localStorage only: shared Wi-Fi / VPN / IP change
  can mis-identify; new device or cleared storage falls back to IP
  (`docs/consent-memory.md`). Home no longer shows the lighthouse splash;
  first visit is the v0 glass panel with CTA “Let your light shine”.
- Live `GET /api/locations` on jehovahs-light.ink.net.tw returns HTTP 500
  (`Failed to fetch locations`). UI now shows error + retry instead of
  silent zeros. Likely host MySQL/.env; BigInt JSON is guarded in code.
  API now logs the real error and returns 503 when the DB is unreachable.
  See `docs/locations-api.md`. Production path untouched by this PR.
- Narrow/mobile leftover globe strip after ×2 in-flow type is addressed
  by a full-viewport canvas plus a short translucent bottom overlay
  (PR #16’s overlay still left a half-screen solid card). Desktop
  (`lg` row) globe share was already large and stays an in-flow card.
- After #17 the canvas was full-viewport but compact OrbitControls still
  width-fit the atmosphere (camera ~14 on 390×844), so the Earth disk
  was a small circle in a sea of black. Compact default now uses
  vertical FOV height-fill (~72%, `z` ≈ 6.7) so the disk is ≥60% of
  viewport height. Zoom-out can still reach the full-sphere fit.

## Recent Commits

- Shrink home chrome type ÷3, then halve header brand and tagline
  (brand ×0.5; tagline 缩小一倍 → ×0.5). Overlay / Earth ≥60% /
  APIs unchanged.
- Replace default Next favicon with the glossy blue plus/cross
  (transparent alpha). Multi-size ICO + 32/192/512 PNGs + 180
  apple-touch; wire `metadata.icons`. Chrome type ×3 and Earth ≥60%
  unchanged.
- Triple header title/tagline, bottom CTA, lamp count / LAMPS LIT,
  hint, and lit title/message vs current develop (mobile + desktop).
  Keep short overlay chrome and #18 Earth disk ≥60% viewport height;
  tighter overlay padding only. No API / consent / land / zoom / stars
  changes.
- Narrow screens: pull the compact globe camera closer (vertical FOV
  height-fill ~72%, `z` ≈ 6.7) so the rendered Earth disk is ≥60% of
  viewport height. Keep short translucent bottom bar, zoom, stars,
  land, APIs. Desktop framing unchanged.
- Narrow screens: full-viewport globe canvas + short translucent bottom
  bar (CTA / count / hint). Drop the solid half-screen flex card that
  still covered the globe after #16. Slightly reduce overlay type;
  desktop glass card unchanged. No API / consent / land / zoom / stars
  changes.
- Overlay header and bottom CTA/count/hint on the globe below `lg` so
  ×2 type no longer crushes the canvas into a thin band. Tighten overlay
  padding/gaps; sit the hint on the globe bottom edge. Desktop layout,
  zoom, stars, land, APIs, consent, and i18n strings unchanged.
- Double header title/tagline, bottom CTA, lamp count / LAMPS LIT, and
  hint font sizes (mobile + desktop). Keep globe share and chrome
  padding/gaps as on develop; no 3/4 shrink.
- Match v10 mobile type scale (larger header, CTA “Let your light shine”,
  prominent LAMPS LIT); enable globe OrbitControls zoom while the page
  viewport stays locked; denser/brighter starfield; hint “Drag or zoom…”
  in all 14 locales. `/api/locations`, consent, locale detection, and
  land luminance unchanged.
- Halve Earth land luminance vs the v0/develop contrast lift via
  reversible `LAND_LUMINANCE_FACTOR = 0.5` (sea / beacons / camera
  / mobile zoom lock unchanged)
- Port v0 “Light of the Nations” home UI onto develop: glass panel,
  globe beacons, lamp counter, 14-locale chrome; wire to `/api/locations`
- Add Drizzle ORM only (no Prisma): schema for `lit_locations` /
  `gps_consent`, idempotent SQL migrations, `db:migrate` on develop deploy
  and CI MySQL, clearer 503/500 API errors
- postbuild copies `public` + `.next/static` into Next standalone output
- Mobile type bump, fit full globe in 60vh, stats error state; JSON-safe
  locations API (BigInt) + document live 500
- Lock mobile viewport/globe pinch zoom; add 14 next-intl locales with
  cookie → Accept-Language → navigator → en (RTL for ar)
- Shrink Globe3D light/glow sizes to ~1/4; skip lighthouse intro when
  GET /api/locations `userConsent` or localStorage shows GPS already accepted
- Replace Globe3D procedural continents with local NASA Blue Marble
  satellite texture (`public/globe/`); unlit map, document attribution
- Switch develop deploy from `pm2 reload 14` to ecosystem
  `startOrReload --update-env` (name `jehovahs-light`, fail if still
  `next start`)
- Remove invalid `script_stop` from develop SSH deploy (`set -euo pipefail`)
- Load PORT from `.env` via PM2 id 14 (standalone); keep `next start`
- Add GitHub Actions CI + develop SSH deploy (no Production CD)
- Make `npm run lint` green for CI (ignore `deploy/**`, hook/import fixes)

## Key Decisions Made

- PORT is never hardcoded in `package.json` start (host `.env` only)
- Because `output: 'standalone'`, PM2 runs `node .next/standalone/server.js`
  via `with-env.sh` rather than `next start`
- Identify the PM2 app by name `jehovahs-light` from ecosystem, not
  numeric id 14. `pm2 reload 14` does not change an existing start command
- CI/CD lives in this repo; only **develop** is deployed over SSH
- Production remains untouched (no production workflow)
- `appleboy/ssh-action` must not use `script_stop` (invalid / problematic);
  fail-fast is `set -euo pipefail` inside the remote script
- Globe Earth map is a local NASA Blue Marble JPEG under `public/globe/`
  (no runtime hotlink). Unlit `meshBasicMaterial` so there is no cloud
  layer and no day/night terminator.
- Standalone `public` / `.next/static` copy lives in `npm run build`
  (`postbuild`) so local and host builds always produce a complete tree;
  the SSH workflow copy is kept as belt-and-suspenders.
- Intro skip uses existing `userConsent` on `GET /api/locations` plus
  localStorage; decline is remembered but does not skip the intro.
- Mobile **page** zoom is locked via Next.js `viewport` export (not a raw
  meta tag). Globe OrbitControls `enableZoom` is on; pinch/wheel zoom the
  camera only (`touch-none` on the canvas). Compact viewports still frame
  the full globe first. Hint copy is `home.rotateHint` in all 14 locales.
- Locale cookie is the user pick (and navigator fallback persist). SSR
  uses Accept-Language when the cookie is missing. Unmatched region
  variants (e.g. zh-HK) do not map to zh-TW/zh-CN. RTL only for `ar`.
  UI strings live in next-intl `messages/*.json` (no duplicate hardcoded
  maps, no translate API).
- Database access is Drizzle-only (no Prisma, no dual ORM). Table and
  column names stay `lit_locations` / `gps_consent` with the original
  snake_case columns so existing host tables are reused. Migrations are
  `CREATE TABLE IF NOT EXISTS`.
- Top/bottom copy (header title/tagline, CTA, lamp count label, hint,
  lit title/message) is sized at **÷3 of the prior ×3** scale so type
  stays readable on ~390px. Below `lg`, chrome overlays a full-viewport
  canvas; the bottom bar stays a short translucent strip. Compact
  camera frames the Earth disk at ~72% of canvas height so the sphere
  is ≥60% of viewport height. Desktop chrome stays an in-flow glass
  card with distance-6 framing.
- Home chrome follows the v0 dark full-bleed + glass panel. Lighting a
  lamp still uses existing locations/consent APIs (not the zip’s
  `/api/lamps` or Postgres). v0 `zh-Hant` strings map to `zh-TW`; all 14
  locales stay in `src/i18n/messages`. Earth stays local Blue Marble with
  a land-brighter-than-sea contrast boost (no hotlink). Land luminance
  after that lift is `LAND_LUMINANCE_FACTOR` (`0.5` vs v0; set `1` to
  restore). Sea mix is not scaled.
