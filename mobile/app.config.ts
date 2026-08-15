import type { ExpoConfig } from '@expo/config-types';

type Variant = 'development' | 'preview' | 'production';

const variant = (process.env.EAS_BUILD_PROFILE ?? 'development') as Variant;

const variants: Record<Variant, { name: string; androidPackage: string }> = {
  development: {
    name: 'NutriSnap (Dev)',
    androidPackage: 'com.irfan140.NutriSnap.dev',
  },
  preview: {
    name: 'NutriSnap (Preview)',
    androidPackage: 'com.irfan140.NutriSnap.preview',
  },
  production: {
    name: 'NutriSnap',
    androidPackage: 'com.irfan140.NutriSnap',
  },
};

const v = variants[variant];

const config: ExpoConfig = {
  name: v.name,
  slug: 'nutrisnap',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'nutrisnap',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: v.androidPackage,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-font',
    'expo-image',
    'expo-secure-store',
    'expo-web-browser',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'd985a44e-3da0-457d-a618-aaaf8a077bf8',
    },
  },
  owner: 'irfan140',
  updates: {
    url: "https://u.expo.dev/d985a44e-3da0-457d-a618-aaaf8a077bf8",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
};

export default config;
