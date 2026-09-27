# Viewport lock and locales

## Mobile zoom

- Root layout exports a Next.js `viewport` object:
  `width=device-width`, `initial-scale=1`, `maximum-scale=1`, `user-scalable=no`.
  That locks **page** pinch/scale; the layout stays responsive.
- Globe3D OrbitControls: `enableZoom` is on for every viewport (drag rotate
  stays). The globe canvas uses `touch-action: none` so pinch/wheel zoom the
  camera, not the page. Compact viewports (`pointer: coarse` or
  `max-width: 768px`) **frame by vertical FOV**: the Earth disk starts at
  **60–65% of viewport height** on ~390×844 (`COMPACT_EARTH_HEIGHT_FILL
  = 0.62`). Below `lg` the WebGL shell is also **pixel-locked** to the
  visual viewport so R3F cannot stay at the default 300×150 drawing box.
  Portrait width may crop slightly; the sphere stays horizontally
  centered (±5px). Header and bottom chrome stay overlay. Type is **3×
  current develop computed sizes** (see [home-framing.md](home-framing.md)),
  not 3× the old 2rem / 32px scale. Share v1 sits in that overlay and
  does not take flex height from the globe. Zoom range is
  `3.2` … `max(fullFitDistance, 9)`. Desktop still starts around distance 6
  with zoom between 3.2 and 9; header/panel heights are capped. Hint
  copy is `home.rotateHint` (“Drag or zoom…”) in all 14 locale files.
  CI measures both viewports with Playwright (`npm run test:chrome`).

## Locale priority

1. `locale` cookie (user pick in the language selector)
2. SSR `Accept-Language` (when there is no valid cookie)
3. `navigator.language` / `navigator.languages` (client, only if cookie and
   Accept-Language did not resolve)
4. Fallback `zh-TW`

Unmatched tags, including unmatched region variants (`zh-HK`, `zh`, `zh-Hant`),
map to `zh-TW`. Language-only locales still accept regional tags (`es-MX` → `es`,
`ja-JP` → `ja`, `en-US` → `en`). `zh-TW` and `zh-CN` require an exact match.

RTL: `html dir="rtl"` only for `ar`.

Choosing a language writes the `locale` cookie and reloads so SSR matches.
v0 `zh-Hant` copy lives in `zh-TW` messages; detection still does not map
unmatched `zh-Hant` / `zh-HK` onto `zh-TW` as a language match (those
fall through to the `zh-TW` default). Open Graph `og:locale` follows the
active UI locale (`zh_TW`, `en_US`, …). See [metadata.md](metadata.md).

## Supported locales

`en`, `zh-TW`, `zh-CN`, `es`, `pt`, `fr`, `de`, `ja`, `ko`, `ru`, `ar`, `id`,
`th`, `vi`.

Strings live in `src/i18n/messages/*.json` (next-intl). No machine-translate
API and no new backend routes.
