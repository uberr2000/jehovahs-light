#!/usr/bin/env node
/**
 * Compact Earth disk must stay ≥ 60% of canvas / viewport height at the
 * default camera distance (vertical FOV height-fill, not width-fit).
 */
const EARTH_RADIUS = 2;
const CAMERA_FOV = 45;
const FILL = 0.72;
const MIN_FILL = 0.6;

function fillHeightCameraDistance(radius, fovDeg, fill) {
  const vFov = (fovDeg * Math.PI) / 180;
  return radius / (fill * Math.tan(vFov / 2));
}

function earthDiskHeightFill(distance, fovDeg, radius = EARTH_RADIUS) {
  const vFov = (fovDeg * Math.PI) / 180;
  return radius / (distance * Math.tan(vFov / 2));
}

function fitCameraDistance(radius, fovDeg, aspect, margin = 1.22) {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const limiting = Math.min(vFov, hFov);
  return (radius / Math.tan(limiting / 2)) * margin;
}

const z = fillHeightCameraDistance(EARTH_RADIUS, CAMERA_FOV, FILL);
const fill = earthDiskHeightFill(z, CAMERA_FOV);
const widthFitZ = fitCameraDistance(EARTH_RADIUS * 1.12, CAMERA_FOV, 390 / 844);
const widthFitFill = earthDiskHeightFill(widthFitZ, CAMERA_FOV);
const pxOn844 = fill * 844;

if (fill < MIN_FILL) {
  console.error(`earth fill ${fill} < ${MIN_FILL} at z=${z}`);
  process.exit(1);
}
if (pxOn844 < 844 * MIN_FILL) {
  console.error(`earth px ${pxOn844} < 60% of 844`);
  process.exit(1);
}
if (widthFitFill >= MIN_FILL) {
  console.error('expected portrait width-fit to stay below the 60% gate');
  process.exit(1);
}

console.log(
  `ok compact z=${z.toFixed(3)} fill=${(fill * 100).toFixed(1)}% (${pxOn844.toFixed(0)}px / 844)`
);
console.log(
  `ok width-fit contrast z=${widthFitZ.toFixed(3)} fill=${(widthFitFill * 100).toFixed(1)}%`
);
