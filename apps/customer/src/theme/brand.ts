import Constants from 'expo-constants';

export type BrandTheme = {
  mode: 'dark' | 'light';
  primary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
};

export type Brand = {
  name: string;
  tagline: string;
  scheme: string;
  currency: string;
  theme: BrandTheme;
};

/** Marketplace brand, loaded from brand/brand.json via app.config.ts. */
export const brand: Brand = Constants.expoConfig?.extra?.brand;
