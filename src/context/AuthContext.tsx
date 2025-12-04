import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User, Provider } from '@supabase/supabase-js';
import { PropsWithChildren, ReactElement, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';
import { supabase } from '@/config/supabaseClient';
import * as WebAPI from '@/services/webApiService';

export type AuthStatus = 'loading' | 'signedOut' | 'onboarding' | 'signedIn';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpPayload extends Credentials {
  fullName: string;
  phone?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
}

export interface OTPVerifyPayload {
  token: string;
  type: 'email' | 'sms' | 'signup' | 'reset';
  email?: string;
  phone?: string;
}

export interface OTPSendPayload {
  email?: string;
  phone?: string;
  type: 'email' | 'sms';
}

export interface ResetPasswordWithOTPPayload {
  token: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface OnboardingProfile {
  // Personal Information
  fullName: string;
  age: number;
  gender?: string;

  // Body Metrics
  heightCm: number;
  heightUnit?: string;
  weightKg: number;
  weightUnit?: string;
  goalWeightKg?: number;
  bodyType?: string;

  // Occupation
  occupation?: string;
  occupationCustom?: string;
  jobActivityLevel?: string;

  // Fitness Goals
  primaryGoal: string;
  goalTimeline?: string;

  // Workout Preferences
  workoutEnvironment?: string;
  workoutTypes?: string[];
  equipmentAccess?: string;
  sessionDuration?: string;
  weeklyWorkoutDays?: string;

  // Health Assessment
  activityLevel: string;
  medicalConditions?: string[];
  medicalConditionsOther?: string;
  currentSymptoms?: string[];
  pastInjuries?: boolean;
  injuryDetails?: string;

  // Nutrition Preferences
  dietaryRestrictions?: string[];
  dietaryRestrictionsOther?: string;
  foodAllergies?: boolean;
  foodAllergyList?: string;
  mealsPerDay?: string;
  mealBudget?: string;
  cuisinePreference?: string;

  // Lifestyle
  sleepHours?: string;
  stressLevel?: string;
  smokesOrDrinks?: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  loading: boolean;
  session: Session | null;
  user: User | null;
  onboardingComplete: boolean;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  signIn: (credentials: Credentials) => Promise<AuthActionResult>;
  signUp: (payload: SignUpPayload) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  resendVerification: (email: string) => Promise<AuthActionResult>;
  signInWithProvider: (provider: Provider) => Promise<AuthActionResult>;
  enableBiometrics: () => Promise<AuthActionResult>;
  disableBiometrics: () => Promise<void>;
  signInWithBiometrics: () => Promise<AuthActionResult>;
  completeOnboarding: (profile: OnboardingProfile) => Promise<void>;
  verifyOTP: (payload: OTPVerifyPayload) => Promise<AuthActionResult>;
  resendOTP: (payload: OTPSendPayload) => Promise<AuthActionResult>;
  sendOTP: (payload: OTPSendPayload) => Promise<AuthActionResult>;
  resetPasswordWithOTP: (payload: ResetPasswordWithOTPPayload) => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_STORAGE_KEY = '@gymapp/auth/session';
const ONBOARDING_STORAGE_KEY = '@gymapp/auth/onboarding';
const BIOMETRIC_STORAGE_KEY = '@gymapp/auth/biometric-enabled';
const BIOMETRIC_TOKEN_KEY = 'com.gymapp.biometric.refresh-token';

const redirectUrl = `${env.supabaseRedirectScheme}://${env.supabaseRedirectHost}`;

WebBrowser.maybeCompleteAuthSession();

const resolveStatus = (session: Session | null, onboardingComplete: boolean, loading: boolean): AuthStatus => {
  if (loading) {
    return 'loading';
  }

  // No session = user not logged in
  if (!session) {
    return 'signedOut';
  }

  // Has session - check if onboarding is complete
  return onboardingComplete ? 'signedIn' : 'onboarding';
};

export const AuthProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // Start as true, change to false only when user needs it
  const [initializing, setInitializing] = useState(true);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const onboardingRef = useRef(true); // Start as true

  const updateStatus = useCallback(
    (nextSession: Session | null, onboarding: boolean, loading: boolean) => {
      setStatus(resolveStatus(nextSession, onboarding, loading));
    },
    [],
  );

  const persistSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession) {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  const loadStoredSession = useCallback(async () => {
    console.log('🔄 Loading stored session...');
    try {
      const [storedSession, storedOnboarding, storedBiometric] = await Promise.all([
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY),
      ]);

      console.log('📦 Stored data:', {
        hasSession: !!storedSession,
        onboarding: storedOnboarding,
        biometric: storedBiometric,
      });

      setBiometricsEnabled(storedBiometric === 'true');

      if (storedSession) {
        const parsedSession: Session = JSON.parse(storedSession);

        if (parsedSession?.access_token && parsedSession?.refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token,
          });

          if (!error && data.session) {
            await persistSession(data.session);

            // Load onboarding status from AsyncStorage ONLY if there's a session
            const onboarding = storedOnboarding === 'true';
            onboardingRef.current = onboarding;
            setOnboardingComplete(onboarding);
            console.log('✅ Session restored, onboarding:', onboarding);
            // Don't query database on app startup - use cached value
            // Database will be checked on next sign-in
          } else if (error) {
            console.warn('Unable to restore Supabase session', error.message);
            await persistSession(null);
            // No session - ensure onboarding is true (so we show auth screens, not onboarding)
            onboardingRef.current = true;
            setOnboardingComplete(true);
            console.log('⚠️ Session restore failed, showing auth screens');
          }
        }
      } else {
        // No stored session - user is signed out
        // Set onboarding to true so status resolves to 'signedOut' not 'onboarding'
        onboardingRef.current = true;
        setOnboardingComplete(true);
        console.log('📭 No stored session, user signed out');
      }
    } catch (error) {
      console.warn('Failed to restore authentication session', error);
      await persistSession(null);
      onboardingRef.current = true;
      setOnboardingComplete(true);
    } finally {
      console.log('✅ Session loading complete, setting initializing to false');
      setInitializing(false);
    }
  }, [persistSession]); const registerAuthChangeListener = useCallback(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (nextSession) {
        await persistSession(nextSession);
        // Don't check database here - it's checked on sign-in/sign-up
        // This prevents redundant queries and race conditions
      } else {
        await persistSession(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [persistSession]); const handleDeepLink = useCallback(
    async (url: string) => {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        const errorDescription = parsed.searchParams.get('error_description');

        if (errorDescription) {
          Alert.alert('Authentication error', decodeURIComponent(errorDescription));
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            Alert.alert('Authentication error', error.message);
            return;
          }

          if (data.session) {
            await persistSession(data.session);
          }
        }
      } catch (error) {
        console.warn('Failed to handle deep link', error);
      }
    },
    [persistSession],
  );

  useEffect(() => {
    loadStoredSession();
    const unsubscribe = registerAuthChangeListener();

    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    let isMounted = true;

    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isMounted) {
          return;
        }

        const available = hasHardware && isEnrolled;
        setBiometricsAvailable(available);

        if (!available) {
          setBiometricsEnabled(false);
          await AsyncStorage.removeItem(BIOMETRIC_STORAGE_KEY);
          await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
        }
      } catch (error) {
        console.warn('Failed to check biometric availability', error);
      }
    })();

    return () => {
      unsubscribe();
      subscription.remove();
      isMounted = false;
    };
  }, [handleDeepLink, loadStoredSession, registerAuthChangeListener]);

  useEffect(() => {
    updateStatus(session, onboardingComplete, initializing);
    console.log('📊 Auth Status Update:', {
      hasSession: !!session,
      onboardingComplete,
      initializing,
      status: resolveStatus(session, onboardingComplete, initializing),
    });
  }, [session, onboardingComplete, initializing, updateStatus]);

  const signIn = useCallback(
    async ({ email, password }: Credentials): Promise<AuthActionResult> => {
      try {
        // Sign in with SUPABASE only
        // Web system sync already happened during onboarding
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session && data.user) {
          await persistSession(data.session);

          // Always check database for onboarding status on sign-in
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', data.user.id)
              .single();

            if (!profileError && profile) {
              const isComplete = profile.onboarding_completed === true;
              onboardingRef.current = isComplete;
              setOnboardingComplete(isComplete);
              await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, isComplete ? 'true' : 'false');
            } else {
              // Profile doesn't exist or query failed - assume onboarding needed
              console.warn('Could not fetch profile, assuming onboarding needed:', profileError);
              onboardingRef.current = false;
              setOnboardingComplete(false);
              await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
            }
          } catch (err) {
            console.warn('Error checking onboarding status:', err);
            // On error, default to needing onboarding
            onboardingRef.current = false;
            setOnboardingComplete(false);
            await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
          }
        }

        return { success: true };
      } catch (error: any) {
        console.error('❌ Sign in error:', error);
        return { success: false, error: error.message || 'Sign in failed' };
      }
    },
    [persistSession],
  ); const signUp = useCallback(
    async ({ email, password, fullName }: SignUpPayload): Promise<AuthActionResult> => {
      try {
        // Sign up with SUPABASE only
        // Web system sync will happen AFTER onboarding completes
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session && data.user) {
          await persistSession(data.session);

          // Create profile row immediately with onboarding_completed = false
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                full_name: fullName,
                onboarding_completed: false,
              });

            if (profileError && !profileError.message.includes('duplicate')) {
              console.warn('Failed to create profile:', profileError);
            }
          } catch (err) {
            console.warn('Profile creation error:', err);
          }

          // New user - onboarding NOT complete
          onboardingRef.current = false;
          setOnboardingComplete(false);
          await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');

          return { success: true };
        }

        return { success: true, needsVerification: true };
      } catch (error: any) {
        console.error('❌ Sign up error:', error);
        return { success: false, error: error.message || 'Sign up failed' };
      }
    },
    [persistSession],
  ); const signOut = useCallback(async () => {
    // Clear Supabase session
    await supabase.auth.signOut();
    await persistSession(null);

    // Clear web system tokens
    try {
      await SecureStore.deleteItemAsync('web_access_token');
      await SecureStore.deleteItemAsync('web_refresh_token');
      await AsyncStorage.removeItem('web_user_data');
      console.log('✅ Cleared web system tokens');
    } catch (error) {
      console.warn('Error clearing web tokens:', error);
    }
  }, [persistSession]);

  const resetPassword = useCallback(async (email: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, []);

  const openAuthBrowser = useCallback(
    async (url?: string) => {
      if (!url) {
        return;
      }

      try {
        const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

        if (result.type === 'success' && result.url) {
          await handleDeepLink(result.url);
        }

        if (result.type === 'cancel' || result.type === 'dismiss') {
          return;
        }
      } catch (error) {
        console.warn('Falling back to Linking for OAuth', error);
        await Linking.openURL(url);
      }
    },
    [handleDeepLink],
  );

  const signInWithProvider = useCallback(
    async (provider: Provider): Promise<AuthActionResult> => {
      try {
        // Handle Apple Sign-In with native implementation
        if (provider === 'apple') {
          const { signInWithApple } = await import('../utils/appleAuth');
          const result = await signInWithApple();

          if (!result.success) {
            return result;
          }

          // Check onboarding status after successful Apple sign-in
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();

              if (!profileError && profile) {
                const isComplete = profile.onboarding_completed === true;
                onboardingRef.current = isComplete;
                setOnboardingComplete(isComplete);
                await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, isComplete ? 'true' : 'false');
              } else {
                // Profile doesn't exist - create it and set onboarding needed
                await supabase.from('profiles').insert({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.user_metadata?.full_name || '',
                  onboarding_completed: false,
                });
                onboardingRef.current = false;
                setOnboardingComplete(false);
                await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
              }
            } catch (err) {
              console.warn('Error checking onboarding status:', err);
              onboardingRef.current = false;
              setOnboardingComplete(false);
              await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'false');
            }
          }

          return { success: true };
        }

        // Handle Google Sign-In with OAuth browser flow
        if (provider === 'google') {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          await openAuthBrowser(data?.url);
          return { success: true };
        }

        // Fallback for other providers
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        await openAuthBrowser(data?.url);
        return { success: true };
      } catch (error: any) {
        console.error('Provider sign-in error:', error);
        return { success: false, error: error.message || 'Failed to sign in' };
      }
    },
    [openAuthBrowser],
  );

  const completeOnboarding = useCallback(async (profile: OnboardingProfile) => {
    try {
      // Update local state
      onboardingRef.current = true;
      setOnboardingComplete(true);

      // Save to AsyncStorage for offline persistence
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');

      // Save to Supabase database - all 31+ fields
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            // Personal Information
            full_name: profile.fullName,
            age: profile.age,
            gender: profile.gender,

            // Body Metrics
            height_cm: profile.heightCm,
            height_unit: profile.heightUnit || 'cm',
            weight_kg: profile.weightKg,
            weight_unit: profile.weightUnit || 'kg',
            goal_weight_kg: profile.goalWeightKg,
            body_type: profile.bodyType,

            // Occupation
            occupation: profile.occupation,
            occupation_custom: profile.occupationCustom,
            job_activity_level: profile.jobActivityLevel,

            // Fitness Goals
            primary_goal: profile.primaryGoal,
            goal_timeline: profile.goalTimeline,

            // Workout Preferences
            workout_environment: profile.workoutEnvironment,
            workout_types: profile.workoutTypes,
            equipment_access: profile.equipmentAccess,
            session_duration: profile.sessionDuration,
            weekly_workout_days: profile.weeklyWorkoutDays,

            // Health Assessment
            activity_level: profile.activityLevel,
            medical_conditions: profile.medicalConditions,
            medical_conditions_other: profile.medicalConditionsOther,
            current_symptoms: profile.currentSymptoms,
            past_injuries: profile.pastInjuries,
            injury_details: profile.injuryDetails,

            // Nutrition Preferences
            dietary_restrictions: profile.dietaryRestrictions,
            dietary_restrictions_other: profile.dietaryRestrictionsOther,
            food_allergies: profile.foodAllergies,
            food_allergy_list: profile.foodAllergyList,
            meals_per_day: profile.mealsPerDay,
            meal_budget: profile.mealBudget,
            cuisine_preference: profile.cuisinePreference,

            // Lifestyle
            sleep_hours: profile.sleepHours,
            stress_level: profile.stressLevel,
            smokes_or_drinks: profile.smokesOrDrinks,

            // Mark onboarding as complete
            onboarding_completed: true,
          })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to save onboarding to database:', error);
          throw error;
        }

        // 🌐 SYNC WITH WEB SYSTEM after onboarding complete
        console.log('🌐 Syncing user data with web system...');
        try {
          // First, register user in web system if not already registered
          const webToken = await SecureStore.getItemAsync('web_access_token');

          if (!webToken && user.email) {
            // User not in web system yet - register them now
            const signupResult = await WebAPI.signup({
              fullName: profile.fullName,
              email: user.email,
              password: 'temp_password_' + Date.now(), // Temporary password
              role: 'member',
            });

            if (signupResult.success) {
              await SecureStore.setItemAsync('web_access_token', signupResult.data.tokens.accessToken);
              await SecureStore.setItemAsync('web_refresh_token', signupResult.data.tokens.refreshToken);
              console.log('✅ User registered in web system!');
            }
          }

          // Send complete profile data to web system
          const accessToken = await SecureStore.getItemAsync('web_access_token');
          if (accessToken) {
            await WebAPI.authenticatedRequest('/api/members/profile', accessToken, {
              method: 'PUT',
              body: JSON.stringify({
                fullName: profile.fullName,
                age: profile.age,
                gender: profile.gender,
                height: profile.heightCm,
                weight: profile.weightKg,
                goalWeight: profile.goalWeightKg,
                primaryGoal: profile.primaryGoal,
                activityLevel: profile.activityLevel,
                // Add more fields as needed by web API
              }),
            });
            console.log('✅ Profile synced with web system!');
          }
        } catch (webError: any) {
          // Don't block onboarding if web sync fails
          console.log('⚠️ Web system sync failed (will retry later):', webError.message);
        }
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  }, [user]);

  const enableBiometrics = useCallback(async (): Promise<AuthActionResult> => {
    if (!session?.refresh_token) {
      return { success: false, error: 'No active session to secure with biometrics.' };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!(hasHardware && isEnrolled)) {
        return { success: false, error: 'Biometric authentication is not available on this device.' };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        cancelLabel: 'Cancel',
      });

      if (!authResult.success) {
        return { success: false, error: 'Biometric authentication was canceled.' };
      }

      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, session.refresh_token, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });

      await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'true');
      setBiometricsEnabled(true);
      return { success: true };
    } catch (error) {
      console.warn('Failed to enable biometrics', error);
      return { success: false, error: 'Unable to enable biometric authentication.' };
    }
  }, [session]);

  const disableBiometrics = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    setBiometricsEnabled(false);
  }, []);

  const signInWithBiometrics = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!(hasHardware && isEnrolled)) {
        await disableBiometrics();
        return { success: false, error: 'Biometric authentication is not available on this device.' };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with biometrics',
        cancelLabel: 'Cancel',
      });

      if (!authResult.success) {
        return { success: false, error: 'Biometric authentication was canceled.' };
      }

      const refreshToken = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);

      if (!refreshToken) {
        await disableBiometrics();
        return { success: false, error: 'Biometric login has not been configured.' };
      }

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error) {
        await disableBiometrics();
        return { success: false, error: error.message };
      }

      if (data.session) {
        await persistSession(data.session);
      }

      return { success: true };
    } catch (error) {
      console.warn('Biometric login failed', error);
      return { success: false, error: 'Biometric login failed.' };
    }
  }, [disableBiometrics, persistSession]);

  // OTP Methods
  const sendOTP = useCallback(async ({ email, phone, type }: OTPSendPayload): Promise<AuthActionResult> => {
    try {
      if (type === 'sms' && phone) {
        // SMS OTP using Supabase Phone Auth
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: {
            channel: 'sms',
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } else if (type === 'email' && email) {
        // For email OTP, we'll use the resetPasswordForEmail which sends a 6-digit code
        // when configured properly in Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'sixfinity://reset-password',
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      }

      return { success: false, error: 'Invalid OTP type or missing contact information.' };
    } catch (error: any) {
      console.warn('Failed to send OTP', error);
      return { success: false, error: error.message || 'Failed to send verification code.' };
    }
  }, []);

  const resendOTP = useCallback(async (payload: OTPSendPayload): Promise<AuthActionResult> => {
    return sendOTP(payload);
  }, [sendOTP]);

  const verifyOTP = useCallback(async ({ token, type, email, phone }: OTPVerifyPayload): Promise<AuthActionResult> => {
    try {
      if (phone) {
        // Verify phone OTP
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: 'sms',
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session) {
          await persistSession(data.session);
        }

        return { success: true };
      } else if (email) {
        // Map our app's type to Supabase's OTP type
        let supabaseType: 'email' | 'recovery' | 'signup' = 'email';

        if (type === 'reset') {
          supabaseType = 'recovery'; // Password reset uses 'recovery'
        } else if (type === 'signup') {
          supabaseType = 'signup'; // Email verification uses 'signup'
        } else {
          supabaseType = 'email'; // Default magic link uses 'email'
        }

        // Verify email OTP
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: supabaseType,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session) {
          await persistSession(data.session);
        }

        return { success: true };
      }

      return { success: false, error: 'Invalid verification method.' };
    } catch (error: any) {
      console.warn('Failed to verify OTP', error);
      return { success: false, error: error.message || 'Invalid verification code.' };
    }
  }, [persistSession]);

  const resetPasswordWithOTP = useCallback(async ({ token, password, email, phone }: ResetPasswordWithOTPPayload): Promise<AuthActionResult> => {
    try {
      // First verify the OTP to get a session
      const verifyResult = await verifyOTP({
        token,
        type: phone ? 'sms' : 'email',
        email,
        phone,
      });

      if (!verifyResult.success) {
        return verifyResult;
      }

      // Now update the password using the authenticated session
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.warn('Failed to reset password with OTP', error);
      return { success: false, error: error.message || 'Failed to reset password.' };
    }
  }, [verifyOTP]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      loading: initializing,
      session,
      user,
      onboardingComplete,
      biometricsAvailable,
      biometricsEnabled,
      signIn,
      signUp,
      signOut,
      resetPassword,
      resendVerification,
      signInWithProvider,
      enableBiometrics,
      disableBiometrics,
      signInWithBiometrics,
      completeOnboarding,
      verifyOTP,
      resendOTP,
      sendOTP,
      resetPasswordWithOTP,
    }),
    [
      biometricsAvailable,
      biometricsEnabled,
      completeOnboarding,
      disableBiometrics,
      enableBiometrics,
      initializing,
      onboardingComplete,
      resendVerification,
      session,
      signIn,
      signInWithBiometrics,
      signInWithProvider,
      signOut,
      signUp,
      status,
      resetPassword,
      user,
      verifyOTP,
      resendOTP,
      sendOTP,
      resetPasswordWithOTP,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
