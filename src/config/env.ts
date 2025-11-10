import Constants from 'expo-constants';

type EnvExtra = Partial<{
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseRedirectScheme: string;
  supabaseRedirectHost: string;
  nutritionixAppId: string;
  nutritionixAppKey: string;
  fatsecretClientId: string;
  fatsecretClientSecret: string;
  usdaApiKey: string;
  geminiApiKey: string;
}>;

const extra = (Constants.expoConfig?.extra ?? {}) as EnvExtra;

const publicEnv = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  supabaseRedirectScheme: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_SCHEME,
  supabaseRedirectHost: process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_HOST,
  nutritionixAppId: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID,
  nutritionixAppKey: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_KEY,
  fatsecretClientId: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID,
  fatsecretClientSecret: process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET,
  usdaApiKey: process.env.EXPO_PUBLIC_USDA_API_KEY,
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
};

export const env = {
  supabaseUrl: extra.supabaseUrl ?? publicEnv.supabaseUrl ?? '',
  supabaseAnonKey: extra.supabaseAnonKey ?? publicEnv.supabaseAnonKey ?? '',
  supabaseRedirectScheme: extra.supabaseRedirectScheme ?? publicEnv.supabaseRedirectScheme ?? 'gymapp',
  supabaseRedirectHost: extra.supabaseRedirectHost ?? publicEnv.supabaseRedirectHost ?? 'auth',
  nutritionixAppId: extra.nutritionixAppId ?? publicEnv.nutritionixAppId ?? '',
  nutritionixAppKey: extra.nutritionixAppKey ?? publicEnv.nutritionixAppKey ?? '',
  fatsecretClientId: extra.fatsecretClientId ?? publicEnv.fatsecretClientId ?? '',
  fatsecretClientSecret: extra.fatsecretClientSecret ?? publicEnv.fatsecretClientSecret ?? '',
  usdaApiKey: extra.usdaApiKey ?? publicEnv.usdaApiKey ?? 'DEMO_KEY',
  geminiApiKey: extra.geminiApiKey ?? publicEnv.geminiApiKey ?? '',
};

export const validateEnv = () => {
  const missing: string[] = [];

  if (!env.supabaseUrl) missing.push('SUPABASE_URL');
  if (!env.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables: ${missing.join(', ')}. ` +
      'Create a .env file based on .env.example before running the app.',
    );
  }
};
