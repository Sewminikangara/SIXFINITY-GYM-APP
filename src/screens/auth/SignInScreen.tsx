import { useState, useRef, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Animated, KeyboardAvoidingView, Platform, ScrollView, ImageBackground, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Screen, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { palette, spacing, typography, shadows } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

type SignInNavigation = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export const SignInScreen = () => {
  const navigation = useNavigation<SignInNavigation>();
  const { signIn, signInWithProvider, signInWithBiometrics, biometricsAvailable, biometricsEnabled } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInForm) => {
    setSubmitting(true);
    const result = await signIn(values);
    setSubmitting(false);

    if (!result.success && result.error) {
      Alert.alert('Sign in failed', result.error);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithProvider('google');
    setGoogleLoading(false);

    if (!result.success && result.error) {
      if (result.error.includes('exchange external code') || result.error.includes('not enabled')) {
        Alert.alert(
          'Google Sign-In Not Configured',
          'Google authentication is not yet set up. Please use email/password to sign in, or contact support to enable Google Sign-In.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Google Sign-In Failed', result.error);
      }
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const result = await signInWithProvider('apple');
    setAppleLoading(false);

    if (!result.success && result.error) {
      if (result.error.includes('not enabled') || result.error.includes('Provider')) {
        Alert.alert(
          'Apple Sign-In Not Configured',
          'Apple authentication is not yet set up. Please use email/password to sign in, or contact support to enable Apple Sign-In.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Apple Sign-In Failed', result.error);
      }
    }
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    const result = await signInWithBiometrics();
    setBiometricLoading(false);

    if (!result.success && result.error) {
      Alert.alert('Biometric Authentication Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Background */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=600&fit=crop' }}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(18, 18, 18, 0.75)', '#121212']}
          locations={[0, 0.6]}
          style={styles.gradientOverlay}
        />
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.loginLabel}>Log in</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Email Address"
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forget password?</Text>
              </TouchableOpacity>

              {/* Log In Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSubmit(onSubmit)}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[palette.neonGreen, palette.neonGreenDim]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.loginButtonText}>
                    {submitting ? 'Logging in...' : 'Log in'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Biometric Sign-In Button (if available and enabled) */}
              {biometricsAvailable && biometricsEnabled && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricSignIn}
                  disabled={biometricLoading}
                  activeOpacity={0.7}
                >
                  {biometricLoading ? (
                    <ActivityIndicator size="small" color={palette.neonGreen} />
                  ) : (
                    <>
                      <Text style={styles.biometricIcon}>🔒</Text>
                      <Text style={styles.biometricText}>
                        Use {Platform.OS === 'ios' ? 'Touch ID / Face ID' : 'Biometric'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Social Buttons */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={palette.textPrimary} />
                ) : (
                  <>
                    <Text style={styles.socialIcon}>G</Text>
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Sign-In - Only show on iOS and when properly configured */}
              {Platform.OS === 'ios' && false && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleAppleSignIn}
                  disabled={appleLoading}
                  activeOpacity={0.7}
                >
                  {appleLoading ? (
                    <ActivityIndicator size="small" color={palette.textPrimary} />
                  ) : (
                    <>
                      <Text style={styles.socialIcon}></Text>
                      <Text style={styles.socialButtonText}>Continue with Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton}>
              <LinearGradient
                colors={[palette.neonGreen, palette.neonGreenDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl : spacing.xxl,
    paddingBottom: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  backIcon: {
    fontSize: 24,
    color: palette.textPrimary,
  },
  backText: {
    ...typography.body,
    color: palette.textPrimary,
  },
  content: {
    flex: 1,
    gap: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  loginLabel: {
    ...typography.heading1,
    fontSize: 36,
    color: palette.textPrimary,
    fontWeight: '800',
  },
  form: {
    gap: spacing.lg,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    ...typography.caption,
    color: palette.textSecondary,
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...shadows.neonGlow,
  },
  gradientButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    ...typography.subtitle,
    fontSize: 18,
    color: palette.background,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  dividerText: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  socialIcon: {
    fontSize: 20,
    color: palette.textPrimary,
    fontWeight: '700',
  },
  socialButtonText: {
    ...typography.body,
    color: palette.textPrimary,
    fontSize: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.neonGreen,
    marginBottom: spacing.sm,
  },
  biometricIcon: {
    fontSize: 18,
  },
  biometricText: {
    ...typography.caption,
    color: palette.neonGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 'auto',
    ...shadows.neonGlow,
  },
  nextButtonText: {
    ...typography.subtitle,
    fontSize: 18,
    color: palette.background,
    fontWeight: '700',
  },
});
