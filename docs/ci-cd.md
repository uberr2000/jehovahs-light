# CI / CD (develop)

Quality owns GitHub Actions in this repo. Production CD is **out of scope** —
there is no production deploy workflow, and this documentation does not change
Production.

PORT still comes from the **host `.env` only**. `package.json` `"start"` stays
`next start`. Never add `--port`. See [deploy.md](deploy.md) (PM2 name
`jehovahs-light`; do not assume numeric id 14).

## CI — `.github/workflows/ci.yml`

Runs on `pull_request` and `push` targeting **`develop`**, and on
manual **`workflow_dispatch`**. Develop SSH deploy is a **later job in
this same workflow** (`needs: lint-and-build`). It is **not** a
separate `workflow_run` workflow — the repo default branch is `main`,
so a `workflow_run` trigger that exists only on `develop` would never
take effect. The default branch is unchanged; Production is untouched.

| Step | Command |
| --- | --- |
| Node | **22** (`actions/setup-node`, Next.js 16 needs `>= 20.9`) |
| Install | `npm ci` |
| Lint | `npm run lint` (`eslint` + `eslint-config-next` 16.2.4).
  `deploy/**` is ignored (PM2 CommonJS). |
| Test | `npm test` (`tsx --test` on share helpers, site metadata,
  locale default zh-TW, public-URL checker, ShareLightButton) |
| Deploy guard fixtures | `bash deploy/check-app-url.test.sh` |
| Build | `npm run build` (`postbuild` copies `public` + `.next/static` into standalone) |
| Verify | `test -f .next/standalone/public/globe/earth-blue-marble.jpg` |
| Render measure | `npx playwright install --with-deps chromium` then
  `npm run test:chrome` (390×844 + 1440×900 Earth / type / overlap;
  globe X+Y center; overflow hidden/clip/auto/scroll) |
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
  #22 placeholder rules treat this as unset so CI does not bake fake
  `og:url` / share hrefs. Host builds use the real https origin.)

## Develop deploy — job `deploy-develop` in `.github/workflows/ci.yml`

Order: **CI first**, then deploy only if CI succeeded.

| Trigger | CI (`lint-and-build`) | Deploy |
| --- | --- | --- |
| `pull_request` into `develop` | runs | **never** (`if` rejects PR events) |
| `push` to `develop` | runs | runs only after CI is green |
| `workflow_dispatch` on `develop` | runs first | runs after CI is green |
| `workflow_dispatch` on any other ref | runs | **never** |

The deploy job `if` is
`github.ref == 'refs/heads/develop' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')`.
A red CI skips deploy via `needs: lint-and-build`. Overlapping deploys
share concurrency group `deploy-develop` with `cancel-in-progress: false`
so they queue instead of racing. Develop CI runs themselves are not
cancelled mid-SSH (`cancel-in-progress` is false when `github.ref` is
`develop`).

The remote script fetches and checks out **`github.sha`** (the commit
this workflow just tested), then fails if `HEAD` is not that SHA. It
does **not** `git pull` whatever `origin/develop` is at deploy time.

First live SSH deploy may fail until secrets exist; that is expected.

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
4. Fetch `origin/develop` and the tested SHA (`EXPECTED_SHA` =
   `github.sha`) — refs only, worktree unchanged. Extract
   `deploy/check-app-url.sh` via `git show` and validate
   `NEXT_PUBLIC_APP_URL` on the current host `.env`. Fail closed on
   missing/empty/non-`https`/placeholder-or-local host. See the guard
   rule in [deploy.md](deploy.md) (this file is the CD step list; the
   rule lives in `docs/deploy.md`).
5. `git checkout -B develop <sha>` (not `git pull` of the branch tip,
   not `git reset --hard`). Fail if `HEAD` ≠ that SHA.
6. `npm ci` and `npm run build`. `postbuild`
   (`scripts/copy-standalone-assets.mjs`) copies `public` →
   `.next/standalone/public` and `.next/static` →
   `.next/standalone/.next/static` so the globe texture
   (`/globe/earth-blue-marble.jpg`) is already in the standalone tree.
7. The workflow still repeats that copy with `rm` + `cp -a` as
   belt-and-suspenders (Next standalone does not include these by
   default; see the [output docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)).
   See [deploy.md](deploy.md) (Standalone assets).
8. Source host `.env` and run `npm run db:migrate` (Drizzle; after pull/build,
   before PM2). Safe if `lit_locations` / `gps_consent` already exist.
9. Apply `deploy/ecosystem.config.cjs` by **name** `jehovahs-light` (not
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
10. After SSH succeeds, the runner curls the public origin
    (`https://jehovahs-light.ink.net.tw/`) with
    `scripts/check-public-url.mjs`. Fail unless `GET /` is 200 and
    `<title>` contains `點亮地球`, `GET /app-manifest` is 200, and the
    page’s `og:image` URL is 200 with an `image/*` type. A 200 from an
    unrelated Laravel (or other) site is a failure — the live hostname
    has been mis-routed. See [metadata.md](metadata.md). The host
    `check-app-url.sh` guard and `needs: lint-and-build` stay in place.

PM2 must start via `deploy/with-env.sh` → `node .next/standalone/server.js`.
`startOrReload --update-env` re-reads the host `.env` through the ecosystem
and the wrapper. Reload of a stale process definition does not.

## Production

Untouched. No `.github/workflows` file deploys Production. Merge to `main` /
production cutovers stay a separate, reviewed decision.
