declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_SUPABASE_REDIRECT_SCHEME?: string;
    EXPO_PUBLIC_SUPABASE_REDIRECT_HOST?: string;
  }
}
