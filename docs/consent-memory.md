# Lit state and per-person counting

The home page shows the **lit** welcome panel only when **this browser**
lit a lamp before. The server never tells a visitor they are lit based on IP.

## Why not IP

Several people on one home Wi-Fi (or carrier NAT, iCloud Private Relay)
share one public IP. Keying the lit state on IP made the second and third
person see “your lamp is shining” without ever lighting one, and the stats
counted the household as one.

## How it works now

- `localStorage` key `jehovahs-light:user-consent:v2` holds this browser's
  own consent / coordinates. The `v2` suffix drops values copied from the
  old IP lookup.
- `localStorage` key `jehovahs-light:visitor-id` holds an anonymous UUID
  (`src/lib/visitor-id.ts`), sent as `visitorId` on `POST /api/locations`.
- `lit_locations.visitor_id` is `UNIQUE`: one row per browser. A second
  POST from the same browser returns `alreadyExists: true` with the stored
  location instead of inserting.
- There is no 1 km duplicate check on the server any more. Three people at
  one address make three rows; the globe merges lamps within 1 km into one
  beacon (`src/lib/cluster-lamps.ts`), so the map still shows one light.
- `GET /api/locations` returns only `locations` and `stats`; no
  `userConsent`.
- `POST /api/consent` (decline) and `gps_consent` are still written, but
  never read to decide the lit state.

## Limitations

- **New device / cleared site data / another browser**: looks like a new
  person and can light another lamp. Counting is per browser, not a login.
- **Private mode**: storage may be wiped when the window closes, so the
  lamp shows unlit on the next visit.
- A POST without `visitorId` (stale cached client) still inserts a row with
  `visitor_id = NULL`.
