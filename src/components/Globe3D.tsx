'use client';

import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const CAMERA_DISTANCE = 5;
const MOBILE_MAX_WIDTH = '(max-width: 768px)';
const COARSE_POINTER = '(pointer: coarse)';

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

/** Local NASA Blue Marble equirectangular map. See docs/globe-texture.md. */
const EARTH_TEXTURE_PATH = '/globe/earth-blue-marble.jpg';

interface LightPoint {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  created_at: string;
}

interface GlobeProps {
  lightPoints: LightPoint[];
  userLocation?: { latitude: number; longitude: number } | null;
  onGlobeReady?: () => void;
}

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function EarthFallback() {
  return (
    <Sphere args={[2, 32, 32]}>
      <meshBasicMaterial color="#0a1628" />
    </Sphere>
  );
}

// Earth sphere component
function Earth({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const earthMap = useTexture(EARTH_TEXTURE_PATH);

  useEffect(() => {
    onGlobeReady?.();
  }, [onGlobeReady]);

  // Create light points geometry
  const lightPointsGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    lightPoints.forEach((point) => {
      const pos = latLngToVector3(point.latitude, point.longitude, 2.02);
      positions.push(pos.x, pos.y, pos.z);
      colors.push(1.0, 0.85, 0.3);
      sizes.push(0.2);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    return geometry;
  }, [lightPoints]);

  // User location marker
  const userMarkerPos = useMemo(() => {
    if (!userLocation) return null;
    return latLngToVector3(userLocation.latitude, userLocation.longitude, 2.03);
  }, [userLocation]);

  // Slow rotation
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <group>
      {/* Main Earth sphere — unlit local NASA Blue Marble (no day/night terminator) */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshBasicMaterial
          map={earthMap}
          map-colorSpace={THREE.SRGBColorSpace}
          map-anisotropy={8}
        />
      </Sphere>

      {/* Subtle atmospheric rim (not a cloud layer) */}
      <Sphere ref={atmosphereRef} args={[2.08, 64, 64]}>
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Light points on the globe (~1/4 previous visual size) */}
      {lightPoints.length > 0 && (
        <points geometry={lightPointsGeometry}>
          <pointsMaterial
            size={0.015}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Glowing effect for each light point */}
      {lightPoints.slice(0, 80).map((point, index) => (
        <LightGlow
          key={point.created_at || index}
          position={latLngToVector3(point.latitude, point.longitude, 2.02)}
        />
      ))}

      {/* User location special marker */}
      {userMarkerPos && (
        <UserLightMarker position={userMarkerPos} />
      )}
    </group>
  );
}

// Individual light glow effect
function LightGlow({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 2 + position.x * 10) * 0.5 + 0.5;
      meshRef.current.scale.setScalar(0.01 + pulse * 0.005); // ~1/4 of previous 0.04–0.06
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#ffd700"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Special marker for user's own light
function UserLightMarker({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(0.02 + Math.sin(clock.getElapsedTime() * 4) * 0.005);
    }
    if (ringRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
      ringRef.current.scale.setScalar(scale);
      ringRef.current.rotation.z = clock.getElapsedTime();
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.025, 0.0375, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Main Globe3D component
export default function Globe3D({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const lockZoom = useLockGlobeZoom();

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 45 }}>
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <Suspense fallback={<EarthFallback />}>
          <Earth
            lightPoints={lightPoints}
            userLocation={userLocation}
            onGlobeReady={onGlobeReady}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={!lockZoom}
          minDistance={lockZoom ? CAMERA_DISTANCE : 3}
          maxDistance={lockZoom ? CAMERA_DISTANCE : 10}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
