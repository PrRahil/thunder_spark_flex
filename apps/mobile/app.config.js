const config = {
  expo: {
    name: 'Thunder',
    slug: 'thunder-app',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'thunder',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.thunder.app',
    },
    android: {
      package: 'com.thunder.app',
      adaptiveIcon: {
        backgroundColor: '#FACC15',
      },
    },
    web: {
      bundler: 'metro',
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-font'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
      eas: {
        projectId: 'thunder-mvp',
      },
    },
  },
};

export default config;
