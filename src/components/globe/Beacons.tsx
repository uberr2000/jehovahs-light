'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { latLngToVector3 } from './lat-lng';

const MAX_CAPACITY = 6000;

export type BeaconPoint = {
  latitude: number;
  longitude: number;
};

export function Beacons({
  lamps,
  radius,
}: {
  lamps: BeaconPoint[];
  radius: number;
}) {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const core = coreRef.current;
    const halo = haloRef.current;
    if (!core || !halo) return;

    const count = Math.min(lamps.length, MAX_CAPACITY);
    for (let i = 0; i < count; i++) {
      const point = lamps[i];
      const pos = latLngToVector3(point.latitude, point.longitude, radius * 1.008);
      dummy.position.copy(pos);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      core.setMatrixAt(i, dummy.matrix);
      halo.setMatrixAt(i, dummy.matrix);
    }
    core.count = count;
    halo.count = count;
    core.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
  }, [lamps, radius, dummy]);

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.12;
    if (haloRef.current) haloRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <instancedMesh
        ref={haloRef}
        args={[undefined, undefined, MAX_CAPACITY]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial
          color="#f6a93b"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, MAX_CAPACITY]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshBasicMaterial color="#fff1c9" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
