'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { latLngToVector3 } from './lat-lng';

export function OwnBeacon({
  latitude,
  longitude,
  radius,
}: {
  latitude: number;
  longitude: number;
  radius: number;
}) {
  const haloRef = useRef<THREE.Mesh>(null);
  const position = useMemo(
    () => latLngToVector3(latitude, longitude, radius * 1.01),
    [latitude, longitude, radius]
  );

  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.35;
    haloRef.current.scale.setScalar(pulse);
    const material = haloRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.4 + Math.sin(clock.elapsedTime * 2) * 0.18;
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.024, 12, 12]} />
        <meshBasicMaterial color="#fffdf5" toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial
          color="#ffca66"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
