# Viewport lock and locales

## Mobile zoom

- Root layout exports a Next.js `viewport` object:
  `width=device-width`, `initial-scale=1`, `maximum-scale=1`, `user-scalable=no`.
- Layout stays responsive; users cannot pinch-shrink the page.
- Globe3D OrbitControls: `enableZoom` is off when `(pointer: coarse)` or
  `max-width: 768px`. Mobile camera distance is computed from canvas
  aspect and 45° FOV so the full sphere + atmosphere fits in the 60vh
  canvas (about 7–8 units in portrait) and stays fixed. Desktop still
  starts at 5 with zoom between 3 and 10.

## Locale priority

1. `locale` cookie (user pick in the language selector)
2. SSR `Accept-Language` (when there is no valid cookie)
3. `navigator.language` / `navigator.languages` (client, only if cookie and
   Accept-Language did not resolve)
4. Fallback `en`

Unmatched tags, including unmatched region variants (`zh-HK`, `zh`, `zh-Hant`),
map to `en`. Language-only locales still accept regional tags (`es-MX` → `es`,
`ja-JP` → `ja`, `en-US` → `en`). `zh-TW` and `zh-CN` require an exact match.

RTL: `html dir="rtl"` only for `ar`.

Choosing a language writes the `locale` cookie and reloads so SSR matches.
The lighthouse intro is not replayed in the same tab (`sessionStorage`).

## Supported locales

`en`, `zh-TW`, `zh-CN`, `es`, `pt`, `fr`, `de`, `ja`, `ko`, `ru`, `ar`, `id`,
`th`, `vi`.

Strings live in `src/i18n/messages/*.json` (next-intl). No machine-translate
API and no new backend routes.
