import { useState, useRef, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Animated, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';

import { Button, Screen, TextField } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { AuthStackParamList } from '@/navigation/types';
import { palette, spacing, typography, shadows } from '@/theme';

const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

type SignUpNavigation = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export const SignUpScreen = () => {
  const navigation = useNavigation<SignUpNavigation>();
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
  } = useForm<SignUpForm>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async ({ fullName, email, password }: SignUpForm) => {
    setSubmitting(true);
    const result = await signUp({ fullName, email, password });
    setSubmitting(false);

    if (!result.success && result.error) {
      Alert.alert('Create account failed', result.error);
      return;
    }

    if (result.needsVerification) {
      Alert.alert('Check your inbox', 'Verify your email address to finish creating your account.');
      navigation.navigate('VerifyEmail', { email });
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Let’s personalize your training with a few simple steps.</Text>
      </View>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField label="Full name" onBlur={onBlur} onChangeText={onChange} value={value} error={errors.fullName?.message} />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
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

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Confirm password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button label="Create account" onPress={handleSubmit(onSubmit)} loading={submitting} />
    </Screen>
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
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  signUpLabel: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 14,
  },
  title: {
    ...typography.heading1,
    fontSize: 36,
    color: palette.textPrimary,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    fontSize: 16,
  },
  form: {
    gap: spacing.lg,
  },
  continueButton: {
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
  continueButtonText: {
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
    textTransform: 'capitalize',
  },
  footerQuote: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  quoteText: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
