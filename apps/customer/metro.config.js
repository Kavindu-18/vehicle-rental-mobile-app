// Learn more: https://docs.expo.dev/guides/customizing-metro
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three >= 0.18x's CommonJS build calls Node's `process.emitWarning`, which doesn't exist in
// React Native and crashes on load. @react-three/fiber `require`s it, so route every import of
// `three` to the ES module build. This also guarantees a single copy of three in the bundle.
// (three's "exports" map hides build/ subpaths, so locate it next to the CJS entry.)
const threeModule = path.join(path.dirname(require.resolve('three', { paths: [__dirname] })), 'three.module.js');

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeModule };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
