import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { brand, type BrandTheme } from './brand';

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;
export const font = {
  hero: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6 },
};

type Theme = { colors: BrandTheme; spacing: typeof spacing; radius: typeof radius; font: typeof font };

const ThemeContext = createContext<Theme | null>(null);

/** Colors come from brand/brand.json; `override` allows remote theming (e.g. seasonal campaigns). */
export function ThemeProvider({ children, override }: { children: ReactNode; override?: Partial<BrandTheme> }) {
  const value = useMemo<Theme>(
    () => ({ colors: { ...brand.theme, ...override }, spacing, radius, font }),
    [override],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** '#7C5CFF' + 0.2 -> 'rgba(124,92,255,0.2)' */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
