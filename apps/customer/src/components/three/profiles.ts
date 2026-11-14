import type { BodyStyle } from '@/data/types';

export type Pt = [number, number];
export type Profile = {
  body: Pt[]; // side silhouette of the body (x = length, y = height)
  glass: Pt[]; // side silhouette of the glasshouse
  width: number;
  glassInset: number; // glass extrusion = width - inset (negative = wider, e.g. van side windows)
  wheelR: number;
  wheelX: [number, number];
  lightY: number;
};

/**
 * Procedural low-poly car silhouettes. Each body style is a side profile that is
 * extruded across the car's width with a bevel, which reads as a sculpted car body
 * without shipping any model files. Tenants can replace these with real GLB models.
 */
export const PROFILES: Record<BodyStyle, Profile> = {
  sedan: {
    body: [[-2.2, 0.3], [-2.28, 0.62], [-2.0, 0.84], [-1.2, 0.88], [1.15, 0.86], [2.05, 0.72], [2.28, 0.52], [2.2, 0.3]],
    glass: [[-1.35, 0.86], [-0.75, 1.32], [0.4, 1.34], [1.15, 0.86]],
    width: 1.8, glassInset: 0.22, wheelR: 0.36, wheelX: [1.4, -1.4], lightY: 0.66,
  },
  suv: {
    body: [[-2.25, 0.42], [-2.3, 0.95], [-2.15, 1.1], [1.25, 1.1], [2.15, 0.98], [2.3, 0.7], [2.25, 0.42]],
    glass: [[-2.1, 1.08], [-2.0, 1.72], [0.75, 1.75], [1.3, 1.1]],
    width: 1.95, glassInset: 0.16, wheelR: 0.46, wheelX: [1.45, -1.45], lightY: 0.88,
  },
  sport: {
    body: [[-2.1, 0.24], [-2.2, 0.55], [-1.6, 0.74], [-0.2, 0.76], [1.1, 0.68], [2.15, 0.48], [2.25, 0.36], [2.1, 0.24]],
    glass: [[-1.55, 0.74], [-0.55, 1.12], [0.25, 1.12], [0.95, 0.7]],
    width: 1.85, glassInset: 0.3, wheelR: 0.34, wheelX: [1.45, -1.35], lightY: 0.55,
  },
  van: {
    body: [[-2.4, 0.42], [-2.42, 2.05], [1.35, 2.08], [2.3, 1.15], [2.38, 0.42]],
    glass: [[-2.15, 1.38], [-2.15, 1.85], [1.28, 1.86], [1.95, 1.3]],
    width: 1.9, glassInset: -0.04, wheelR: 0.4, wheelX: [1.55, -1.6], lightY: 0.95,
  },
};
