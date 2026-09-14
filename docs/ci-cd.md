# CI / CD (develop)

Quality owns GitHub Actions in this repo. Production CD is **out of scope** —
there is no production deploy workflow, and this documentation does not change
Production.

PORT still comes from the **host `.env` only**. `package.json` `"start"` stays
`next start`. Never add `--port`. See [deploy.md](deploy.md) (PM2 id **14**).

## CI — `.github/workflows/ci.yml`

Runs on `pull_request` and `push` targeting **`develop`**.

| Step | Command |
| --- | --- |
| Node | **22** (`actions/setup-node`, Next.js 16 needs `>= 20.9`) |
| Install | `npm ci` |
| Lint | `npm run lint` (`eslint` + `eslint-config-next` 16.2.4).
  `deploy/**` is ignored (PM2 CommonJS). |
| Build | `npm run build` |

Job env uses harmless placeholders so a build that reads `.env.example` keys
does not fail:

- `PORT=3000` (CI only; does **not** change `package.json`)
- `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` (`src/lib/db.ts` is
  runtime-only today, with local defaults)
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
5. `npm ci` and `npm run build`.
6. Copy `public` → `.next/standalone/public` and `.next/static` →
   `.next/standalone/.next/static` (Next standalone does not include these;
   see the [output docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)).
7. `pm2 reload 14` (process name must be `jehovahs-light`). Does **not**
   `pm2 start` a second process. If id 14 is missing, the job fails and asks
   for a one-time host start (see [deploy.md](deploy.md)).

PM2 still starts via `deploy/with-env.sh` → `node .next/standalone/server.js`.
Reload re-reads the host `.env` through that wrapper.

## Production

Untouched. No `.github/workflows` file deploys Production. Merge to `main` /
production cutovers stay a separate, reviewed decision.
