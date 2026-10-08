'use client';

import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface CarState {
  rotY: number;
  rotX: number;
  posX: number;
  posY: number;
  posZ: number;
  camX: number;
  camY: number;
  camZ: number;
  fov: number;
}

const KEYFRAMES: CarState[] = [

  { rotY: -Math.PI * 0.08, rotX: 0.02,  posX: 0.35,  posY: 0.6,   posZ: 0,   camX: 0,  camY: 0.4, camZ: 4.8, fov: 36 },

  { rotY:  Math.PI * 0.5,  rotX: 0.02,  posX: 0.8,   posY: 0.6,   posZ: 0,   camX: 0,  camY: 0.4, camZ: 4.5, fov: 34 },

  { rotY:  Math.PI * 1.05, rotX: 0.02,  posX: -0.8,  posY: 0.4,   posZ: 0,   camX: 0,  camY: 0.4, camZ: 4.5, fov: 34 },

  { rotY:  Math.PI * 1.52, rotX: 0.18,  posX: 0.9,   posY: 0.1,   posZ: 0,   camX: 0,  camY: 0.8, camZ: 4.4, fov: 38 },

  { rotY:  Math.PI * 1.88, rotX: 0.06,  posX: 1.5,   posY: -0.5,  posZ: 0.15, camX: 0, camY: 0.25, camZ: 3.8, fov: 30 },
];

function getKeyframeState(t: number): CarState {
  const clamped = Math.max(0, Math.min(1, t));
  const total = KEYFRAMES.length - 1;
  const raw = clamped * total;
  const i = Math.min(Math.floor(raw), total - 1);
  const frac = easeInOutCubic(raw - i);
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[i + 1];
  return {
    rotY: lerp(a.rotY, b.rotY, frac),
    rotX: lerp(a.rotX, b.rotX, frac),
    posX: lerp(a.posX, b.posX, frac),
    posY: lerp(a.posY, b.posY, frac),
    posZ: lerp(a.posZ, b.posZ, frac),
    camX: lerp(a.camX, b.camX, frac),
    camY: lerp(a.camY, b.camY, frac),
    camZ: lerp(a.camZ, b.camZ, frac),
    fov:  lerp(a.fov,  b.fov,  frac),
  };
}

function KoenigseggModel({ scrollProgress, isDark }: { scrollProgress: number; isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const current = useRef<CarState>({ ...KEYFRAMES[0] });

  let obj: THREE.Group | undefined;
  try {
    obj = useLoader(OBJLoader, '/3d/82-koenigsegg-agera/uploads_files_2792345_Koenigsegg.obj') as THREE.Group;
  } catch {
    obj = undefined;
  }

  useEffect(() => {
    if (!obj) return;
    const carColor = isDark === false ? '#383839' : '#0c1511';
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(carColor),
          metalness: 0.94,
          roughness: isDark === false ? 0.1 : 0.05,
          envMapIntensity: isDark === false ? 1.8 : 1.5,
        });
        (child as THREE.Mesh).castShadow = true;
      }
    });
  }, [obj, isDark]);

  useEffect(() => {
    if (!obj) return;
    
    // Only scale if it hasn't been scaled down yet, or reset scale to 1 to compute
    obj.scale.set(1, 1, 1);
    obj.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const scale = 2 / Math.max(size.x, size.y, size.z);
    obj.scale.setScalar(scale);
    obj.position.sub(center.multiplyScalar(scale));
  }, [obj]);

  useFrame((_s, delta) => {
    if (!groupRef.current) return;
    const target = getKeyframeState(scrollProgress);
    const alpha = 1 - Math.pow(0.028, delta * 60);

    current.current.rotY  = lerp(current.current.rotY,  target.rotY,  alpha);
    current.current.rotX  = lerp(current.current.rotX,  target.rotX,  alpha);
    current.current.posX  = lerp(current.current.posX,  target.posX,  alpha);
    current.current.posY  = lerp(current.current.posY,  target.posY,  alpha);
    current.current.posZ  = lerp(current.current.posZ,  target.posZ,  alpha);
    current.current.camX  = lerp(current.current.camX,  target.camX,  alpha);
    current.current.camY  = lerp(current.current.camY,  target.camY,  alpha);
    current.current.camZ  = lerp(current.current.camZ,  target.camZ,  alpha);
    current.current.fov   = lerp(current.current.fov,   target.fov,   alpha);

    groupRef.current.rotation.y = current.current.rotY;
    groupRef.current.rotation.x = current.current.rotX;
    groupRef.current.position.set(current.current.posX, current.current.posY, current.current.posZ);

    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(current.current.camX, current.current.camY, current.current.camZ);
    cam.fov = current.current.fov;
    cam.updateProjectionMatrix();
  });

  if (!obj) return <FallbackCar scrollProgress={scrollProgress} isDark={isDark} />;

  return (
    <group ref={groupRef}>
      <primitive object={obj} />
    </group>
  );
}

function FallbackCar({ scrollProgress, isDark }: { scrollProgress: number; isDark?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const current = useRef<CarState>({ ...KEYFRAMES[0] });

  useFrame((_s, delta) => {
    if (!groupRef.current) return;
    const target = getKeyframeState(scrollProgress);
    const alpha = 1 - Math.pow(0.028, delta * 60);
    current.current.rotY  = lerp(current.current.rotY,  target.rotY,  alpha);
    current.current.rotX  = lerp(current.current.rotX,  target.rotX,  alpha);
    current.current.posX  = lerp(current.current.posX,  target.posX,  alpha);
    current.current.posY  = lerp(current.current.posY,  target.posY,  alpha);
    current.current.camY  = lerp(current.current.camY,  target.camY,  alpha);
    current.current.camZ  = lerp(current.current.camZ,  target.camZ,  alpha);
    current.current.fov   = lerp(current.current.fov,   target.fov,   alpha);

    groupRef.current.rotation.y = current.current.rotY;
    groupRef.current.rotation.x = current.current.rotX;
    groupRef.current.position.set(current.current.posX, current.current.posY, 0);

    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, current.current.camY, current.current.camZ);
    cam.fov = current.current.fov;
    cam.updateProjectionMatrix();
  });

  const bodyColor = isDark === false ? '#383839' : '#0c1511';
  const cabinColor = isDark === false ? '#24242a' : '#0f0f13';

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.75, 0.075, 0.3]} />
        <meshStandardMaterial color={bodyColor} metalness={0.96} roughness={0.04} />
      </mesh>
      <mesh position={[0.03, 0.08, 0]} castShadow>
        <boxGeometry args={[0.32, 0.08, 0.25]} />
        <meshStandardMaterial color={cabinColor} metalness={0.92} roughness={0.08} />
      </mesh>
      <mesh position={[0.23, 0.025, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.18, 0.02, 0.25]} />
        <meshStandardMaterial color={bodyColor} metalness={0.96} roughness={0.04} />
      </mesh>
      <mesh position={[-0.31, 0, 0]} rotation={[0, 0, 0.19]}>
        <boxGeometry args={[0.1, 0.02, 0.3]} />
        <meshStandardMaterial color="#E8400C" metalness={0.55} roughness={0.18} />
      </mesh>
      {([
        [0.29, -0.05, 0.155],
        [0.29, -0.05, -0.155],
        [-0.29, -0.05, 0.155],
        [-0.29, -0.05, -0.155],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 28]} />
          <meshStandardMaterial color="#060609" metalness={0.88} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.75, 0.004, 0.008]} />
        <meshStandardMaterial color="#E8400C" metalness={0.4} roughness={0.1} emissive="#E8400C" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

export function LoadingScreen() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setN(c => Math.min(c + 7, 99)), 120);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="fixed inset-0 z-[300] bg-[#070709] flex flex-col items-center justify-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#F3F4F6]/20 mb-6">
        DOWNLOADING ASSET
      </p>
      <div
        className="font-display font-black uppercase text-[#F3F4F6] tracking-tight leading-none mb-12"
        style={{ fontSize: 'clamp(60px, 10vw, 140px)' }}
      >
        APEX<span style={{ color: '#E8400C' }}>LEARN</span>
      </div>
      <div className="relative w-64 h-px bg-[#1c1c22]">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${n}%`, background: '#E8400C', transition: 'width 0.12s linear' }}
        />
      </div>
      <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.28em] text-[#F3F4F6]/18">
        {String(n).padStart(3, '0')} %
      </p>
    </div>
  );
}

export interface KoenigseggCanvasProps {
  scrollProgress: number;
  isDark?: boolean;
}

export function KoenigseggCanvas({ scrollProgress, isDark = true }: KoenigseggCanvasProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.8], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={isDark ? 0.35 : 0.65} />
        <directionalLight position={[4, 6, 3]} intensity={isDark ? 2.0 : 2.5} color={isDark ? '#ffffff' : '#fff7f0'} castShadow />
        <directionalLight position={[-5, 2, -4]} intensity={isDark ? 0.6 : 0.8} color="#FF6B3D" />
        <pointLight position={[0, -1, 3]} intensity={isDark ? 0.7 : 0.9} color="#E8400C" />
        <spotLight position={[0, 9, 1]} angle={0.35} penumbra={0.7} intensity={isDark ? 1.6 : 2.0} castShadow />

        <Suspense fallback={null}>
          <KoenigseggModel scrollProgress={scrollProgress} isDark={isDark} />
          <Environment preset="studio" />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
