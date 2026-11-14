import Svg, { Circle, Defs, LinearGradient, Polygon, Stop, Ellipse } from 'react-native-svg';
import type { BodyStyle } from '@/data/types';
import { PROFILES, type Pt } from './profiles';

/** Lightweight 2D side view built from the same profile as the 3D model — cheap enough for lists. */
export function CarSilhouette({ bodyStyle, color, width = 220 }: { bodyStyle: BodyStyle; color: string; width?: number }) {
  const p = PROFILES[bodyStyle];
  // world units -> svg: x in [-2.6, 2.6], y in [0, 2.3] (flipped)
  const W = 5.2;
  const H = 2.4;
  const pts = (arr: Pt[]) => arr.map(([x, y]) => `${x + W / 2},${H - y}`).join(' ');
  const gid = `paint-${bodyStyle}-${color.replace('#', '')}`;
  return (
    <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <Stop offset="0.35" stopColor={color} stopOpacity="1" />
          <Stop offset="1" stopColor={color} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={W / 2} cy={H - 0.02} rx={2.4} ry={0.08} fill="#000" opacity={0.5} />
      <Polygon points={pts(p.body)} fill={color} />
      <Polygon points={pts(p.body)} fill={`url(#${gid})`} />
      <Polygon points={pts(p.glass)} fill="#0B0F18" opacity={0.92} />
      {p.wheelX.map((x) => (
        <Circle key={x} cx={x + W / 2} cy={H - p.wheelR} r={p.wheelR} fill="#111114" stroke="#2A2A33" strokeWidth={0.03} />
      ))}
      {p.wheelX.map((x) => (
        <Circle key={`r${x}`} cx={x + W / 2} cy={H - p.wheelR} r={p.wheelR * 0.58} fill="#BFC3CC" />
      ))}
    </Svg>
  );
}
