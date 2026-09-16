# CI / CD (develop)

Quality owns GitHub Actions in this repo. Production CD is **out of scope** —
there is no production deploy workflow, and this documentation does not change
Production.

PORT still comes from the **host `.env` only**. `package.json` `"start"` stays
`next start`. Never add `--port`. See [deploy.md](deploy.md) (PM2 name
`jehovahs-light`; do not assume numeric id 14).

## CI — `.github/workflows/ci.yml`

Runs on `pull_request` and `push` targeting **`develop`**.

| Step | Command |
| --- | --- |
| Node | **22** (`actions/setup-node`, Next.js 16 needs `>= 20.9`) |
| Install | `npm ci` |
| Lint | `npm run lint` (`eslint` + `eslint-config-next` 16.2.4).
  `deploy/**` is ignored (PM2 CommonJS). |
| Build | `npm run build` (`postbuild` copies `public` + `.next/static` into standalone) |
| Verify | `test -f .next/standalone/public/globe/earth-blue-marble.jpg` |
| Drizzle check | `npm run db:check` (`drizzle-kit check`, no live DB) |
| Migrate | `npm run db:migrate` against an ephemeral MySQL 8 service
  (`DB_HOST=127.0.0.1`). Run twice to confirm `CREATE TABLE IF NOT EXISTS`
  is idempotent. |

Job env uses harmless placeholders so a build that reads `.env.example` keys
does not fail:

- `PORT=3000` (CI only; does **not** change `package.json`)
- `DB_HOST=127.0.0.1` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` (`ci`) —
  used by Drizzle at runtime and by `db:migrate` against the MySQL service
- `NEXT_PUBLIC_APP_URL=https://example.invalid` (listed in `.env.example`;
  unused in source at the time of writing)

## Develop deploy — `.github/workflows/deploy-develop.yml`

Runs on **`push` to `develop`**. First live SSH deploy may fail until secrets
exist; that is expected.

### Required repository secrets

| Secret | Purpose |
| --- | --- |
| `DEPLOY_HOST` | SSH hostname of the develop host |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key for that user |

The job **fails early** with a clear message if any secret is missing or empty.
It does not print secret values.

The SSH step does **not** pass `script_stop` to `appleboy/ssh-action` (that
input is invalid / problematic — same lesson as ai.srdc.org.tw and
member.rsh-care.com). The remote script starts with `set -euo pipefail` so
a failing command still stops the deploy.

### Host steps (in order)

1. `cd /var/www/html/jehovahs-light.ink.net.tw/` only. Sibling paths
   `/var/www/html/ai.srdc.org.tw` and `/var/www/html/member.rsh-care.com`
   are never touched.
2. Fail if `git status --porcelain` is non-empty. **Do not**
   `git reset --hard` (same lesson as the ai.srdc.org.tw dirty `package.json`).
3. Require host `.env` with `PORT` already set. The workflow never writes PORT
   and never edits `package.json`.
4. `git fetch origin develop`, then `git pull --ff-only origin develop` when
   already on `develop` (otherwise checkout `develop` and pull `--ff-only`).
5. `npm ci` and `npm run build`. `postbuild`
   (`scripts/copy-standalone-assets.mjs`) copies `public` →
   `.next/standalone/public` and `.next/static` →
   `.next/standalone/.next/static` so the globe texture
   (`/globe/earth-blue-marble.jpg`) is already in the standalone tree.
6. The workflow still repeats that copy with `rm` + `cp -a` as
   belt-and-suspenders (Next standalone does not include these by
   default; see the [output docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)).
   See [deploy.md](deploy.md) (Standalone assets).
7. Source host `.env` and run `npm run db:migrate` (Drizzle; after pull/build,
   before PM2). Safe if `lit_locations` / `gps_consent` already exist.
8. Apply `deploy/ecosystem.config.cjs` by **name** `jehovahs-light` (not
   numeric id 14). `pm2 reload 14` is **not** enough to change an existing
   `npm start` / `next start` command. The remote script runs
   `bash deploy/pm2-sync.sh`, which:
   - refuses sibling paths `/var/www/html/ai.srdc.org.tw` and
     `/var/www/html/member.rsh-care.com`
   - aborts with one-time migration commands if a historical process named
     `jehovahs-light.ink.net.tw` (or id 14 under another name) still has
     cwd = this deploy path — see [deploy.md](deploy.md)
   - runs `pm2 startOrReload deploy/ecosystem.config.cjs --update-env`
   - if the script is still not standalone: `pm2 delete jehovahs-light`
     then `pm2 start deploy/ecosystem.config.cjs --update-env`
   - **fails the deploy** unless `pm2 show jehovahs-light` script mentions
     `standalone/server.js` or `with-env.sh` (still `next start` → fail)

PM2 must start via `deploy/with-env.sh` → `node .next/standalone/server.js`.
`startOrReload --update-env` re-reads the host `.env` through the ecosystem
and the wrapper. Reload of a stale process definition does not.

## Production

Untouched. No `.github/workflows` file deploys Production. Merge to `main` /
production cutovers stay a separate, reviewed decision.
