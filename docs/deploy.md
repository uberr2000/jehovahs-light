# Deploy

Production on this server is untouched by this documentation change. Merge
only after review. This repo does **not** own GitHub Actions — quality owns
CI via `deploy-develop.yml`. Do not add `.github/workflows` here.

## Server

| Item | Value |
| --- | --- |
| Path | `/var/www/html/jehovahs-light.ink.net.tw/` |
| PM2 app name | `jehovahs-light` |
| PM2 process id | **14** |
| Start script | `deploy/with-env.sh` → `node .next/standalone/server.js` |

`next.config.ts` sets `output: 'standalone'`. PM2 therefore runs the
standalone server, not `next start`. `package.json` `start` stays
`next start` so a sourced `.env` still works for `npm start`.

## PORT

**PORT comes from the server `.env` only.**

- Keep `package.json` `"start": "next start"`. Next.js and standalone
  `server.js` both read `process.env.PORT`.
- Never add `--port` to `package.json`.
- Never hardcode the listen port in npm scripts on the server.

Copy and edit env on the server (do not commit `.env`):

```bash
cp .env.example .env
# set PORT and DB_* for this host
```

## PM2

`deploy/ecosystem.config.cjs` loads repo-root `.env` into the PM2 `env`
block. `deploy/with-env.sh` sources the same `.env` immediately before
exec so PORT is present even if PM2 was started without a reload of env.

From the deploy path, prefer reloading the existing id **14**:

```bash
cd /var/www/html/jehovahs-light.ink.net.tw
pm2 reload 14
```

First-time start (only if id 14 does not exist):

```bash
cd /var/www/html/jehovahs-light.ink.net.tw
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

Do not `pm2 start` a second `jehovahs-light` process. Confirm with
`pm2 show 14` that `name` is `jehovahs-light` and `PORT` matches `.env`.

## Local / npm

```bash
cp .env.example .env
npm start
```

`npm start` is `next start` with no `--port`. Export or source `.env`
first (or use `.env` / `.env.local` as Next already loads those for
`next start`).
