# project_state

_Last updated: 2026-09-16_

## Project name & stack summary

Jehovah's Light — Next.js 16 (App Router) + React 19 + Three.js globe,
MySQL (`mysql2`), next-intl. Deployed with PM2 + Nginx. Production path
`/var/www/html/jehovahs-light.ink.net.tw/`.

## Features Done

- 3D globe, GPS consent, i18n (14 locales), locations API
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
  `NEXT_PUBLIC_APP_URL` / `PORT` in the job env)
- `.github/workflows/deploy-develop.yml` — SSH deploy on `push` to
  `develop`; secrets `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`;
  dirty-tree fail (no `git reset --hard`); `git pull --ff-only`;
  standalone `public` + `.next/static` copy; `pm2 startOrReload`
  `deploy/ecosystem.config.cjs --update-env` (delete-by-name fallback);
  verify script is standalone/`with-env.sh` (fail if still `next start`);
  no `script_stop` on `appleboy/ssh-action` (`set -euo pipefail` in the
  remote script instead)
- `deploy/pm2-sync.sh` / `deploy/pm2-inspect.cjs` — name-based PM2 apply
  + sibling-path safety
- `docs/ci-cd.md` — CI steps, secret names, path, PM2 name
  `jehovahs-light`, no `package.json` port hacks, Production untouched
- ESLint: ignore `deploy/**` (PM2 CJS) so `npm run lint` is green on CI
- Globe3D uses a local NASA Blue Marble equirectangular satellite
  texture (`public/globe/earth-blue-marble.jpg` via drei `useTexture`);
  procedural canvas continents removed; unlit map (no clouds / day-night);
  OrbitControls zoom locked on mobile; auto-rotation unchanged
- Globe light points / LightGlow (and user marker glow) are ~1/4 of the
  previous visual size (`pointsMaterial` 0.015; glow pulse 0.01–0.015)
- Returning GPS-accepted visitors skip `LighthouseIntro`: localStorage
  cache `jehovahs-light:user-consent` plus existing `GET /api/locations`
  `userConsent` (IP). No new consent endpoint.
- Mobile page zoom locked (`viewport` initial-scale=1, maximum-scale=1,
  user-scalable=no). Globe3D pinch zoom off on coarse pointer / max-width
  768px; mobile camera pulls back so the full globe fits in 60vh (distance
  from FOV/aspect, pinch still locked). Layout remains responsive.
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

## In Progress

- First live SSH deploy may wait on repository secrets
- Production CD out of scope
- Host may still be running historical PM2 id 14 as `npm start` /
  `next start` until this workflow lands and (if needed) the one-time
  old-name migration is done on the host

## File Structure (key files)

- `package.json` — `"start": "next start"`
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
- `src/components/Globe3D.tsx` — R3F sphere + `useTexture('/globe/...')`
- `src/lib/consent-cache.ts` — localStorage cache for intro skip
- `docs/consent-memory.md` — IP + localStorage limitations
- `eslint.config.mjs` — ignores `deploy/**`
- `src/app/` — pages and API routes
- `src/i18n/config.ts` — 14 locales + native names
- `src/i18n/resolve-locale.ts` — cookie / Accept-Language / navigator match
- `src/i18n/messages/*.json` — en, zh-TW, zh-CN, es, pt, fr, de, ja, ko, ru, ar, id, th, vi
- `src/components/LocaleNavigatorFallback.tsx` — navigator fallback when SSR defaulted
- `src/app/layout.tsx` — viewport lock, html lang/dir, locale source
- `docs/i18n-viewport.md` — viewport lock + locale priority + list
- `src/lib/json-safe.ts` — BigInt-safe JSON for mysql2 COUNT / insertId
- `docs/locations-api.md` — GET /api/locations 500 diagnosis

## API Routes Summary

- `GET/POST /api/locations` — lit locations; GET also returns `userConsent`
  (IP) used to skip intro
- `GET/POST /api/consent` — GPS consent by IP (decline path; no new routes)

## Known Issues

- Server must have `.env` with `PORT` before PM2 apply of `jehovahs-light`
- First `deploy-develop.yml` run fails until `DEPLOY_HOST`,
  `DEPLOY_USER`, and `DEPLOY_SSH_KEY` are set — workflow is still shipped
- Dirty host working tree aborts deploy (no `git reset --hard`)
- If PM2 id 14 is still named `jehovahs-light.ink.net.tw`, CI aborts and
  asks for one-time `pm2 delete` + `pm2 start ecosystem` + `pm2 save`
- GPS intro skip is IP + localStorage only: shared Wi-Fi / VPN / IP change
  can mis-identify; new device or cleared storage falls back to IP
  (`docs/consent-memory.md`)
- Live `GET /api/locations` on jehovahs-light.ink.net.tw returns HTTP 500
  (`Failed to fetch locations`). UI now shows error + retry instead of
  silent zeros. Likely host MySQL/.env; BigInt JSON is guarded in code.
  See `docs/locations-api.md`. Production path untouched by this PR.

## Recent Commits

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
- Intro skip uses existing `userConsent` on `GET /api/locations` plus
  localStorage; decline is remembered but does not skip the intro.
- Mobile zoom is locked via Next.js `viewport` export (not a raw meta tag)
  plus OrbitControls `enableZoom={false}` on coarse/narrow viewports.
- Locale cookie is the user pick (and navigator fallback persist). SSR
  uses Accept-Language when the cookie is missing. Unmatched region
  variants (e.g. zh-HK) do not map to zh-TW/zh-CN. RTL only for `ar`.
  UI strings live in next-intl `messages/*.json` (no duplicate hardcoded
  maps, no translate API).
