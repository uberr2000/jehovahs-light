# Deploy

Production on this server is untouched by this documentation change. Merge
only after review. GitHub Actions for **develop** live in
`.github/workflows/` — see [ci-cd.md](ci-cd.md). There is no Production
deploy workflow.

## Server

| Item | Value |
| --- | --- |
| Path | `/var/www/html/jehovahs-light.ink.net.tw/` |
| PM2 app name | `jehovahs-light` (identifier — do **not** target by numeric id) |
| Historical PM2 id | **14** (may change after delete + start from ecosystem) |
| Start script | `deploy/with-env.sh` → `node .next/standalone/server.js` |

`next.config.ts` sets `output: 'standalone'`. PM2 therefore runs the
standalone server, not `next start`. `package.json` `start` stays
`next start` so a sourced `.env` still works for `npm start`.

**`pm2 reload 14` is not enough.** Reload keeps the existing process
definition. If id 14 was started as `npm start` / `next start`, reload
leaves that command in place (Next standalone warnings and a public 502).
Deploy applies `deploy/ecosystem.config.cjs` instead.

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

Identify this app by name `jehovahs-light` from the ecosystem file, not
only by numeric id 14. Sibling apps on the same host
(`/var/www/html/ai.srdc.org.tw`, `/var/www/html/member.rsh-care.com`)
must not be reloaded, deleted, or started.

From the deploy path, apply the ecosystem (this is what
`.github/workflows/deploy-develop.yml` runs after build + standalone copy):

```bash
cd /var/www/html/jehovahs-light.ink.net.tw
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
```

If the running script is still `next start` / `npm start` after that
(reload does not rewrite the start command), delete **by name** then start:

```bash
cd /var/www/html/jehovahs-light.ink.net.tw
pm2 delete jehovahs-light
pm2 start deploy/ecosystem.config.cjs --update-env
```

Confirm the script, not only the name:

```bash
pm2 show jehovahs-light
# script path / args must mention deploy/with-env.sh or .next/standalone/server.js
# fail if the process is still next start / npm start
```

Do not `pm2 start` a second copy of this app under another name. Confirm
`exec cwd` is `/var/www/html/jehovahs-light.ink.net.tw` and `PORT` matches
`.env`.

### One-time host migration (old name / id 14)

If id 14 historically existed under a **different** name
(`jehovahs-light.ink.net.tw`), `startOrReload` of the ecosystem would
start a **second** process named `jehovahs-light` and leave the old one
bound to `PORT`. Do this once on the host (this app only):

```bash
cd /var/www/html/jehovahs-light.ink.net.tw
pm2 delete jehovahs-light.ink.net.tw
# if the old process is only known as id 14 and cwd is this path:
# pm2 delete 14
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

CI will **abort** and print these commands if it sees that old name (or
id 14 with another name) whose cwd is this deploy path. It will not
delete a differently named process automatically, so sibling apps stay
untouched. After migration, the numeric id may no longer be 14; the name
`jehovahs-light` is the identifier.

## Local / npm

```bash
cp .env.example .env
npm start
```

`npm start` is `next start` with no `--port`. Export or source `.env`
first (or use `.env` / `.env.local` as Next already loads those for
`next start`).
