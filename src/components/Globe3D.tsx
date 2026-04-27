'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

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

// Procedural Earth texture with continents (lighter version)
function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Lighter ocean background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a2a4a');
  gradient.addColorStop(0.5, '#1e3a5a');
  gradient.addColorStop(1, '#1a2a4a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continent data (lighter greens and browns)
  const continents: { color: string; glowColor: string; points: [number, number][] }[] = [
    // North America
    {
      color: '#2d5a2d',
      glowColor: '#4a8a4a',
      points: [
        [180, 100], [280, 80], [380, 100], [420, 180], [400, 280],
        [320, 350], [240, 380], [160, 340], [140, 260], [160, 180]
      ]
    },
    // South America
    {
      color: '#2d6a2d',
      glowColor: '#4a9a4a',
      points: [
        [380, 420], [440, 400], [500, 450], [520, 550], [480, 700],
        [420, 780], [360, 750], [340, 650], [350, 550], [360, 480]
      ]
    },
    // Europe
    {
      color: '#3a5a3a',
      glowColor: '#5a8a5a',
      points: [
        [900, 120], [1000, 100], [1080, 130], [1100, 200], [1040, 260],
        [960, 280], [900, 240], [880, 180]
      ]
    },
    // Africa
    {
      color: '#4a6a3a',
      glowColor: '#6a9a5a',
      points: [
        [920, 320], [1020, 300], [1100, 350], [1140, 450], [1120, 580],
        [1040, 680], [960, 660], [900, 580], [880, 450], [890, 380]
      ]
    },
    // Asia
    {
      color: '#3a5a3a',
      glowColor: '#5a8a5a',
      points: [
        [1100, 80], [1300, 60], [1500, 100], [1700, 150], [1800, 250],
        [1780, 350], [1680, 400], [1500, 380], [1340, 340], [1200, 280],
        [1120, 200], [1100, 140]
      ]
    },
    // Australia
    {
      color: '#5a5a2d',
      glowColor: '#8a8a4a',
      points: [
        [1520, 580], [1640, 560], [1720, 600], [1740, 700], [1680, 760],
        [1560, 750], [1500, 700], [1500, 640]
      ]
    },
    // Antarctica
    {
      color: '#4a5a6a',
      glowColor: '#7a8a9a',
      points: [
        [0, 920], [300, 900], [600, 920], [900, 900], [1200, 920],
        [1500, 900], [1800, 920], [2048, 920], [2048, 1024],
        [0, 1024], [0, 920]
      ]
    },
    // Greenland
    {
      color: '#5a6a7a',
      glowColor: '#8a9aaa',
      points: [
        [520, 40], [620, 30], [680, 60], [680, 140], [620, 180],
        [540, 160], [500, 100]
      ]
    }
  ];

  // Draw continents
  continents.forEach(continent => {
    // Fill
    ctx.fillStyle = continent.color;
    ctx.beginPath();
    continent.points.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point[0], point[1]);
      else ctx.lineTo(point[0], point[1]);
    });
    ctx.closePath();
    ctx.fill();

    // Glow effect (border)
    ctx.strokeStyle = continent.glowColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  // Add subtle noise
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Earth sphere component
function Earth({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const [earthTexture, setEarthTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const texture = createEarthTexture();
    setEarthTexture(texture);
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
      sizes.push(0.8);
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
      {/* Main Earth sphere with texture */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.6}
          metalness={0.2}
          emissive="#152535"
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Atmosphere glow */}
      <Sphere ref={atmosphereRef} args={[2.08, 64, 64]}>
        <meshBasicMaterial
          color="#3a6aaa"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Grid lines */}
      <Sphere args={[2.001, 36, 18]}>
        <meshBasicMaterial
          color="#2a4a6a"
          wireframe
          transparent
          opacity={0.2}
        />
      </Sphere>

      {/* Light points on the globe */}
      {lightPoints.length > 0 && (
        <points geometry={lightPointsGeometry}>
          <pointsMaterial
            size={0.06}
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

      {/* Lighting - brighter */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} color="#6a8aba" />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffd700" />
    </group>
  );
}

// Individual light glow effect
function LightGlow({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 2 + position.x * 10) * 0.5 + 0.5;
      meshRef.current.scale.setScalar(0.04 + pulse * 0.02);
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
      meshRef.current.scale.setScalar(0.08 + Math.sin(clock.getElapsedTime() * 4) * 0.02);
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
        <ringGeometry args={[0.1, 0.15, 32]} />
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
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <Earth
          lightPoints={lightPoints}
          userLocation={userLocation}
          onGlobeReady={onGlobeReady}
        />
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
