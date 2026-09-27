# Home framing and chrome type (QA acceptance)

These gates apply to the production build of `/` after the intro splash
is dismissed (`sessionStorage jl-intro-entered=1`). QA and CI measure
with headless Chromium at **390×844** and **1440×900**.

`scripts/measure-home-chrome.mjs` (`npm run test:chrome`) is the
authoritative render check. The arithmetic `npm run test:framing` is
only a camera-math sanity check and is **not** sufficient on its own.

## 1. Earth disk (390×844)

- Rendered globe **diameter in CSS pixels** is **60–65% of viewport
  height** (506–549px on 844px).
- Horizontal **center is within ±5px** of the viewport midline.
- Slight left/right cropping is allowed. Top/bottom must not clip the
  sphere off-screen.
- Compact camera uses vertical-FOV height-fill
  (`COMPACT_EARTH_HEIGHT_FILL = 0.62` in `src/lib/earth-framing.ts`).
  Below `lg`, the WebGL shell is pixel-locked to the visual viewport
  so R3F cannot stay at the default 300×150 drawing box.

Desktop (1440×900) keeps the existing distance-6 in-flow globe. The
header and side panel are height-capped so that layout cannot steal
globe height the way a 998px wrapping title did.

## 2. Type = 3× current develop (±10%)

Develop computed sizes (16px root), confirmed from Tailwind classes
on `origin/develop`:

| Chrome | Mobile develop | ×3 target | Desktop develop | ×3 target |
| --- | ---: | ---: | ---: | ---: |
| Brand | 16 (`1rem`) | ≤48, one line | 18 (`1.125rem`) | 54 |
| Tagline | 12 (`0.75rem`) | 36 | 14 (`0.875rem`) | 42 |
| CTA | 18 (`1.125rem`) | 54 | 18 | 54 |
| Count | 32 (`2rem`) | 96 | 48 (`3rem`) | 144 |
| Label | 12 (`text-xs`) | 36 | 14 (`0.875rem`) | 42 |
| Hint | 12 (`text-xs`) | 36 | 16 (`1rem`) | 48 |

Brand **must stay a single line** (element height ≤ one line-height).
It may shrink below 48px to fit long locales such as English
“Light Up the Earth”. Do **not** 3× the old pre-#19 2rem / 32px
scale (that produced a 96px title and a 998px header).

Sizes live in document-inlined `HOME_CRITICAL_CSS`
(`src/app/home-critical.ts`), not only hashed Tailwind rem utilities.

## 3. No overlap, CTA on screen

At both 390×844 and 1440×900:

- Boxes for **header, CTA, count, hint, and share row** do not overlap.
- The CTA is fully on screen (`y ≥ 0`, bottom inside the viewport),
  clickable (`elementFromPoint` hits the button), and not clipped.
- Header max-height is capped (mobile ≤ 8.5rem, desktop ≤ 7.5rem).
- Desktop side panel `max-height: 100%` + `overflow-y: auto` so it
  cannot push the globe off-screen.

## 4. CI

`.github/workflows/ci.yml` job `lint-and-build` runs
`npx playwright install --with-deps chromium` then
`npm run test:chrome` after `npm run build` (standalone tree).
The `deploy-develop` job still `needs: lint-and-build` and still
runs `deploy/check-app-url.sh` on the host. `deploy/` scripts are
not changed by this work.

Production / `main` is out of scope.
