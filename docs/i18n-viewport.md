# Viewport lock and locales

## Mobile zoom

- Root layout exports a Next.js `viewport` object:
  `width=device-width`, `initial-scale=1`, `maximum-scale=1`, `user-scalable=no`.
  That locks **page** pinch/scale; the layout stays responsive.
- Globe3D OrbitControls: `enableZoom` is on for every viewport (drag rotate
  stays). The globe canvas uses `touch-action: none` so pinch/wheel zoom the
  camera, not the page. Compact viewports (`pointer: coarse` or
  `max-width: 768px`) **frame by vertical FOV**: the Earth disk starts at
  ~72% of canvas height (`fillHeightCameraDistance`, camera `z` ≈ 6.7).
  Portrait width may crop; the old min(h/v FOV) fit is only the zoom-out
  max so the full sphere stays reachable. That keeps the rendered disk
  ≥ 60% of viewport height on ~390×844. Below `lg`, header and bottom
  chrome overlay the canvas so they do not shrink the pane. Zoom range is
  `3.2` … `max(fullFitDistance, 9)`. Desktop still starts around distance 6
  with zoom between 3.2 and 9. Hint copy is `home.rotateHint`
  (“Drag or zoom…”) in all 14 locale files.

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
v0 `zh-Hant` copy lives in `zh-TW` messages; detection still does not map
unmatched `zh-Hant` / `zh-HK` to `zh-TW` (those fall back to `en`).

## Supported locales

`en`, `zh-TW`, `zh-CN`, `es`, `pt`, `fr`, `de`, `ja`, `ko`, `ru`, `ar`, `id`,
`th`, `vi`.

Strings live in `src/i18n/messages/*.json` (next-intl). No machine-translate
API and no new backend routes.
