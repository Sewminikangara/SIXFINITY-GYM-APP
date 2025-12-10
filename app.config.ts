// @ts-nocheck

import { ConfigContext, ExpoConfig } from 'expo/config';

type ExpoExtras = {
    apiBaseUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseRedirectScheme: string;
    supabaseRedirectHost: string;
};

const getExtra = (): ExpoExtras => ({
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://ai-gym-project.onrender.com',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    supabaseRedirectScheme: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_SCHEME ?? 'gymapp',
    supabaseRedirectHost: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_HOST ?? 'auth',
});

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'GymApp',
    slug: 'gymapp',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'gymapp',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: false,
        bundleIdentifier: 'com.gymapp',
    },
    android: {
        package: 'com.gymapp',
    },
    web: {
        bundler: 'metro',
    },
    extra: getExtra(),
});
