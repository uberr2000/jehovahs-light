'use client';

import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/** Local NASA Blue Marble equirectangular map. See docs/globe-texture.md. */
export const EARTH_TEXTURE_PATH = '/globe/earth-blue-marble.jpg';

/**
 * Land RGB scale vs the v0-tuned contrast lift on develop (PR #10).
 * `1` keeps that look; `0.5` halves land luminance. Sea mix is unchanged.
 */
export const LAND_LUMINANCE_FACTOR = 0.5;

/**
 * After drei/three samples the map, lift vegetated/desert land and ice, and
 * darken blue water so continents read clearly brighter than the ocean.
 * Land is then scaled by {@link LAND_LUMINANCE_FACTOR} (reversible).
 */
const LAND_SEA_MAP_FRAGMENT = /* glsl */ `
#include <map_fragment>
float luma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
float blueExcess = diffuseColor.b - max(diffuseColor.r, diffuseColor.g);
float water = smoothstep(-0.05, 0.06, blueExcess);
water *= 1.0 - smoothstep(0.58, 0.78, luma);
vec3 land = min(diffuseColor.rgb * vec3(1.55, 1.38, 1.10) + vec3(0.10, 0.08, 0.03), vec3(1.0));
land *= ${LAND_LUMINANCE_FACTOR.toFixed(2)};
vec3 sea = diffuseColor.rgb * vec3(0.16, 0.28, 0.50);
diffuseColor.rgb = mix(land, sea, water);
`;

export function Earth({
  radius = 2,
  onReady,
}: {
  radius?: number;
  onReady?: () => void;
}) {
  const earthMap = useTexture(EARTH_TEXTURE_PATH, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  });

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({ map: earthMap });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        LAND_SEA_MAP_FRAGMENT
      );
    };
    mat.customProgramCacheKey = () =>
      `earth-land-sea-contrast-v2-land-${LAND_LUMINANCE_FACTOR}`;
    return mat;
  }, [earthMap]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[radius, 96, 96]} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#f2b45a" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#e79a3c" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
