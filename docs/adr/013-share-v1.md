# ADR 013 — Share v1 (frontend-only)

## Status

Accepted (Share v1 on develop).

## Context

The home globe should let visitors invite others without a login gate, short
link service, or new API. The payload must never include precise GPS, lat-lng,
or other PII. The site already has 14 next-intl locales and an existing
locations payload with city/region strings.

## Decision

Share v1 is **frontend-only**:

- Share the **live site URL** (`window.location.origin`, query/hash stripped)
  plus a short **i18n invite** (`home.shareTitle` / `home.shareText`).
- If the visitor has already lit a lamp, optionally append a **city/region
  phrase** from existing location data (POST body city/country, or a nearby
  GET row). Never put coordinates in the URL or the share text.
- **Mobile / compact viewports:** prefer `navigator.share` (title + text +
  url). On cancel or unavailability, fall back to clipboard copy of the same
  payload and a “copied” toast. If clipboard is also blocked, show a compact
  select-to-copy field.
- **Desktop (`lg+`):** copy the same payload. LINE / Facebook / X deep links
  (encoded text + url, new tab) are offered and are optional-ok.
- No new API, database table, short links, tracking pixels, or login gate.

## Reason

Zero backend and zero PII. Web Share covers iOS/Android share sheets; clipboard
and social deep links cover desktop and the gaps where Web Share is missing.

## Consequences

- There is **no share analytics** (no pixels, no click tracking, no short
  links).
- Invite copy lives in the existing **14 locales** under `home.*`.
- The CTA label aligns with the UI: **“Share the light”**.
- Production is untouched by this change (PR targets `develop` only).
