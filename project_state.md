# project_state

_Last updated: 2026-09-14_

## Project name & stack summary

Jehovah's Light — Next.js 16 (App Router) + React 19 + Three.js globe,
MySQL (`mysql2`), next-intl. Deployed with PM2 + Nginx. Production path
`/var/www/html/jehovahs-light.ink.net.tw/`.

## Features Done

- 3D globe, GPS consent, i18n (en / zh-TW / zh-CN), locations API
- `package.json` `start` kept as `next start` (Next reads `PORT`; no `--port`)
- `.env.example` documents `PORT` (must be set on the server `.env`)
- `deploy/with-env.sh` sources `.env` then execs the start command
- `deploy/ecosystem.config.cjs` loads `.env`; app name `jehovahs-light`;
  PM2 id **14**; standalone `node .next/standalone/server.js`
- `docs/deploy.md` — path, PM2 14, PORT from `.env`, never edit
  `package.json` start
- `.github/workflows/ci.yml` — `pull_request` + `push` to `develop`;
  Node 22, `npm ci`, `npm run lint`, `npm run build` (dummy `DB_*` /
  `NEXT_PUBLIC_APP_URL` / `PORT` in the job env)
- `.github/workflows/deploy-develop.yml` — SSH deploy on `push` to
  `develop`; secrets `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY`;
  dirty-tree fail (no `git reset --hard`); `git pull --ff-only`;
  standalone `public` + `.next/static` copy; `pm2 reload 14`; no
  `script_stop` on `appleboy/ssh-action` (`set -euo pipefail` in the
  remote script instead)
- `docs/ci-cd.md` — CI steps, secret names, path, PM2 14, no
  `package.json` port hacks, Production untouched
- ESLint: ignore `deploy/**` (PM2 CJS); unused `locales` import;
  cookie-locale hydrate disable; Globe texture via `useState` init
  so `npm run lint` is green on CI

## In Progress

- First live SSH deploy may wait on repository secrets
- Production CD out of scope

## File Structure (key files)

- `package.json` — `"start": "next start"`
- `next.config.ts` — `output: 'standalone'`
- `.env.example` — `PORT` + DB vars
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-develop.yml`
- `deploy/with-env.sh`
- `deploy/ecosystem.config.cjs`
- `docs/deploy.md`
- `docs/ci-cd.md`
- `eslint.config.mjs` — ignores `deploy/**`
- `src/app/` — pages and API routes
- `src/lib/db.ts`

## API Routes Summary

- `GET/POST /api/locations` — lit locations
- `GET/POST /api/consent` — GPS consent by IP

## Known Issues

- Server must have `.env` with `PORT` before PM2 reload of id 14
- First `deploy-develop.yml` run fails until `DEPLOY_HOST`,
  `DEPLOY_USER`, and `DEPLOY_SSH_KEY` are set — workflow is still shipped
- Dirty host working tree aborts deploy (no `git reset --hard`)

## Recent Commits

- Remove invalid `script_stop` from develop SSH deploy (`set -euo pipefail`)
- Load PORT from `.env` via PM2 id 14 (standalone); keep `next start`
- Add GitHub Actions CI + develop SSH deploy (no Production CD)
- Make `npm run lint` green for CI (ignore `deploy/**`, hook/import fixes)

## Key Decisions Made

- PORT is never hardcoded in `package.json` start (host `.env` only)
- Because `output: 'standalone'`, PM2 runs `node .next/standalone/server.js`
  via `with-env.sh` rather than `next start`
- PM2 process id 14 is documented, not created as a second process
- CI/CD lives in this repo; only **develop** is deployed over SSH
- Production remains untouched (no production workflow)
- `appleboy/ssh-action` must not use `script_stop` (invalid / problematic);
  fail-fast is `set -euo pipefail` inside the remote script
