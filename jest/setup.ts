import 'react-native-gesture-handler/jestSetup';

jest.mock('@/config/env', () => ({
    env: {
        supabaseUrl: 'https://example.supabase.co',
        supabaseAnonKey: 'anon-key',
        supabaseRedirectScheme: 'gymapp-test',
        supabaseRedirectHost: 'auth',
    },
    validateEnv: jest.fn(),
}));

jest.mock('expo-linking', () => ({
    addEventListener: jest.fn((_type: string, _callback: (event: { url: string }) => void) => ({
        remove: jest.fn(),
    })),
    openURL: jest.fn(),
    getInitialURL: jest.fn(async () => null),
}));

const secureStore: Record<string, string> = {};

jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(async () => true),
    isEnrolledAsync: jest.fn(async () => true),
    authenticateAsync: jest.fn(async () => ({ success: true })),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async (key: string) => secureStore[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
        secureStore[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
        delete secureStore[key];
    }),
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after_first_unlock_this_device_only',
}));

jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: jest.fn(async () => ({ type: 'dismiss' })),
}));
