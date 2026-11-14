/// <reference types="node" />
import type { ExpoConfig } from 'expo/config';
import fs from 'node:fs';
import path from 'node:path';

/** Single marketplace brand — rename/recolor the whole app in brand/brand.json. */
const brand = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../brand/brand.json'), 'utf8'));

const config: ExpoConfig = {
  name: brand.name,
  slug: 'rentora',
  scheme: brand.scheme,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: brand.theme.background,
  ios: {
    supportsTablet: false,
    bundleIdentifier: brand.bundleId,
  },
  android: {
    package: brand.bundleId,
    adaptiveIcon: {
      backgroundColor: brand.theme.background,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-image',
    'expo-secure-store',
    'expo-asset',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 160,
        backgroundColor: brand.theme.background,
      },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { brand },
};

export default config;
