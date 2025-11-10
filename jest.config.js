module.exports = () => ({
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest/setupAfterEnv.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:expo|@expo|expo-status-bar|expo-modules-core|expo-linking|expo-local-authentication|expo-secure-store|expo-web-browser|@react-native|react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|@react-native-async-storage|@supabase|react-native-vector-icons|react-native-url-polyfill)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
});
