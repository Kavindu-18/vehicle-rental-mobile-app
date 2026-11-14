import { useFrame } from '@react-three/fiber/native';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BodyStyle } from '@/data/types';
import { PROFILES, type Pt } from './profiles';

function extrude(points: Pt[], depth: number, bevel: number) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function Wheel({ r, position, spin }: { r: number; position: [number, number, number]; spin: React.RefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -spin.current;
  });
  return (
    <group position={position} ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.28, 28]} />
        <meshStandardMaterial color="#111114" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.62, r * 0.62, 0.3, 6]} />
        <meshStandardMaterial color="#BFC3CC" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

type Props = {
  bodyStyle: BodyStyle;
  color: string;
  accent: string;
  /** Wheel spin speed (radians/sec) — used by the onboarding "drive-in" animation. */
  wheelSpeed?: number;
};

export function CarModel({ bodyStyle, color, accent, wheelSpeed = 0 }: Props) {
  const p = PROFILES[bodyStyle];
  const bodyGeo = useMemo(() => extrude(p.body, p.width - 0.16, 0.08), [p]);
  const glassGeo = useMemo(() => extrude(p.glass, p.width - p.glassInset, 0.05), [p]);

  const paint = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color, metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }),
    // material is created once; color is animated in useFrame below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const target = useMemo(() => new THREE.Color(), []);
  const spin = useRef(0);

  useFrame((_, dt) => {
    // Smooth paint transition when the user picks a new color.
    paint.color.lerp(target.set(color), Math.min(1, dt * 6));
    spin.current += wheelSpeed * dt;
  });

  const halfW = p.width / 2 + 0.02;
  const front = Math.max(...p.body.map(([x]) => x));
  const rear = Math.min(...p.body.map(([x]) => x));

  return (
    <group>
      <mesh geometry={bodyGeo} material={paint} castShadow />
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial color="#0B0F18" metalness={0.2} roughness={0.05} clearcoat={1} transparent opacity={0.92} />
      </mesh>

      {/* Headlights + LED strip in brand accent */}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[front - 0.02, p.lightY, s * (p.width / 2 - 0.32)]}>
          <boxGeometry args={[0.08, 0.1, 0.42]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#EAF4FF" emissiveIntensity={2.5} />
        </mesh>
      ))}
      <mesh position={[front + 0.01, p.lightY - 0.12, 0]}>
        <boxGeometry args={[0.04, 0.03, p.width - 0.5]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={3} />
      </mesh>
      {/* Full-width tail light */}
      <mesh position={[rear + 0.01, p.lightY + 0.04, 0]}>
        <boxGeometry args={[0.06, 0.07, p.width - 0.3]} />
        <meshStandardMaterial color="#FF2240" emissive="#FF1030" emissiveIntensity={2.5} />
      </mesh>

      {p.wheelX.flatMap((x) =>
        [-1, 1].map((s) => (
          <Wheel key={`${x}${s}`} r={p.wheelR} position={[x, p.wheelR, s * halfW]} spin={spin} />
        )),
      )}
    </group>
  );
}
