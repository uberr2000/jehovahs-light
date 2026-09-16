# GPS consent memory and intro skip

Returning visitors who have **already accepted** GPS sharing skip
`LighthouseIntro` and go straight to the globe. Decline is recorded (IP +
optional local cache) but does **not** skip the intro.

There is **no new consent API**. The frontend reuses:

- `GET /api/locations` → `userConsent` (IP lookup via `gps_consent`)
- `POST /api/locations` when the visitor shares coordinates
- `POST /api/consent` when the visitor denies geolocation

Plus a **same-device localStorage cache**.

## How skip is decided

On load:

1. Read `localStorage` key `jehovahs-light:user-consent`. If `consented` or
   `hasLocation` is true, skip the intro immediately (and still fetch
   locations in the background).
2. Call existing `GET /api/locations`. If `userConsent` indicates the current
   IP already accepted (or already has a stored lat/lng), skip the intro and
   refresh the localStorage cache.

A first-time visitor with no cache and no IP match still sees the lighthouse
intro. After they share location, the client writes the cache so the next
visit on that device skips even if the public IP changes briefly.

## Limitations (IP and cache)

Consent on the server is **keyed by client IP** (`CF-Connecting-IP` /
`X-Forwarded-For` / `X-Real-IP`). That is a convenience, not a login.

- **Shared Wi-Fi / NAT**: another person on the same public IP may be treated
  as already consented (intro skipped, “already shining” if that IP stored
  coordinates).
- **IP change / mobile networks**: a returning user may look new to the
  server until localStorage answers.
- **VPN / proxy**: the recorded IP may not match the next visit.
- **New device or cleared site data**: localStorage is empty; skip then
  depends only on IP `userConsent`.
- **Private / strict storage**: if `localStorage` throws, only the IP path
  remains.

Do not treat this as an identity or security boundary. It only avoids
repeating the lighthouse splash and GPS prompt for likely-returning visitors.
