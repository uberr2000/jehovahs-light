'use client';

import { Suspense, useMemo, useLayoutEffect, useEffect, useState } from 'react';
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

function useLockGlobeZoom() {
  const [lockZoom, setLockZoom] = useState(true);

  useEffect(() => {
    const coarse = window.matchMedia(COARSE_POINTER);
    const narrow = window.matchMedia(MOBILE_MAX_WIDTH);

    const update = () => {
      setLockZoom(coarse.matches || narrow.matches);
    };

    update();
    coarse.addEventListener('change', update);
    narrow.addEventListener('change', update);
    return () => {
      coarse.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return lockZoom;
}

function GlobeOrbitControls({ lockZoom }: { lockZoom: boolean }) {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const fitDistance = useMemo(
    () => fitCameraDistance(ATMOSPHERE_RADIUS, CAMERA_FOV, aspect),
    [aspect]
  );
  const distance = lockZoom ? fitDistance : DESKTOP_CAMERA_DISTANCE;

  useLayoutEffect(() => {
    if (!lockZoom) return;
    camera.position.set(0, 0, distance);
    camera.updateProjectionMatrix();
  }, [camera, distance, lockZoom]);

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={!lockZoom}
      minDistance={lockZoom ? distance : 3.2}
      maxDistance={lockZoom ? distance : 9}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
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
  const lockZoom = useLockGlobeZoom();

  return (
    <div className="h-full w-full">
      <Canvas
        camera={{
          position: [0, lockZoom ? 0 : 0.45, lockZoom ? 8 : DESKTOP_CAMERA_DISTANCE],
          fov: CAMERA_FOV,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#04060e']} />
        <fog attach="fog" args={['#04060e', 7, 14]} />
        <Stars radius={120} depth={60} count={2200} factor={4} saturation={0} fade speed={0.6} />
        <Suspense fallback={<EarthFallback />}>
          <GlobeContent
            lightPoints={lightPoints}
            userLocation={userLocation}
            onGlobeReady={onGlobeReady}
          />
        </Suspense>
        <GlobeOrbitControls lockZoom={lockZoom} />
      </Canvas>
    </div>
  );
}
