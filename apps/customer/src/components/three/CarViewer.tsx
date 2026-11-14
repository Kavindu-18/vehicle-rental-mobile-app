import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { Suspense, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import * as THREE from 'three';
import type { BodyStyle } from '@/data/types';
import { CarModel } from './CarModel';

type Controls = { yaw: number; yawVelocity: number; zoom: number; dragging: boolean };

function Stage({ accent }: { accent: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current) {
      const m = ring.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.6 + Math.sin(clock.elapsedTime * 2) * 0.6; // breathing glow
    }
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[3.6, 64]} />
        <meshStandardMaterial color="#0C0C12" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.55, 3.68, 96]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} />
      </mesh>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} scale={[1, 0.45, 1]}>
        <circleGeometry args={[2.6, 48]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Rig({
  controls,
  autoRotate,
  children,
}: {
  controls: React.RefObject<Controls>;
  autoRotate: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const intro = useRef(0);

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c.dragging) {
      // inertia after a flick, decaying into a slow showroom spin
      c.yaw += c.yawVelocity * dt;
      c.yawVelocity *= Math.pow(0.04, dt);
      if (autoRotate && Math.abs(c.yawVelocity) < 0.3) c.yaw += 0.25 * dt;
    }
    if (group.current) group.current.rotation.y = c.yaw;

    // cinematic intro dolly + pinch zoom
    intro.current = Math.min(1, intro.current + dt * 0.8);
    const ease = 1 - Math.pow(1 - intro.current, 3);
    const dist = THREE.MathUtils.lerp(11, 7.2, ease) / c.zoom;
    camera.position.lerp(new THREE.Vector3(dist * 0.72, 1.4 + dist * 0.22, dist * 0.7), Math.min(1, dt * 8));
    camera.lookAt(0, 0.75, 0);
  });

  return <group ref={group}>{children}</group>;
}

type Props = {
  bodyStyle: BodyStyle;
  color: string;
  accent: string;
  autoRotate?: boolean;
  interactive?: boolean;
  wheelSpeed?: number;
  style?: ViewStyle;
};

/** Interactive 360° showroom: drag to spin (with inertia), pinch to zoom. */
export function CarViewer({ bodyStyle, color, accent, autoRotate = true, interactive = true, wheelSpeed, style }: Props) {
  const controls = useRef<Controls>({ yaw: -0.6, yawVelocity: 0, zoom: 1, dragging: false });
  const pinchBase = useRef(1);

  const pan = usePanGesture({
    runOnJS: true,
    enabled: interactive,
    activeOffsetX: [-8, 8],
    failOffsetY: [-20, 20], // let vertical scroll through
    onBegin: () => {
      controls.current.dragging = true;
      controls.current.yawVelocity = 0;
    },
    onUpdate: (e) => {
      controls.current.yaw += e.changeX * 0.012;
    },
    onFinalize: (e) => {
      controls.current.dragging = false;
      if ('velocityX' in e) controls.current.yawVelocity = (e.velocityX as number) * 0.006;
    },
  });

  const pinch = usePinchGesture({
    runOnJS: true,
    enabled: interactive,
    onBegin: () => {
      pinchBase.current = controls.current.zoom;
    },
    onUpdate: (e) => {
      controls.current.zoom = THREE.MathUtils.clamp(pinchBase.current * e.scale, 0.75, 1.8);
    },
  });

  const gesture = useSimultaneousGestures(pan, pinch);

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.fill, style]} collapsable={false}>
        <Canvas camera={{ fov: 32, position: [8, 3.5, 8] }} style={styles.fill}>
          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#DDE6FF', '#0A0A10', 0.6]} />
          <directionalLight position={[5, 8, 4]} intensity={2.4} />
          <directionalLight position={[-6, 3, -4]} intensity={1.1} color={accent} />
          <pointLight position={[0, 4, -5]} intensity={18} color="#9FB4FF" distance={14} />
          <Suspense fallback={null}>
            <Rig controls={controls} autoRotate={autoRotate}>
              <CarModel bodyStyle={bodyStyle} color={color} accent={accent} wheelSpeed={wheelSpeed} />
            </Rig>
            <Stage accent={accent} />
          </Suspense>
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
