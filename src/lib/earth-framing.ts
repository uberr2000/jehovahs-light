/** Shared compact-Earth camera math. Keep in sync with Globe3D usage. */

export const EARTH_RADIUS = 2;
export const CAMERA_FOV = 45;
export const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.12;
export const FIT_MARGIN = 1.22;
export const COMPACT_EARTH_HEIGHT_FILL = 0.72;
export const MIN_EARTH_HEIGHT_FILL = 0.6;

/** Distance so a sphere of `radius` fits in the canvas with margin (portrait uses the narrower FOV). */
export function fitCameraDistance(
  radius: number,
  fovDeg: number,
  aspect: number,
  margin = FIT_MARGIN
): number {
  const vFov = (fovDeg * Math.PI) / 180;
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * safeAspect);
  const limiting = Math.min(vFov, hFov);
  return (radius / Math.tan(limiting / 2)) * margin;
}

/**
 * Camera distance so a sphere of `radius` fills `fill` of the vertical FOV
 * (canvas / viewport height). Portrait width is allowed to crop.
 */
export function fillHeightCameraDistance(
  radius: number,
  fovDeg: number,
  fill: number
): number {
  const vFov = (fovDeg * Math.PI) / 180;
  const safeFill = Number.isFinite(fill) && fill > 0 ? fill : COMPACT_EARTH_HEIGHT_FILL;
  return radius / (safeFill * Math.tan(vFov / 2));
}

/** Projected Earth-disk diameter ÷ canvas height at `distance`. */
export function earthDiskHeightFill(
  distance: number,
  fovDeg: number,
  radius = EARTH_RADIUS
): number {
  const vFov = (fovDeg * Math.PI) / 180;
  const safeDistance = Number.isFinite(distance) && distance > 0 ? distance : 1;
  return radius / (safeDistance * Math.tan(vFov / 2));
}

export const COMPACT_CAMERA_DISTANCE = fillHeightCameraDistance(
  EARTH_RADIUS,
  CAMERA_FOV,
  COMPACT_EARTH_HEIGHT_FILL
);

export const COMPACT_MAX_GATE_DISTANCE = fillHeightCameraDistance(
  EARTH_RADIUS,
  CAMERA_FOV,
  MIN_EARTH_HEIGHT_FILL
);
