'use client';

import { Suspense, useMemo, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { Beacons, type BeaconPoint } from './globe/Beacons';
import { Earth } from './globe/Earth';
import { OwnBeacon } from './globe/OwnBeacon';

const DESKTOP_CAMERA_DISTANCE = 6;
const CAMERA_FOV = 45;
const EARTH_RADIUS = 2;
const ATMOSPHERE_RADIUS = EARTH_RADIUS * 1.12;
const FIT_MARGIN = 1.22;
const MIN_ZOOM_DISTANCE = 3.2;
const DESKTOP_MAX_ZOOM_DISTANCE = 9;
/** Compact default: Earth disk as a fraction of canvas height. Must stay ≥ 0.6. */
const COMPACT_EARTH_HEIGHT_FILL = 0.72;
const MIN_EARTH_HEIGHT_FILL = 0.6;
const MOBILE_MAX_WIDTH = '(max-width: 768px)';
const COARSE_POINTER = '(pointer: coarse)';

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

const COMPACT_CAMERA_DISTANCE = fillHeightCameraDistance(
  EARTH_RADIUS,
  CAMERA_FOV,
  COMPACT_EARTH_HEIGHT_FILL
);
const COMPACT_MAX_GATE_DISTANCE = fillHeightCameraDistance(
  EARTH_RADIUS,
  CAMERA_FOV,
  MIN_EARTH_HEIGHT_FILL
);

function useCompactGlobeView() {
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const coarse = window.matchMedia(COARSE_POINTER);
    const narrow = window.matchMedia(MOBILE_MAX_WIDTH);

    const update = () => {
      setCompact(coarse.matches || narrow.matches);
    };

    update();
    coarse.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      coarse.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return compact;
}

function GlobeOrbitControls({ compact }: { compact: boolean }) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const fullFitDistance = useMemo(
    () => fitCameraDistance(ATMOSPHERE_RADIUS, CAMERA_FOV, aspect),
    [aspect]
  );
  // Portrait width-fit pulls the camera too far (Earth disk ~width/height, well
  // below the 60% height gate). Frame compact views by vertical fill instead.
  const compactFrameDistance = Math.min(COMPACT_CAMERA_DISTANCE, COMPACT_MAX_GATE_DISTANCE);
  const maxDistance = compact
    ? Math.max(fullFitDistance, DESKTOP_MAX_ZOOM_DISTANCE, compactFrameDistance)
    : DESKTOP_MAX_ZOOM_DISTANCE;
  const framedRef = useRef(false);

  useLayoutEffect(() => {
    if (!compact) {
      if (framedRef.current) {
        camera.position.set(0, 0.45, DESKTOP_CAMERA_DISTANCE);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        framedRef.current = false;
      }
      return;
    }
    if (framedRef.current) return;
    camera.position.set(0, 0, compactFrameDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    framedRef.current = true;
  }, [camera, compact, compactFrameDistance]);

  return (
    <OrbitControls
      enablePan={false}
      enableZoom
      minDistance={MIN_ZOOM_DISTANCE}
      maxDistance={maxDistance}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.7}
      autoRotate
      autoRotateSpeed={0.35}
    />
  );
}

export type GlobeLightPoint = BeaconPoint;

interface GlobeProps {
  lightPoints: GlobeLightPoint[];
  userLocation?: { latitude: number; longitude: number } | null;
  onGlobeReady?: () => void;
}

function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshBasicMaterial color="#0a1628" />
    </mesh>
  );
}

function GlobeContent({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const ownLat = userLocation?.latitude;
  const ownLng = userLocation?.longitude;
  const beacons = useMemo(() => {
    if (ownLat == null || ownLng == null) return lightPoints;
    return lightPoints.filter(
      (point) =>
        Math.abs(point.latitude - ownLat) > 0.05 || Math.abs(point.longitude - ownLng) > 0.05
    );
  }, [lightPoints, ownLat, ownLng]);

  return (
    <>
      <Earth radius={EARTH_RADIUS} onReady={onGlobeReady} />
      <Beacons lamps={beacons} radius={EARTH_RADIUS} />
      {ownLat != null && ownLng != null ? (
        <OwnBeacon latitude={ownLat} longitude={ownLng} radius={EARTH_RADIUS} />
      ) : null}
    </>
  );
}

export default function Globe3D({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const compact = useCompactGlobeView();

  return (
    <div className="h-full w-full touch-none">
      <Canvas
        camera={{
          position: [0, compact ? 0 : 0.45, compact ? COMPACT_CAMERA_DISTANCE : DESKTOP_CAMERA_DISTANCE],
          fov: CAMERA_FOV,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#04060e']} />
        <Stars
          radius={55}
          depth={35}
          count={8000}
          factor={7}
          saturation={0}
          fade
          speed={0.4}
        />
        <Suspense fallback={<EarthFallback />}>
          <GlobeContent
            lightPoints={lightPoints}
            userLocation={userLocation}
            onGlobeReady={onGlobeReady}
          />
        </Suspense>
        <GlobeOrbitControls compact={compact} />
      </Canvas>
    </div>
  );
}
