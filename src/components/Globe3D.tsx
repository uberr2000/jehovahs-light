'use client';

import { Suspense, useMemo, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { Beacons, type BeaconPoint } from './globe/Beacons';
import { Earth } from './globe/Earth';
import { OwnBeacon } from './globe/OwnBeacon';
import {
  ATMOSPHERE_RADIUS,
  CAMERA_FOV,
  COMPACT_CAMERA_DISTANCE,
  COMPACT_MAX_GATE_DISTANCE,
  EARTH_RADIUS,
  earthDiskHeightFill,
  fitCameraDistance,
} from '@/lib/earth-framing';

const DESKTOP_CAMERA_DISTANCE = 6;
const MIN_ZOOM_DISTANCE = 3.2;
const DESKTOP_MAX_ZOOM_DISTANCE = 9;
const MOBILE_MAX_WIDTH = '(max-width: 768px)';
const COARSE_POINTER = '(pointer: coarse)';
const LG_MIN_WIDTH = 1024;

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

/** Pin the WebGL shell to the visual viewport so it cannot stay at canvas default 300×150. */
function useViewportCanvasBox() {
  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const apply = () => {
      // Pixel-lock only below `lg`. Coarse pointers on a wide desktop must
      // keep the in-flow globe pane (do not cover the glass card).
      const narrow = window.innerWidth < LG_MIN_WIDTH;
      if (narrow) {
        const w = Math.round(window.visualViewport?.width ?? window.innerWidth);
        const h = Math.round(window.visualViewport?.height ?? window.innerHeight);
        el.style.position = 'absolute';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = `${Math.max(w, 1)}px`;
        el.style.height = `${Math.max(h, 1)}px`;
      } else {
        el.style.position = '';
        el.style.top = '';
        el.style.left = '';
        el.style.width = '100%';
        el.style.height = '100%';
      }
    };

    apply();
    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    const ro = new ResizeObserver(apply);
    ro.observe(document.documentElement);
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      ro.disconnect();
    };
  }, []);

  return shellRef;
}

function GlobeOrbitControls({ compact }: { compact: boolean }) {
  const { camera, size } = useThree();
  const controlsRef = useRef<{ target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null>(
    null
  );
  const userAdjustedRef = useRef(false);
  const lastBoxRef = useRef({ w: 0, h: 0 });
  const aspect = size.width / Math.max(size.height, 1);
  const fullFitDistance = useMemo(
    () => fitCameraDistance(ATMOSPHERE_RADIUS, CAMERA_FOV, aspect),
    [aspect]
  );
  const compactFrameDistance = Math.min(COMPACT_CAMERA_DISTANCE, COMPACT_MAX_GATE_DISTANCE);
  const maxDistance = compact
    ? Math.max(fullFitDistance, DESKTOP_MAX_ZOOM_DISTANCE, compactFrameDistance)
    : DESKTOP_MAX_ZOOM_DISTANCE;

  const applyFrame = (distance: number, y = 0) => {
    camera.position.set(0, y, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  useLayoutEffect(() => {
    const boxChanged =
      lastBoxRef.current.w !== size.width || lastBoxRef.current.h !== size.height;
    lastBoxRef.current = { w: size.width, h: size.height };

    if (!compact) {
      applyFrame(DESKTOP_CAMERA_DISTANCE, 0.45);
      userAdjustedRef.current = false;
      return;
    }

    if (size.height < 2) return;
    if (userAdjustedRef.current && !boxChanged) return;
    if (boxChanged) userAdjustedRef.current = false;
    applyFrame(compactFrameDistance, 0);
    // applyFrame reads the latest camera / controls; size + compact are the triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frame when the drawing box changes
  }, [camera, compact, compactFrameDistance, size.height, size.width]);

  return (
    <OrbitControls
      ref={controlsRef}
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
      onStart={() => {
        userAdjustedRef.current = true;
      }}
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

export { earthDiskHeightFill };

export default function Globe3D({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const compact = useCompactGlobeView();
  const shellRef = useViewportCanvasBox();

  return (
    <div
      ref={shellRef}
      className="home-globe-canvas h-full w-full touch-none"
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas
        camera={{
          position: [0, compact ? 0 : 0.45, compact ? COMPACT_CAMERA_DISTANCE : DESKTOP_CAMERA_DISTANCE],
          fov: CAMERA_FOV,
        }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        resize={{ debounce: 0, scroll: false }}
        style={{ width: '100%', height: '100%', display: 'block' }}
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
