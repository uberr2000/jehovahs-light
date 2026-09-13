# project_state

_Last updated: 2026-09-13_

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
  `package.json` start; quality owns `deploy-develop.yml`

## In Progress

- PR against `develop` (do not merge; production untouched)

## File Structure (key files)

- `package.json` — `"start": "next start"`
- `next.config.ts` — `output: 'standalone'`
- `.env.example` — `PORT` + DB vars
- `deploy/with-env.sh`
- `deploy/ecosystem.config.cjs`
- `docs/deploy.md`
- `src/app/` — pages and API routes
- `src/lib/db.ts`

## API Routes Summary

- `GET/POST /api/locations` — lit locations
- `GET/POST /api/consent` — GPS consent by IP

## Known Issues

- Server must have `.env` with `PORT` before PM2 reload of id 14
- This repo must not grow `.github/workflows` (quality owns CI)

## Recent Commits

- Load PORT from `.env` via PM2 id 14 (standalone); keep `next start`

## Key Decisions Made

- PORT is never hardcoded in `package.json` start
- Because `output: 'standalone'`, PM2 runs `node .next/standalone/server.js`
  via `with-env.sh` rather than `next start`
- PM2 process id 14 is documented, not created as a second process
- No GitHub Actions in this repo
