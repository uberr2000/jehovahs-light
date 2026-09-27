# Home framing and chrome type (QA acceptance)

These gates apply to the production build of `/` after the intro splash
is dismissed by **clicking Enter** (`[data-testid=intro-enter]`). CI must
not skip the splash with `sessionStorage jl-intro-entered`. QA and CI
measure with headless Chromium at **390×844** and **1440×900**, for
**both `en` and `zh-TW`**.

`scripts/measure-home-chrome.mjs` (`npm run test:chrome`) is the
authoritative render check. The arithmetic `npm run test:framing` is
only a camera-math sanity check and is **not** sufficient on its own.

## 1. Earth disk (390×844)

- Rendered globe **diameter in CSS pixels** is **60–65% of viewport
  height** (506–549px on 844px).
- Horizontal **center is within ±5px** of the viewport midline,
  measured on the **rendered globe / atmosphere limb**
  (`medianCenterX` of rows whose both edges are visible), not the
  canvas midpoint.
- Slight left/right cropping is allowed. Top/bottom must not clip the
  sphere off-screen.
- Compact camera uses vertical-FOV height-fill
  (`COMPACT_EARTH_HEIGHT_FILL = 0.62` in `src/lib/earth-framing.ts`).
  Below `lg`, the WebGL shell is pixel-locked to the visual viewport
  so R3F cannot stay at the default 300×150 drawing box.

Desktop (1440×900) keeps the existing distance-6 in-flow globe. Header
and side panel stay in normal flow (`overflow: visible`) so they cannot
steal globe height the way a 998px wrapping title did, and they must
not clip type.

## 2. Type = 3× current develop (±10%)

Develop computed sizes (16px root), confirmed from Tailwind classes
on `origin/develop`. Constants live in `src/lib/home-chrome.ts` and
are interpolated into document-inlined `HOME_CRITICAL_CSS`.

| Chrome | Mobile develop | ×3 target | Desktop develop | ×3 target |
| --- | ---: | ---: | ---: | ---: |
| Brand | 16 (`1rem`) | ≤48, one line | 18 (`1.125rem`) | 54 (`HOME_BRAND_DESKTOP_PX`) |
| Tagline | 12 (`0.75rem`) | 36 | 14 (`0.875rem`) | 42 |
| CTA | 18 (`1.125rem`) | 54 | 18 | 54 |
| Count | 32 (`2rem`) | 96 | 48 (`3rem`) | 144 |
| Label | 12 (`text-xs`) | 36 | 14 (`0.875rem`) | 42 |
| Hint | 12 (`text-xs`) | 36 | 16 (`1rem`) | 48 |

Brand **must stay a single line** (element height ≤ one line-height).
`FitSingleLine` shrinks until `scrollWidth <= clientWidth` with an 8px
safety margin. Long locales such as English “Light Up the Earth” may
go below 48px. Desktop brand is **54px** (`HOME_BRAND_DESKTOP_PX`); a
possible 48px desktop cap is a product decision and that constant is
the only place to change it.

Tagline and hint may wrap. On 390-wide they may also shrink below 3×
(like the brand) if wrapping at 3× would clip or overlap. They must
**never** be clipped. Do **not** 3× the old pre-#19 2rem / 32px scale
(that produced a 96px title and a 998px header).

Sizes live in document-inlined `HOME_CRITICAL_CSS`
(`src/app/home-critical.ts`), not only hashed Tailwind rem utilities.

## 3. No clipping, no overlap, CTA on screen

**No-clipping rule:** brand, tagline, CTA, count, label, and hint must
be fully visible at both viewports and both locales.

- Do **not** put `max-height` + `overflow: hidden` (or `clip`) on the
  header, tagline, hint, or bottom chrome. Those caps previously showed
  only ~53% of the mobile-en tagline, ~48% of mobile zh-TW, ~71% of
  desktop tagline, and ~58% / ~27% of the hint.
- `scrollWidth <= clientWidth + 1` and `scrollHeight <= clientHeight + 1`
  on each of those elements. The same inequality must hold on any
  ancestor whose `overflow` / `overflow-x` / `overflow-y` is `hidden`
  or `clip` whenever that ancestor would cut this element.
- The visible rect must not be smaller than the content rect
  (visible ratio 100% on width, height, and area).
- Boxes for **header, CTA, count, hint, and share row** do not overlap.
- The CTA is fully on screen (`y ≥ 0`, bottom inside the viewport),
  clickable (`elementFromPoint` hits the button), and not clipped.

The `home-shell` viewport lock (`overflow: hidden` on the 100dvh
stage) is not a type cap: chrome must stay inside that stage by
sizing/wrapping/shrinking, never by clipping ink.

## 4. CI

`.github/workflows/ci.yml` job `lint-and-build` runs
`npx playwright install --with-deps chromium` then
`npm run test:chrome` after `npm run build` (standalone tree).
The measure script:

- clicks Enter on the intro splash (no sessionStorage bypass);
- runs **en** and **zh-TW** at **390×844** and **1440×900**;
- centers the globe using the atmosphere-limb median, not the canvas
  midpoint;
- fails on clip / visible-ratio / overlap / off-screen CTA / mobile
  globe outside 60–65% VH.

The `deploy-develop` job still `needs: lint-and-build` and still
runs `deploy/check-app-url.sh` on the host. `deploy/` scripts are
not changed by this work.

Production / `main` is out of scope.
