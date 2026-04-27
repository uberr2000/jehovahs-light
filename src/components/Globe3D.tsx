'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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

// Earth sphere component
function Earth({ lightPoints, userLocation, onGlobeReady }: GlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  // Create light points geometry
  const lightPointsGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    
    lightPoints.forEach((point) => {
      const pos = latLngToVector3(point.latitude, point.longitude, 2.02);
      positions.push(pos.x, pos.y, pos.z);
      // Golden yellow color for lights
      colors.push(1.0, 0.85, 0.3);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    return geometry;
  }, [lightPoints]);

  // User location marker
  const userMarkerPos = useMemo(() => {
    if (!userLocation) return null;
    return latLngToVector3(userLocation.latitude, userLocation.longitude, 2.03);
  }, [userLocation]);

  // Subtle rotation
  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  useEffect(() => {
    onGlobeReady?.();
  }, [onGlobeReady]);

  return (
    <group>
      {/* Dark Earth sphere */}
      <Sphere ref={earthRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.1}
          emissive="#0a0a15"
          emissiveIntensity={0.2}
        />
      </Sphere>

      {/* Wireframe overlay for continents effect */}
      <Sphere args={[2.005, 32, 32]}>
        <meshBasicMaterial
          color="#2a2a4e"
          wireframe
          transparent
          opacity={0.15}
        />
      </Sphere>

      {/* Light points on the globe */}
      <points geometry={lightPointsGeometry}>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
        />
      </points>

      {/* Glowing effect for each light point */}
      {lightPoints.map((point, index) => (
        <LightGlow
          key={index}
          position={latLngToVector3(point.latitude, point.longitude, 2.02)}
          isHovered={hoveredPoint === index}
          onHover={() => setHoveredPoint(index)}
          onUnhover={() => setHoveredPoint(null)}
        />
      ))}

      {/* User location special marker */}
      {userMarkerPos && (
        <UserLightMarker position={userMarkerPos} />
      )}

      {/* Ambient and directional lights */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#ffd700" />
    </group>
  );
}

// Individual light glow effect
function LightGlow({ 
  position, 
  isHovered,
  onHover,
  onUnhover 
}: { 
  position: THREE.Vector3; 
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0.05);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Pulsing effect
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.01 + 0.05;
      const targetScale = isHovered ? 0.1 : pulse;
      setScale(scale + (targetScale - scale) * 0.1);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position} onPointerOver={onHover} onPointerOut={onUnhover}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial
        color="#ffd700"
        transparent
        opacity={isHovered ? 0.9 : 0.6}
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
      {/* Inner bright core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Expanding ring effect */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
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
