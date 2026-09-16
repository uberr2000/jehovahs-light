# Locations API and stats

`GET /api/locations` returns lit points, aggregate stats, and IP `userConsent`.
The home page stats (total / today / countries) come only from this response.
Zeros are not invented on the client when the request fails.

## Live 500 (2026-09-16)

`https://jehovahs-light.ink.net.tw/api/locations` currently returns HTTP 500
`{"error":"Failed to fetch locations"}`. That is the API catch-all; the
handler does not expose the underlying MySQL/JSON error to the browser.

Possible causes, in order of likelihood given we cannot SSH the host:

1. **Host MySQL / `.env`** — connection refused, bad `DB_*`, missing
   `lit_locations` / `gps_consent` tables. This is the most likely if the
   Node process is up (HTML loads) but the query throws. No credentials are
   stored in this repo; fix on the server `.env` and MySQL.
2. **BigInt JSON** — `COUNT(*)` is MySQL `BIGINT`. mysql2 may return `bigint`,
   and `NextResponse.json()` throws `Do not know how to serialize a BigInt`,
   which this same catch maps to 500. The route now runs `toJsonSafe` and
   `toJsonNumber` on counts / insert ids.
3. **`CURDATE()`** — `DATE(created_at) = CURDATE()` would return 0 for
   timezone mismatch, not a 500. Unlikely to be this error.

Production remains untouched by this branch. After merge, develop deploy
can pick up the JSON-safe fix; remaining 500s need host DB logs
(`Error fetching locations:` in the PM2 process).
